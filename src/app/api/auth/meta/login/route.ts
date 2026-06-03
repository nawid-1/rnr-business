import { NextResponse } from "next/server";

const APP_URL = "https://rnr-business-sgzu.vercel.app";

export async function GET() {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID;

  if (!appId) {
    return NextResponse.redirect(`${APP_URL}/dashboard/markkinointi?error=no_app_id`);
  }

  const redirectUri = encodeURIComponent(`${APP_URL}/api/auth/meta/callback`);
  const scope = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_messaging",
  ].join(",");
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
