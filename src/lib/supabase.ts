import "react-native-url-polyfill/auto";

import { SupabaseClient, createClient } from "@supabase/supabase-js";

import { appStorage } from "@/lib/storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: appStorage
    }
  });
}

export const supabase = client;

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
