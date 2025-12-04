import { createClient } from "@supabase/supabase-js";

// Client-side Supabase client for authentication
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper to get current user
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// Helper to get user session
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  
  if (error || !session) {
    return null;
  }
  
  return session;
}

