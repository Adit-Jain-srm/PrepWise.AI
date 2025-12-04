# Quick Setup - Copy & Paste Your .env.local

## Step 1: Create .env.local File

In the `prepwise` folder, create a new file named `.env.local` (note the dot at the start)

## Step 2: Copy This Exact Content

```bash
# Supabase Configuration - Client-Side
NEXT_PUBLIC_SUPABASE_URL=https://zrtcjogguhkviheuxxlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydGNqb2dndWhrdmloZXV4eGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Njg5MzYsImV4cCI6MjA4MDQ0NDkzNn0.YVp20_ar-JzYIh1yD5Ba9pi33NaUv0SrezuoO5wUBrA

# Supabase Configuration - Server-Side
SUPABASE_URL=https://zrtcjogguhkviheuxxlz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-10-01-preview

# Azure Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=prepwise-assets

# Azure Speech Configuration
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=eastus

# Optional
REPORT_SIGNING_SECRET=your-secret-key-for-pdf-signing
```

## Step 3: Get Your Service Role Key

1. Go to: https://app.supabase.com/project/zrtcjogguhkviheuxxlz/settings/api
2. Find the **"service_role"** key (scroll down - it's different from the anon key)
3. Copy it and replace `your-service-role-key-here` in your `.env.local`

## Important Notes

- ✅ The Supabase URL and anon key are already filled in above
- ⚠️ You still need to add your Service Role Key (secret key for server-side)
- ⚠️ Add your Azure credentials when you have them
- ✅ The `.env.local` file is already in `.gitignore` - it won't be committed

## File Location

Your `.env.local` should be in:
```
PrepWise.AI/prepwise/.env.local
```

## Quick Test

After creating the file, restart your dev server:
```bash
npm run dev
```

The Supabase connection should work for authentication!

