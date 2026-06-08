import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type FeedItem = {
  platform: "facebook" | "instagram";
  id: string;
  message: string;
  created_time: string;
  image: string | null;
  permalink: string | null;
};

// GET: hakee oikeat julkaisut suoraan some-kanavilta (Facebook-sivu + Instagram).
// Näin käyttäjä voi seurata julkaisujaan alustalta.
export async function GET() {
  const { data: accounts } = await supabase.from("social_accounts").select("*");
  const items: FeedItem[] = [];

  for (const acc of accounts || []) {
    try {
      if (acc.platform === "facebook") {
        const pageId = acc.page_id || acc.account_id;
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/published_posts?fields=id,message,created_time,permalink_url,full_picture&limit=25&access_token=${acc.access_token}`
        );
        const data = await res.json();
        for (const p of data.data || []) {
          items.push({
            platform: "facebook",
            id: p.id,
            message: p.message || "",
            created_time: p.created_time,
            image: p.full_picture || null,
            permalink: p.permalink_url || null,
          });
        }
      } else if (acc.platform === "instagram") {
        const res = await fetch(
          `https://graph.instagram.com/v21.0/${acc.account_id}/media?fields=id,caption,timestamp,media_url,permalink,media_type&limit=25&access_token=${acc.access_token}`
        );
        const data = await res.json();
        for (const m of data.data || []) {
          items.push({
            platform: "instagram",
            id: m.id,
            message: m.caption || "",
            created_time: m.timestamp,
            image: m.media_url || null,
            permalink: m.permalink || null,
          });
        }
      }
    } catch {
      // ohita yksittäisen kanavan virhe
    }
  }

  // Järjestä uusimmat ensin
  items.sort((a, b) => (b.created_time || "").localeCompare(a.created_time || ""));

  return NextResponse.json({ items });
}
