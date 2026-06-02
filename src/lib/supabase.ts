import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SocialAccount = {
  id: string;
  platform: "facebook" | "instagram";
  account_name: string;
  account_id: string;
  access_token: string;
  token_expires_at: string | null;
  page_id: string | null;
  page_name: string | null;
  is_active: boolean;
  created_at: string;
};

export type Post = {
  id: string;
  social_account_id: string;
  platform: string;
  content: string;
  image_url: string | null;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduled_at: string | null;
  published_at: string | null;
  platform_post_id: string | null;
  likes_count: number;
  comments_count: number;
  reach: number;
  created_at: string;
};

export type Message = {
  id: string;
  social_account_id: string;
  platform: string;
  message_type: "dm" | "comment" | "reply";
  sender_name: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_replied: boolean;
  reply_content: string | null;
  received_at: string;
};
