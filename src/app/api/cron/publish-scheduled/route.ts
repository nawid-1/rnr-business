import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { publishToPlatform } from "@/lib/publishing";
import type { AccountRow } from "@/lib/publishing";

export const dynamic = "force-dynamic";

// Vercel cron ajaa tämän joka 15 minuutti.
// Hakee kaikki ajastetut postaukset joiden julkaisuaika on nyt tai menneisyydessä,
// julkaisee ne some-kanaviin ja päivittää tilan.
export async function GET() {
  const now = new Date().toISOString();

  // Hae kaikki ajastetut postaukset joiden aika on tullut
  const { data: scheduled, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!scheduled || scheduled.length === 0) {
    return NextResponse.json({ ok: true, published: 0 });
  }

  const { data: accounts } = await supabase.from("social_accounts").select("*");

  let published = 0;
  let failed = 0;

  for (const post of scheduled) {
    const account = (accounts || []).find((a) => a.platform === post.platform);
    if (!account) {
      await supabase
        .from("posts")
        .update({ status: "failed" })
        .eq("id", post.id);
      failed++;
      continue;
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
      published++;
    } catch {
      await supabase
        .from("posts")
        .update({ status: "failed" })
        .eq("id", post.id);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, published, failed });
}
