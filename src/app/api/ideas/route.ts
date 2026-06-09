import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: listaa kaikki ideat
export async function GET() {
  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ideas: ideas || [] });
}

// POST: hallinnoi ideoita
export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "create_idea") {
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Sisältö puuttuu" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("ideas")
      .insert({ content: body.content.trim(), tags: body.tags || [] })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, idea: data });
  }

  if (body.action === "delete_idea") {
    await supabase.from("ideas").delete().eq("id", body.ideaId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "convert_to_post") {
    // Merkitään idea muutetuksi (converted_to_post_id jätetään null koska postaus
    // luodaan clientillä erillisellä API-kutsulla — tässä vain haetaan idea-data)
    const { data: idea } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", body.ideaId)
      .single();

    if (!idea) return NextResponse.json({ error: "Ideaa ei löydy" }, { status: 404 });
    return NextResponse.json({ ok: true, idea });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
