import crypto from "node:crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabaseAdmin";
import { User, Subscription, UserTier, SubscriptionStatus } from "../types/user";

type UserRecord = {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  last_login_at?: string;
  profile_json?: Record<string, unknown>;
};

type SubscriptionRecord = {
  id: string;
  user_id: string;
  tier: UserTier;
  status: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

const inMemoryStore = {
  users: new Map<string, UserRecord>(),
  subscriptions: new Map<string, SubscriptionRecord>(),
};

export async function getUser(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    const user = inMemoryStore.users.get(userId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    createdAt: data.created_at,
    lastLoginAt: data.last_login_at,
  };
}

export async function createOrUpdateUser(
  userId: string,
  email: string,
  fullName?: string,
): Promise<User> {
  const userRecord: UserRecord = {
    id: userId,
    email,
    full_name: fullName,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    inMemoryStore.users.set(userId, userRecord);
    return {
      id: userRecord.id,
      email: userRecord.email,
      fullName: userRecord.full_name,
      createdAt: userRecord.created_at,
    };
  }

  const supabase = getSupabaseAdmin();
  
  await supabase.from("users").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
    },
    { onConflict: "id" },
  );

  return {
    id: userRecord.id,
    email: userRecord.email,
    fullName: userRecord.full_name,
    createdAt: userRecord.created_at,
  };
}

export async function updateLastLogin(userId: string): Promise<void> {
  const lastLoginAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const user = inMemoryStore.users.get(userId);
    if (user) {
      user.last_login_at = lastLoginAt;
      inMemoryStore.users.set(userId, user);
    }
    return;
  }

  const supabase = getSupabaseAdmin();
  await supabase
    .from("users")
    .update({ last_login_at: lastLoginAt })
    .eq("id", userId);
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  if (!isSupabaseConfigured()) {
    const sub = inMemoryStore.subscriptions.get(userId);
    if (!sub) return null;
    return {
      id: sub.id,
      userId: sub.user_id,
      tier: sub.tier,
      status: sub.status,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    tier: data.tier,
    status: data.status,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
}

export async function createOrUpdateSubscription(
  userId: string,
  tier: UserTier = "free",
  status: SubscriptionStatus = "active",
  stripeData?: {
    subscriptionId?: string;
    customerId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<Subscription> {
  const subscriptionId = crypto.randomUUID();
  const now = new Date().toISOString();

  const subRecord: SubscriptionRecord = {
    id: subscriptionId,
    user_id: userId,
    tier,
    status,
    stripe_subscription_id: stripeData?.subscriptionId,
    stripe_customer_id: stripeData?.customerId,
    current_period_start: stripeData?.currentPeriodStart,
    current_period_end: stripeData?.currentPeriodEnd,
    cancel_at_period_end: stripeData?.cancelAtPeriodEnd ?? false,
    created_at: now,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    inMemoryStore.subscriptions.set(userId, subRecord);
    return {
      id: subRecord.id,
      userId: subRecord.user_id,
      tier: subRecord.tier,
      status: subRecord.status,
      currentPeriodStart: subRecord.current_period_start,
      currentPeriodEnd: subRecord.current_period_end,
      cancelAtPeriodEnd: subRecord.cancel_at_period_end,
    };
  }

  const supabase = getSupabaseAdmin();
  
  await supabase.from("subscriptions").upsert(
    {
      id: subscriptionId,
      user_id: userId,
      tier,
      status,
      stripe_subscription_id: stripeData?.subscriptionId,
      stripe_customer_id: stripeData?.customerId,
      current_period_start: stripeData?.currentPeriodStart,
      current_period_end: stripeData?.currentPeriodEnd,
      cancel_at_period_end: stripeData?.cancelAtPeriodEnd ?? false,
    },
    { onConflict: "user_id" },
  );

  return {
    id: subRecord.id,
    userId: subRecord.user_id,
    tier: subRecord.tier,
    status: subRecord.status,
    currentPeriodStart: subRecord.current_period_start,
    currentPeriodEnd: subRecord.current_period_end,
    cancelAtPeriodEnd: subRecord.cancel_at_period_end,
  };
}

export async function getUserTier(userId: string): Promise<UserTier> {
  const subscription = await getSubscription(userId);
  return subscription?.tier ?? "free";
}

