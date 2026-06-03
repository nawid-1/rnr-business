import { NextResponse } from "next/server";

const APP_URL = "https://rnr-business-sgzu.vercel.app";
const IG_APP_ID = process.env.INSTAGRAM_APP_ID || "2132229717322018";

export async function GET() {
  const redirectUri = encodeURIComponent(`${APP_URL}/api/auth/instagram/callback`);
  const scope = [
    "instagram_business_basic",
    "instagram_business_content_publish",
    "instagram_business_manage_comments",
    "instagram_business_manage_messages",
  ].join(",");

  const authUrl =
    `https://www.instagram.com/oauth/authorize` +
    `?enable_fb_login=0` +
    `&force_authentication=1` +
    `&client_id=${IG_APP_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}`;

  return NextResponse.redirect(authUrl);
}
