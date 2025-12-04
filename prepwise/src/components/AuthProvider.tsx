"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, getCurrentUser } from "@/lib/auth/client";
import { UserTier } from "@/lib/types/user";
import { authenticatedFetch, handleApiResponse } from "@/lib/utils/api";

interface AuthContextType {
  user: User | null;
  userTier: UserTier;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userTier: "free",
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userTier, setUserTier] = useState<UserTier>("free");
  const [loading, setLoading] = useState(true);

  const fetchUserTier = async (userId: string) => {
    try {
      // Fetch actual subscription tier from API
      const response = await authenticatedFetch("/api/auth/user");
      const data = await handleApiResponse<{
        user: {
          id: string;
          email: string;
          fullName?: string;
        };
        subscription: {
          tier: UserTier;
          status: string;
          currentPeriodEnd?: string;
        };
      }>(response);

      // Set the actual tier from the API response
      setUserTier(data.subscription.tier);
    } catch (error) {
      console.error("Error fetching user tier:", error);
      // Default to free tier on error
      setUserTier("free");
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserTier(currentUser.id);
      } else {
        setUserTier("free");
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
      setUserTier("free");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    refreshUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserTier(session.user.id);
      } else {
        setUser(null);
        setUserTier("free");
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserTier("free");
  };

  return (
    <AuthContext.Provider value={{ user, userTier, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

