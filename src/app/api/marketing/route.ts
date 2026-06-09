import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { publishToPlatform } from "@/lib/publishing";
import type { AccountRow } from "@/lib/publishing";

export const dynamic = "force-dynamic";

// GET: kaikki markkinointidata
export async function GET() {
  const [{ data: accounts }, { data: posts }, { data: messages }, { data: analytics }] =
    await Promise.all([
      supabase.from("social_accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50),
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

    const scheduledAt = body.scheduled_at || null;
    const status = scheduledAt ? "scheduled" : "draft";

    for (const platform of platforms) {
      const account = accounts?.find((a) => a.platform === platform);
      // Jos monistus eri alustoille, käytetään alustakohtaista sisältöä jos annettu
      const content =
        body.platform_content?.[platform] || body.content;
      await supabase.from("posts").insert({
        social_account_id: account?.id || null,
        platform,
        content,
        image_url: body.image_url || null,
        status,
        scheduled_at: scheduledAt,
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
      const result = await publishToPlatform(post, account as AccountRow);
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

  if (body.action === "edit_post") {
    const scheduledAt = body.scheduled_at !== undefined ? body.scheduled_at : undefined;
    const updateData: Record<string, unknown> = {
      content: body.content,
      image_url: body.image_url || null,
    };
    if (scheduledAt !== undefined) {
      updateData.scheduled_at = scheduledAt || null;
      updateData.status = scheduledAt ? "scheduled" : "draft";
    }
    await supabase.from("posts").update(updateData).eq("id", body.postId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete_post") {
    await supabase.from("posts").delete().eq("id", body.postId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "duplicate_post") {
    const { data: src } = await supabase
      .from("posts")
      .select("*")
      .eq("id", body.postId)
      .single();
    if (src) {
      await supabase.from("posts").insert({
        social_account_id: src.social_account_id,
        platform: src.platform,
        content: src.content,
        image_url: src.image_url,
        status: "draft",
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "mark_read") {
    await supabase.from("messages").update({ is_read: true }).eq("id", body.messageId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "disconnect") {
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

    const pageRes = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=followers_count,fan_count&access_token=${token}`
    );
    const pageData = await pageRes.json();
    if (pageData.error) throw new Error(pageData.error.message);
    const followers = pageData.followers_count ?? pageData.fan_count ?? 0;

    let totalLikes: number | null = null;
    let totalComments: number | null = null;
    let mediaCount: number | null = null;
    try {
      const postsRes = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/published_posts?fields=likes.summary(true),comments.summary(true)&limit=50&access_token=${token}`
      );
      const postsData = await postsRes.json();
      if (!postsData.error && Array.isArray(postsData.data)) {
        let likes = 0;
        let comments = 0;
        for (const p of postsData.data) {
          likes += p.likes?.summary?.total_count ?? 0;
          comments += p.comments?.summary?.total_count ?? 0;
        }
        totalLikes = likes;
        totalComments = comments;
        mediaCount = postsData.data.length;
      }
    } catch { /* lupa puuttuu → jätetään null */ }

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
  const res = await fetch(
    `https://graph.instagram.com/v21.0/${post.platform_post_id}?fields=like_count,comments_count&access_token=${account.access_token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { likes: data.like_count ?? 0, comments: data.comments_count ?? 0 };
}
