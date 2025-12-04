# Supabase Database Setup Guide

This guide will help you set up the required database tables in Supabase for PrepWise.AI.

## Quick Setup

### Step 1: Open Supabase SQL Editor

1. Log in to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration Script

1. Open the file `docs/SUPABASE_MIGRATION.sql` in this repository
2. Copy the entire contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 3: Verify Tables Were Created

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quizzes', 'quiz_attempts', 'users', 'subscriptions', 'interview_recordings')
ORDER BY table_name;
```

You should see all 5 tables listed.

## Required Tables

The migration script creates the following tables:

1. **quizzes** - Stores quiz definitions and questions
2. **quiz_attempts** - Tracks user quiz attempts and scores
3. **users** - User profile information (extends Supabase Auth)
4. **subscriptions** - Subscription tier management
5. **interview_recordings** - Mock interview recordings metadata

## Troubleshooting

### Error: "relation already exists"

If you get an error saying a table already exists, you have two options:

1. **Skip the existing table**: The migration uses `CREATE TABLE IF NOT EXISTS`, so it should skip existing tables. If you still see errors, you may need to drop and recreate the table (be careful - this will delete data!).

2. **Check existing tables**: Run this query to see what tables already exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### Error: "permission denied"

Make sure you're running the migration as a user with CREATE TABLE permissions. In Supabase:
- Use the SQL Editor (you have full permissions there)
- Make sure you're logged in as the project owner or have been granted the necessary permissions

### Error: "foreign key constraint"

The `quiz_attempts` table references the `quizzes` and `users` tables. Make sure:
- The `quizzes` table is created first
- The `users` table exists (either from Supabase Auth or from the migration)

### Error: "Could not find the table 'public.quizzes' in the schema cache"

This error occurs when:
1. The table doesn't exist yet (run the migration script)
2. The table exists but Supabase hasn't refreshed its schema cache
   - **Solution**: Wait a few seconds and try again, or restart your Next.js dev server

## Manual Table Creation

If you prefer to create tables one at a time, here are the essential tables for quiz functionality:

### Quizzes Table (Required)

```sql
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty VARCHAR(50),
  questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE
);
```

### Quiz Attempts Table (Required)

```sql
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  score DECIMAL(5,2),
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
```

## Testing After Migration

After running the migration, test your application:

1. Start your Next.js dev server: `npm run dev`
2. Navigate to `/quizzes` page
3. Try to create or view a quiz
4. Check the browser console for any errors

## Need Help?

If you encounter issues:
1. Check the Supabase logs in the Dashboard under **Logs** > **Postgres Logs**
2. Verify your environment variables are set correctly in `.env.local`
3. Make sure your Supabase service role key has the necessary permissions

