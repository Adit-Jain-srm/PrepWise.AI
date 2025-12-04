import { UserTier } from "./user";

export interface SubscriptionFeature {
  name: string;
  description: string;
  available: boolean;
  limit?: number; // null means unlimited
}

export interface TierFeatures {
  tier: UserTier;
  name: string;
  price: number; // monthly price in USD
  features: SubscriptionFeature[];
}

export const TIER_FEATURES: Record<UserTier, TierFeatures> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    features: [
      {
        name: "Basic Interview Questions",
        description: "5 standard interview questions",
        available: true,
        limit: 5,
      },
      {
        name: "Video Recording",
        description: "Record mock interview responses",
        available: true,
      },
      {
        name: "Basic Feedback",
        description: "Get basic evaluation feedback",
        available: true,
      },
      {
        name: "Recording History",
        description: "View past 3 interviews",
        available: true,
        limit: 3,
      },
      {
        name: "PDF Reports",
        description: "Download performance reports",
        available: true,
      },
      {
        name: "Personalized Questions",
        description: "AI-generated personalized questions",
        available: false,
      },
      {
        name: "Unlimited Interviews",
        description: "Record unlimited mock interviews",
        available: false,
      },
      {
        name: "Quizzes",
        description: "Access to basic quizzes (limited)",
        available: true,
        limit: 3,
      },
      {
        name: "Learning Content",
        description: "Curated videos and articles",
        available: true,
      },
      {
        name: "MBA News Feed",
        description: "Latest MBA news and updates",
        available: true,
      },
    ],
  },
  premium: {
    tier: "premium",
    name: "Premium",
    price: 29.99,
    features: [
      {
        name: "Personalized Questions",
        description: "AI-generated highly personalized questions",
        available: true,
      },
      {
        name: "Unlimited Interviews",
        description: "Record unlimited mock interviews",
        available: true,
      },
      {
        name: "Advanced Feedback",
        description: "Detailed evaluation with tone, confidence, and clarity analysis",
        available: true,
      },
      {
        name: "Unlimited Recording History",
        description: "Access all past interviews",
        available: true,
      },
      {
        name: "PDF Reports",
        description: "Download detailed performance reports",
        available: true,
      },
      {
        name: "Unlimited Quizzes",
        description: "Access to all quizzes (unlimited)",
        available: true,
      },
      {
        name: "Learning Content",
        description: "Curated videos and articles",
        available: true,
      },
      {
        name: "MBA News Feed",
        description: "Latest MBA news and updates",
        available: true,
      },
      {
        name: "Progress Tracking",
        description: "Track your improvement over time",
        available: true,
      },
      {
        name: "Priority Support",
        description: "Get priority customer support",
        available: true,
      },
    ],
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    price: 99.99,
    features: [
      {
        name: "All Premium Features",
        description: "Everything in Premium plus",
        available: true,
      },
      {
        name: "Team Management",
        description: "Manage multiple users",
        available: true,
      },
      {
        name: "Custom Branding",
        description: "White-label solution",
        available: true,
      },
      {
        name: "API Access",
        description: "Integration with your systems",
        available: true,
      },
      {
        name: "Dedicated Support",
        description: "24/7 dedicated support",
        available: true,
      },
    ],
  },
};

export function canAccessFeature(userTier: UserTier, featureName: string): boolean {
  const tier = TIER_FEATURES[userTier];
  const feature = tier.features.find((f) => f.name === featureName);
  return feature?.available ?? false;
}

export function getFeatureLimit(userTier: UserTier, featureName: string): number | null {
  const tier = TIER_FEATURES[userTier];
  const feature = tier.features.find((f) => f.name === featureName);
  return feature?.limit ?? null;
}

