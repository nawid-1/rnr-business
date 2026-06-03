import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: kaikki markkinointidata
export async function GET() {
  const [{ data: accounts }, { data: posts }, { data: messages }, { data: analytics }] =
    await Promise.all([
      supabase.from("social_accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("messages").select("*").order("received_at", { ascending: false }).limit(30),
      supabase.from("analytics").select("*").order("date", { ascending: false }).limit(60),
    ]);

  return NextResponse.json({
    accounts: accounts || [],
    posts: posts || [],
    messages: messages || [],
    analytics: analytics || [],
  });
}

// POST: uusi postaus tai viestin merkintä luetuksi
export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "create_post") {
    const platforms: string[] =
      body.platform === "both" ? ["facebook", "instagram"] : [body.platform];

    const { data: accounts } = await supabase.from("social_accounts").select("*");

    for (const platform of platforms) {
      const account = accounts?.find((a) => a.platform === platform);
      await supabase.from("posts").insert({
        social_account_id: account?.id || null,
        platform,
        content: body.content,
        image_url: body.image_url || null,
        status: "draft",
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "publish_post") {
    const { data: post } = await supabase
      .from("posts")
      .select("*")
      .eq("id", body.postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Postausta ei löydy" }, { status: 404 });
    }

    const { data: account } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("platform", post.platform)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: `${post.platform} ei ole yhdistetty` },
        { status: 400 }
      );
    }

    try {
      const result = await publishToPlatform(post, account);
      await supabase
        .from("posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          platform_post_id: result.id,
        })
        .eq("id", post.id);
      return NextResponse.json({ ok: true, id: result.id });
    } catch (err) {
      await supabase.from("posts").update({ status: "failed" }).eq("id", post.id);
      return NextResponse.json({ error: String(err) }, { status: 400 });
    }
  }

  if (body.action === "mark_read") {
    await supabase.from("messages").update({ is_read: true }).eq("id", body.messageId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "disconnect") {
    // Poistetaan kanavan yhteys (platform: "facebook" tai "instagram")
    await supabase.from("social_accounts").delete().eq("platform", body.platform);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "refresh_analytics") {
    const { data: accounts } = await supabase.from("social_accounts").select("*");
    const today = new Date().toISOString().slice(0, 10);
    const results: Record<string, unknown> = {};

    for (const account of accounts || []) {
      try {
        const stats = await fetchAccountStats(account);
        await supabase.from("analytics").upsert(
          {
            social_account_id: account.id,
            platform: account.platform,
            date: today,
            followers_count: stats.followers,
            total_likes: stats.likes,
            total_comments: stats.comments,
            media_count: stats.media_count,
            total_reach: stats.reach,
            total_impressions: stats.impressions,
          },
          { onConflict: "social_account_id,date" }
        );
        results[account.platform] = stats;
      } catch (err) {
        results[account.platform] = { error: String(err) };
      }
    }

    // Päivitä julkaistujen postausten tykkäykset/kommentit
    const { data: published } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .not("platform_post_id", "is", null);

    for (const post of published || []) {
      const account = (accounts || []).find((a) => a.platform === post.platform);
      if (!account) continue;
      try {
        const s = await fetchPostStats(post, account);
        await supabase
          .from("posts")
          .update({ likes_count: s.likes, comments_count: s.comments })
          .eq("id", post.id);
      } catch {
        // ohita yksittäisen postauksen virhe
      }
    }

    return NextResponse.json({ ok: true, results });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

// --- Analytiikan haku ---

async function fetchAccountStats(account: AccountRow): Promise<{
  followers: number;
  likes: number | null;
  comments: number | null;
  media_count: number | null;
  reach: number;
  impressions: number;
}> {
  if (account.platform === "facebook") {
    const pageId = account.page_id || account.account_id;
    const token = account.access_token;

    // Hae seuraajat
    const pageRes = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=followers_count,fan_count&access_token=${token}`
    );
    const pageData = await pageRes.json();
    if (pageData.error) throw new Error(pageData.error.message);
    const followers = pageData.followers_count ?? pageData.fan_count ?? 0;

    // HUOM: pages_read_engagement (tykkäykset/kommentit/reach) vaatii Meta App
    // Review -hyväksynnän. Kehitystilassa niitä ei saa → palautetaan null,
    // jotta UI näyttää "–" eikä harhaanjohtavaa 0.
    const totalLikes = null;
    const totalComments = null;

    // Julkaisujen määrä SAADAAN ilman engagement-lupaa (published_posts summary).
    let mediaCount: number | null = null;
    try {
      const countRes = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/published_posts?limit=0&summary=total_count&access_token=${token}`
      );
      const countData = await countRes.json();
      if (!countData.error) {
        mediaCount = countData.summary?.total_count ?? null;
      }
    } catch { /* ei pakollinen */ }

    // Hae sivun reach (viimeiset 28 päivää) — vaatii page_impressions permission
    let reach = 0;
    let impressions = 0;
    try {
      const insightsRes = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/insights?metric=page_impressions,page_reach&period=days_28&access_token=${token}`
      );
      const insightsData = await insightsRes.json();
      if (!insightsData.error) {
        for (const metric of insightsData.data || []) {
          const val = metric.values?.[metric.values.length - 1]?.value ?? 0;
          if (metric.name === "page_reach") reach = val;
          if (metric.name === "page_impressions") impressions = val;
        }
      }
    } catch { /* ei pakollinen */ }

    return { followers, likes: totalLikes, comments: totalComments, media_count: mediaCount, reach, impressions };
  }

  // Instagram
  const igId = account.account_id;
  const token = account.access_token;

  const profileRes = await fetch(
    `https://graph.instagram.com/v21.0/${igId}?fields=followers_count,media_count&access_token=${token}`
  );
  const profileData = await profileRes.json();
  if (profileData.error) throw new Error(profileData.error.message);
  const followers = profileData.followers_count ?? 0;
  const mediaCount = profileData.media_count ?? 0;

  // Hae viimeisimmät mediat ja laske tykkäykset/kommentit
  const mediaRes = await fetch(
    `https://graph.instagram.com/v21.0/${igId}/media?fields=like_count,comments_count&limit=25&access_token=${token}`
  );
  const mediaData = await mediaRes.json();
  let totalLikes = 0;
  let totalComments = 0;
  for (const m of mediaData.data || []) {
    totalLikes += m.like_count ?? 0;
    totalComments += m.comments_count ?? 0;
  }

  // Hae reach/impressions (vaatii instagram_insights permission)
  let reach = 0;
  let impressions = 0;
  try {
    const insRes = await fetch(
      `https://graph.instagram.com/v21.0/${igId}/insights?metric=reach,impressions&period=days_28&access_token=${token}`
    );
    const insData = await insRes.json();
    if (!insData.error) {
      for (const metric of insData.data || []) {
        const val = metric.values?.[metric.values.length - 1]?.value ?? 0;
        if (metric.name === "reach") reach = val;
        if (metric.name === "impressions") impressions = val;
      }
    }
  } catch { /* ei pakollinen */ }

  return { followers, likes: totalLikes, comments: totalComments, media_count: mediaCount, reach, impressions };
}

async function fetchPostStats(
  post: { platform: string; platform_post_id: string },
  account: AccountRow
): Promise<{ likes: number; comments: number }> {
  if (post.platform === "facebook") {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${post.platform_post_id}?fields=likes.summary(true),comments.summary(true)&access_token=${account.access_token}`
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return {
      likes: data.likes?.summary?.total_count ?? 0,
      comments: data.comments?.summary?.total_count ?? 0,
    };
  }
  // Instagram media
  const res = await fetch(
    `https://graph.instagram.com/v21.0/${post.platform_post_id}?fields=like_count,comments_count&access_token=${account.access_token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { likes: data.like_count ?? 0, comments: data.comments_count ?? 0 };
}

// --- Julkaisu some-kanaviin ---

type PostRow = {
  id: string;
  platform: string;
  content: string;
  image_url: string | null;
};

type AccountRow = {
  platform: string;
  account_id: string;
  page_id: string | null;
  access_token: string;
};

async function publishToPlatform(post: PostRow, account: AccountRow): Promise<{ id: string }> {
  if (post.platform === "facebook") {
    return publishFacebook(post, account);
  }
  if (post.platform === "instagram") {
    return publishInstagram(post, account);
  }
  throw new Error(`Tuntematon alusta: ${post.platform}`);
}

async function publishFacebook(post: PostRow, account: AccountRow): Promise<{ id: string }> {
  const pageId = account.page_id || account.account_id;
  const token = account.access_token;

  // Kuvallinen postaus → /photos, muuten /feed
  if (post.image_url) {
    const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: post.image_url, caption: post.content, access_token: token }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return { id: data.post_id || data.id };
  }

  const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: post.content, access_token: token }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.id };
}

async function publishInstagram(post: PostRow, account: AccountRow): Promise<{ id: string }> {
  // Instagram VAATII kuvan — pelkkä teksti ei ole mahdollista.
  if (!post.image_url) {
    throw new Error("Instagram vaatii kuvan. Lisää kuvan URL postaukseen.");
  }
  const igId = account.account_id;
  const token = account.access_token;

  // Vaihe 1: luo media-kontti
  const createRes = await fetch(`https://graph.instagram.com/v21.0/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: post.image_url, caption: post.content, access_token: token }),
  });
  const createData = await createRes.json();
  if (createData.error) throw new Error(createData.error.message);
  const creationId = createData.id;

  // Vaihe 2: julkaise kontti
  const publishRes = await fetch(`https://graph.instagram.com/v21.0/${igId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(publishData.error.message);
  return { id: publishData.id };
}
