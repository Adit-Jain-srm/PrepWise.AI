# Troubleshooting: "Could not find the table 'public.quizzes'"

## Issue

You're seeing this error:
```
Could not find the table 'public.quizzes' in the schema cache
```

## Cause

This error occurs because the `quizzes` table doesn't exist in your Supabase database yet. The quiz functionality requires several database tables to be created.

## Solution

### Quick Fix: Run the Migration Script

1. **Open Supabase SQL Editor**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to **SQL Editor** → **New Query**

2. **Run the Migration Script**
   - Open `docs/SUPABASE_MIGRATION.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run**

3. **Verify Tables Were Created**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('quizzes', 'quiz_attempts', 'users', 'subscriptions', 'interview_recordings');
   ```

4. **Restart Your Dev Server**
   - Stop your Next.js dev server (`Ctrl+C`)
   - Start it again: `npm run dev`

## What Was Changed

I've improved the error handling in the quiz repository to:
- ✅ Detect table-not-found errors specifically
- ✅ Show helpful warning messages pointing to the migration script
- ✅ Gracefully fall back to in-memory storage when tables don't exist
- ✅ Prevent crashes when tables are missing

The application will now continue working (using in-memory storage) until you create the tables, but you'll see warnings in the console.

## Files Created

1. **`docs/SUPABASE_MIGRATION.sql`** - Complete SQL migration script
2. **`docs/SUPABASE_SETUP.md`** - Detailed setup instructions
3. **Improved error handling** in `prepwise/src/lib/db/quizRepository.ts`

## Next Steps

After running the migration:
1. Tables will be created in Supabase
2. Quiz data will persist across server restarts
3. The warnings will disappear
4. All quiz features will work with database persistence

## Still Having Issues?

Check:
- ✅ Your Supabase credentials are correct in `.env.local`
- ✅ You have permission to create tables in Supabase
- ✅ The migration script ran without errors
- ✅ Your Next.js dev server was restarted after migration

For more details, see `docs/SUPABASE_SETUP.md`.

