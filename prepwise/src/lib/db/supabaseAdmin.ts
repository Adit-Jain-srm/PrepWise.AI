import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { serverEnv, requireServerEnv } from "../env";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
  }

  const url = requireServerEnv("SUPABASE_URL", "Supabase persistence");
  const key = requireServerEnv("SUPABASE_SERVICE_ROLE_KEY", "Supabase persistence");

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-prepwise-service": "admin",
      },
    },
  });

  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(serverEnv.SUPABASE_URL && serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}
