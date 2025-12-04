export type UserTier = "free" | "premium" | "enterprise";

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trialing";

export interface User {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: UserTier;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface UserPreferences {
  preferredTopics?: string[];
  preferredSchools?: string[];
  learningGoals?: string[];
  notificationSettings?: Record<string, boolean>;
}

export interface InterviewRecordingSummary {
  id: string;
  sessionId: string;
  title?: string;
  overallScore?: number;
  completedAt?: string;
  createdAt: string;
  questionCount?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  questionCount: number;
  isPremium: boolean;
  estimatedMinutes: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: Record<string, string>;
  timeTakenSeconds: number;
  completedAt: string;
}

export interface LearningContent {
  id: string;
  title: string;
  description?: string;
  contentType: "video" | "article" | "podcast" | "course";
  url: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  category: string;
  tags: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  isPremium: boolean;
  viewCount: number;
  isActive?: boolean; // Optional field for content management
}

export interface UserLearningProgress {
  contentId: string;
  progressPercentage: number;
  completedAt?: string;
  bookmarked: boolean;
  rating?: number;
  notes?: string;
}

export interface MBANewsItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  sourceUrl?: string;
  sourceName?: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  publishedAt?: string;
  isFeatured: boolean;
  isActive?: boolean; // Optional field for content management
}

export interface ContentRecommendation {
  contentId: string;
  contentType: LearningContent["contentType"];
  title: string;
  reason: string;
  relevanceScore: number;
}

