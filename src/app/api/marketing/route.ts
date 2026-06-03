import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: kaikki markkinointidata
export async function GET() {
  const [{ data: accounts }, { data: posts }, { data: messages }] = await Promise.all([
    supabase.from("social_accounts").select("*").order("created_at", { ascending: false }),
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("messages").select("*").order("received_at", { ascending: false }).limit(30),
  ]);

  return NextResponse.json({
    accounts: accounts || [],
    posts: posts || [],
    messages: messages || [],
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

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
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
