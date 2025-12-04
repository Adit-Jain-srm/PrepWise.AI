-- PrepWise.AI Database Migration Script
-- Run this script in your Supabase SQL Editor to create all necessary tables
-- Make sure you're connected to the correct database and have the necessary permissions

-- ============================================================================
-- 1. Quizzes Table (Required for quiz functionality)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'behavioral', 'technical', 'school-specific', etc.
  difficulty VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  questions_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of quiz questions
  correct_answers_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Map of question_id to correct answer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE
);

-- Create index for active quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON public.quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON public.quizzes(category);

-- ============================================================================
-- 2. Quiz Attempts Table (Required for tracking quiz submissions)
-- ============================================================================
-- Note: This table references quizzes and users tables
-- If users table doesn't exist, this will fail - create users table first if needed

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users(id) or your users table
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- User's answers
  score DECIMAL(5,2), -- Percentage score
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON public.quiz_attempts(completed_at DESC);

-- ============================================================================
-- 3. Users Table (If not already created by Supabase Auth)
-- ============================================================================
-- Supabase Auth creates an auth.users table automatically
-- This creates a public.users table for additional profile information

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  profile_json JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 4. Subscriptions Table (For tier management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'premium', 'enterprise'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ============================================================================
-- 5. Interview Recordings Table (If not already created)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  candidate_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  profile_json JSONB,
  plan_json JSONB,
  evaluation_json JSONB,
  video_urls JSONB,
  audio_urls JSONB,
  essay_responses JSONB,
  overall_score DECIMAL(5,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_recordings_user_id ON public.interview_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_id ON public.interview_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_recordings_created_at ON public.interview_recordings(created_at DESC);

-- ============================================================================
-- 6. Enable Row Level Security (RLS) - Optional but Recommended
-- ============================================================================
-- Uncomment these lines if you want to enable RLS for security
-- Note: You'll need to create policies for each table

-- ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.interview_recordings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. Create a function to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_recordings_updated_at BEFORE UPDATE ON public.interview_recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- After running this script, verify the tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('quizzes', 'quiz_attempts', 'users', 'subscriptions', 'interview_recordings');

