import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST: lataa kuva/video Supabase Storageen ja palauttaa julkisen URL:n.
// Instagram vaatii julkisen URL:n, jonka julkinen bucket tarjoaa.
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Tiedosto puuttuu" }, { status: 400 });
    }

    // Rajoitukset: vain kuvat/videot, max 50 MB
    const okType = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!okType) {
      return NextResponse.json({ error: "Vain kuva- tai videotiedostot" }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Tiedosto on liian suuri (max 50 MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "bin";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("post-media")
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data } = supabase.storage.from("post-media").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
