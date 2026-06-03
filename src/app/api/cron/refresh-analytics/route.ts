import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const APP_URL = "https://rnr-business-sgzu.vercel.app";

// Vercel Cron kutsuu tätä reittiä ajastetusti (ks. vercel.json).
// Ajaa saman analytiikan päivityksen kuin "Päivitä luvut" -nappi,
// jotta luvut pysyvät tuoreina ilman että käyttäjä avaa sivua.
export async function GET() {
  try {
    const res = await fetch(`${APP_URL}/api/marketing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refresh_analytics" }),
    });
    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
