import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/markkinointi?error=meta_auth_failed", request.url)
    );
  }

  try {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${new URL(request.url).origin}/api/auth/meta/callback`;

    // Vaihdetaan code access tokeniksi
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("Token exchange failed");
    }

    // Haetaan käyttäjän tiedot
    const userRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name&access_token=${tokenData.access_token}`
    );
    const userData = await userRes.json();

    // Haetaan pitkäkestoinen token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longTokenData = await longTokenRes.json();
    const longToken = longTokenData.access_token || tokenData.access_token;

    // Haetaan Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${longToken}`
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];

    if (page) {
      // Tallennetaan Facebook-tili
      await supabase.from("social_accounts").upsert({
        platform: "facebook",
        account_name: page.name,
        account_id: page.id,
        access_token: page.access_token,
        page_id: page.id,
        page_name: page.name,
        is_active: true,
      }, { onConflict: "platform" });

      // Haetaan Instagram Business tili
      const igRes = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igRes.json();

      if (igData.instagram_business_account?.id) {
        const igId = igData.instagram_business_account.id;
        const igInfoRes = await fetch(
          `https://graph.facebook.com/v18.0/${igId}?fields=id,username&access_token=${page.access_token}`
        );
        const igInfo = await igInfoRes.json();

        await supabase.from("social_accounts").upsert({
          platform: "instagram",
          account_name: igInfo.username || igId,
          account_id: igId,
          access_token: page.access_token,
          page_id: page.id,
          page_name: page.name,
          is_active: true,
        }, { onConflict: "platform" });
      }
    }

    return NextResponse.redirect(
      new URL("/dashboard/markkinointi?success=true", request.url)
    );
  } catch (err) {
    console.error("Meta auth error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/markkinointi?error=meta_auth_failed", request.url)
    );
  }
}
