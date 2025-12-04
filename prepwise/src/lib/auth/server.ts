import { getSupabaseAdmin, isSupabaseConfigured } from "../db/supabaseAdmin";
import { getUser, createOrUpdateUser, getUserTier } from "../db/userRepository";
import { UserTier } from "../types/user";

// Server-side helper to get user from auth token
export async function getUserFromRequest(request: Request): Promise<{ userId: string; tier: UserTier } | null> {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  // Check if Supabase is configured before trying to use it
  if (!isSupabaseConfigured()) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Ensure user exists in our database
    let dbUser = await getUser(user.id);
    if (!dbUser) {
      await createOrUpdateUser(user.id, user.email || "", user.user_metadata?.full_name);
      dbUser = await getUser(user.id);
    }

    if (!dbUser) {
      return null;
    }

    const tier = await getUserTier(user.id);
    
    return {
      userId: user.id,
      tier,
    };
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

// Helper for API routes to require authentication
export async function requireAuth(request: Request): Promise<{ userId: string; tier: UserTier }> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}

