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
        status: "draft",
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "mark_read") {
    await supabase.from("messages").update({ is_read: true }).eq("id", body.messageId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
