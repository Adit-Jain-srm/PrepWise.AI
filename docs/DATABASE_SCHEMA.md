# Database Schema for PrepWise.AI Enhanced Features

This document outlines the database schema for the enhanced PrepWise.AI platform with user authentication, subscriptions, quizzes, recording storage, and learning ecosystem.

## Tables

### 1. Users Table
Stores user authentication and profile information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  password_hash VARCHAR(255), -- if using email/password auth
  auth_provider VARCHAR(50), -- 'email', 'google', 'github', etc.
  provider_id VARCHAR(255), -- external provider user ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  profile_json JSONB -- Extended profile data
);
```

### 2. Subscriptions Table
Manages user subscription tiers and payment status.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'premium', 'enterprise'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  stripe_subscription_id VARCHAR(255) UNIQUE, -- Stripe subscription ID
  stripe_customer_id VARCHAR(255), -- Stripe customer ID
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 3. Interview Recordings Table
Stores metadata about recorded mock interviews.

```sql
CREATE TABLE interview_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  candidate_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  profile_json JSONB, -- Candidate profile at time of interview
  plan_json JSONB, -- Interview session plan
  evaluation_json JSONB, -- Interview evaluation results
  video_urls JSONB, -- Array of video blob URLs by question
  audio_urls JSONB, -- Array of audio blob URLs by question
  essay_responses JSONB, -- Essay responses if any
  overall_score DECIMAL(5,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interview_recordings_user_id ON interview_recordings(user_id);
CREATE INDEX idx_interview_recordings_session_id ON interview_recordings(session_id);
CREATE INDEX idx_interview_recordings_created_at ON interview_recordings(created_at DESC);
```

### 4. Quizzes Table
Stores quiz definitions and metadata.

```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'behavioral', 'technical', 'school-specific', etc.
  difficulty VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  questions_json JSONB NOT NULL, -- Array of quiz questions
  correct_answers_json JSONB NOT NULL, -- Map of question_id to correct answer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE
);
```

### 5. Quiz Attempts Table
Tracks user quiz attempts and scores.

```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL, -- User's answers
  score DECIMAL(5,2), -- Percentage score
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
```

### 6. Learning Content Table
Stores curated videos, articles, and learning resources.

```sql
CREATE TABLE learning_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL, -- 'video', 'article', 'podcast', 'course'
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_minutes INTEGER, -- for videos/podcasts
  category VARCHAR(100), -- 'interview-prep', 'leadership', 'communication', etc.
  tags TEXT[], -- Array of tags for filtering
  difficulty VARCHAR(50),
  is_premium BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_learning_content_type ON learning_content(content_type);
CREATE INDEX idx_learning_content_category ON learning_content(category);
CREATE INDEX idx_learning_content_is_premium ON learning_content(is_premium);
```

### 7. User Learning Progress Table
Tracks user's progress through learning content.

```sql
CREATE TABLE user_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES learning_content(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  bookmarked BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE INDEX idx_user_learning_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX idx_user_learning_progress_content_id ON user_learning_progress(content_id);
```

### 8. MBA News Table
Stores MBA-related news and updates.

```sql
CREATE TABLE mba_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  content TEXT, -- Full article content
  source_url VARCHAR(500),
  source_name VARCHAR(255),
  image_url VARCHAR(500),
  category VARCHAR(100), -- 'admissions', 'career', 'schools', 'trends', etc.
  tags TEXT[],
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_mba_news_category ON mba_news(category);
CREATE INDEX idx_mba_news_published_at ON mba_news(published_at DESC);
CREATE INDEX idx_mba_news_is_featured ON mba_news(is_featured);
```

### 9. User Preferences Table
Stores user preferences for personalized recommendations.

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  preferred_topics TEXT[], -- Topics user is interested in
  preferred_schools TEXT[], -- MBA schools user is targeting
  learning_goals TEXT[], -- User's learning objectives
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10. Content Recommendations Table
Tracks AI-generated recommendations for users.

```sql
CREATE TABLE content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES learning_content(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50), -- 'based_on_profile', 'based_on_weaknesses', 'trending', etc.
  relevance_score DECIMAL(5,2),
  reason TEXT, -- Why this was recommended
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_recommendations_user_id ON content_recommendations(user_id);
CREATE INDEX idx_content_recommendations_content_id ON content_recommendations(content_id);
```

## Migration Notes

### Existing Tables
The following tables already exist and should be preserved:
- `candidate_profiles` - Can be linked to users via user_id (add user_id column)
- `interview_sessions` - Can be linked to users
- `interview_evaluations` - Already linked via session_id

### Migration Steps
1. Add `user_id` column to existing tables to link to users
2. Create new tables as listed above
3. Set up foreign key relationships
4. Create indexes for performance
5. Set up Row Level Security (RLS) policies in Supabase for multi-tenancy

## Indexes Summary

All foreign keys and frequently queried columns should have indexes:
- User lookups by email
- Subscription lookups by user_id
- Interview recordings by user_id and created_at
- Quiz attempts by user_id and quiz_id
- Learning progress by user_id
- News by category and published_at
- Recommendations by user_id

## Row Level Security (RLS) Policies

For Supabase, implement RLS policies to ensure users can only access their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_recordings ENABLE ROW LEVEL SECURITY;
-- ... (for all tables)

-- Example policy for interview_recordings
CREATE POLICY "Users can view their own recordings"
  ON interview_recordings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings"
  ON interview_recordings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

