import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const APP_URL = "https://rnr-business-sgzu.vercel.app";

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

  await log("callback_start", { code: code ? "present" : "missing", error });

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?error=meta_auth_failed`);
  }

  try {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${APP_URL}/api/auth/meta/callback`;

    await log("env_check", {
      appId: appId ? "present" : "MISSING",
      appSecret: appSecret ? "present" : "MISSING",
    });

    // Vaihdetaan code access tokeniksi
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    await log("token_response", tokenData);

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?error=token_failed`);
    }

    // Haetaan pitkäkestoinen token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longTokenData = await longTokenRes.json();
    const longToken = longTokenData.access_token || tokenData.access_token;

    // Haetaan Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longToken}`
    );
    const pagesData = await pagesRes.json();
    await log("pages_response", pagesData);

    const page = pagesData.data?.[0];

    if (!page) {
      return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?error=no_page`);
    }

    // Tallennetaan Facebook-tili
    const { error: fbError } = await supabase.from("social_accounts").upsert({
      platform: "facebook",
      account_name: page.name,
      account_id: page.id,
      access_token: page.access_token,
      page_id: page.id,
      page_name: page.name,
      is_active: true,
    }, { onConflict: "platform" });
    await log("facebook_save", { error: fbError, page_name: page.name });

    // Haetaan Instagram Business tili
    const igRes = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );
    const igData = await igRes.json();
    await log("instagram_response", igData);

    if (igData.instagram_business_account?.id) {
      const igId = igData.instagram_business_account.id;
      const igInfoRes = await fetch(
        `https://graph.facebook.com/v18.0/${igId}?fields=id,username&access_token=${page.access_token}`
      );
      const igInfo = await igInfoRes.json();

      const { error: igError } = await supabase.from("social_accounts").upsert({
        platform: "instagram",
        account_name: igInfo.username || igId,
        account_id: igId,
        access_token: page.access_token,
        page_id: page.id,
        page_name: page.name,
        is_active: true,
      }, { onConflict: "platform" });
      await log("instagram_save", { error: igError, username: igInfo.username });
    }

    return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?success=true`);
  } catch (err) {
    await log("exception", { message: String(err) });
    return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?error=exception`);
  }
}
