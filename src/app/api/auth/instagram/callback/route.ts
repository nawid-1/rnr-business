import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const APP_URL = "https://rnr-business-sgzu.vercel.app";
const IG_APP_ID = process.env.INSTAGRAM_APP_ID || "2132229717322018";

async function log(step: string, data: unknown) {
  try {
    await supabase.from("debug_logs").insert({ step, data });
  } catch {
    // ignore
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  await log("ig_callback_start", { code: code ? "present" : "missing", error });

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?error=ig_auth_failed`);
  }

  try {
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = `${APP_URL}/api/auth/instagram/callback`;

    // 1. Vaihdetaan code lyhytkestoiseksi tokeniksi (form-encoded POST)
    const form = new URLSearchParams();
    form.append("client_id", IG_APP_ID);
    form.append("client_secret", appSecret || "");
    form.append("grant_type", "authorization_code");
    form.append("redirect_uri", redirectUri);
    form.append("code", code);

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const tokenData = await tokenRes.json();
    await log("ig_token_response", tokenData);

    const shortToken = tokenData.access_token;
    if (!shortToken) {
      return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?error=ig_token_failed`);
    }

    // 2. Vaihdetaan pitkäkestoiseksi tokeniksi (60 pv)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortToken}`
    );
    const longData = await longRes.json();
    const longToken = longData.access_token || shortToken;

    // 3. Haetaan tilin tiedot
    const meRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username&access_token=${longToken}`
    );
    const me = await meRes.json();
    await log("ig_me", me);

    const igUserId = me.user_id || tokenData.user_id;
    const username = me.username || "instagram";

    // 4. Tallennetaan
    const { error: igError } = await supabase.from("social_accounts").upsert({
      platform: "instagram",
      account_name: username,
      account_id: String(igUserId),
      access_token: longToken,
      page_id: null,
      page_name: null,
      is_active: true,
    }, { onConflict: "platform" });
    await log("ig_saved", { error: igError, username });

    return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?ig_success=true`);
  } catch (err) {
    await log("ig_exception", { message: String(err) });
    return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?error=ig_exception`);
  }
}
