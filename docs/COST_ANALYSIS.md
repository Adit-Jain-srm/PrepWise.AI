# PrepWise.AI Cost Analysis

Comprehensive cost breakdown for running PrepWise.AI, including API costs, infrastructure costs, and per-session estimates.

## Table of Contents

1. [Overview](#overview)
2. [Cost Components](#cost-components)
3. [Azure Services Costs](#azure-services-costs)
4. [Supabase Costs](#supabase-costs)
5. [Deployment Costs](#deployment-costs)
6. [Per-Session Cost Analysis](#per-session-cost-analysis)
7. [Monthly Cost Estimates](#monthly-cost-estimates)
8. [Cost Optimization Strategies](#cost-optimization-strategies)
9. [API Call Breakdown](#api-call-breakdown)
10. [Scaling Cost Projections](#scaling-cost-projections)

---

## Overview

PrepWise.AI uses multiple cloud services, each with different pricing models. **This analysis focuses on GPT-4o-mini only and free tier options** to minimize costs when starting out.

- **Azure OpenAI**: Pay-per-token usage (GPT-4o-mini only)
- **Azure Speech**: Pay-per-minute of audio transcribed
- **Azure Blob Storage**: Pay-per-GB stored + transactions
- **Supabase**: Free tier available (500MB database, 2GB bandwidth)
- **Vercel**: Free tier available (100GB bandwidth)
- **Stripe**: Transaction fees (2.9% + $0.30 per transaction)

**Starting Cost**: You can run PrepWise.AI for **$0/month fixed costs** using free tiers, paying only for Azure API usage.

---

## Cost Components

### Fixed Monthly Costs (Starting with Free Tiers)

| Service | Tier | Monthly Cost | Limits | Notes |
|---------|------|--------------|--------|-------|
| Supabase | **Free** | **$0** | 500MB database, 2GB bandwidth | ✅ **Start here** |
| Supabase | Pro | $25 | 8GB database, 50GB bandwidth | Upgrade when needed |
| Vercel | **Hobby** | **$0** | 100GB bandwidth | ✅ **Start here** |
| Vercel | Pro | $20 | 1TB bandwidth | Upgrade when needed |

**Starting Fixed Cost: $0/month** 🎉

### Variable Costs (Usage-Based - Pay Only for What You Use)

- Azure OpenAI API calls (GPT-4o-mini)
- Azure Speech transcription
- Azure Blob Storage
- Stripe transaction fees (only when users pay)

---

## Azure Services Costs

### 1. Azure OpenAI (GPT-4o-mini Only)

#### Pricing (as of 2024)

| Model | Input (per 1K tokens) | Output (per 1K tokens) | Notes |
|-------|----------------------|------------------------|-------|
| **GPT-4o-mini** | **$0.00015** | **$0.0006** | ✅ **Cost-optimized, used throughout** |

#### API Calls in PrepWise.AI (GPT-4o-mini Only)

**Per Interview Session:**

1. **Resume Parsing** (`/api/candidates/parse`)
   - **Model**: GPT-4o-mini
   - **Input tokens**: ~2,000-4,000 (resume text + system prompt)
   - **Output tokens**: ~1,500-2,500 (structured JSON profile)
   - **Cost**: 
     - Input: 3,000 tokens × $0.00015/1K = $0.00045
     - Output: 2,000 tokens × $0.0006/1K = $0.0012
     - **Total: ~$0.00165 per resume**

2. **Question Generation** (`/api/interviews/plan`)
   - **Free Tier**: 5 questions
   - **Premium Tier**: 7+ questions
   - **Model**: GPT-4o-mini
   - **Input tokens**: ~3,000-5,000 (profile + system prompt)
   - **Output tokens**: ~2,000-4,000 (questions JSON)
   - **Cost**:
     - Input: 4,000 tokens × $0.00015/1K = $0.0006
     - Output: 3,000 tokens × $0.0006/1K = $0.0018
     - **Total: ~$0.0024 per plan**

3. **Response Evaluation** (`/api/interviews/evaluate`)
   - **Per question response** (typically 5-7 per session)
   - **Model**: GPT-4o-mini
   - **Input tokens**: ~2,000-4,000 per response (transcript + question + rubric)
   - **Output tokens**: ~1,500-2,500 per response (evaluation JSON)
   - **Cost per response**:
     - Input: 3,000 tokens × $0.00015/1K = $0.00045
     - Output: 2,000 tokens × $0.0006/1K = $0.0012
     - **Total: ~$0.00165 per response**

4. **Essay Evaluation** (`/api/interviews/evaluate` - essay part)
   - **Per essay** (typically 1-2 per session)
   - **Model**: GPT-4o-mini
   - **Input tokens**: ~1,500-3,000 (essay text + prompt)
   - **Output tokens**: ~1,000-2,000 (evaluation JSON)
   - **Cost per essay**:
     - Input: 2,000 tokens × $0.00015/1K = $0.0003
     - Output: 1,500 tokens × $0.0006/1K = $0.0009
     - **Total: ~$0.0012 per essay**

5. **Quiz Generation** (`/api/quizzes/[quizId]/questions`)
   - **Per quiz** (10 questions typically)
   - **Model**: GPT-4o-mini
   - **Input tokens**: ~2,000-3,000
   - **Output tokens**: ~3,000-5,000 (10 questions)
   - **Cost**:
     - Input: 2,500 tokens × $0.00015/1K = $0.000375
     - Output: 4,000 tokens × $0.0006/1K = $0.0024
     - **Total: ~$0.0028 per quiz**

#### Total Azure OpenAI Cost Per Session (GPT-4o-mini)

- Resume parsing: $0.00165
- Question generation: $0.0024
- Response evaluation (6 responses): $0.00165 × 6 = $0.0099
- Essay evaluation (1 essay): $0.0012
- **Total per session: ~$0.015**

---

### 2. Azure Speech Service

#### Pricing (as of 2024)

| Tier | Price per Hour | Notes |
|------|----------------|-------|
| Standard | $1.00/hour | Real-time transcription |
| Custom | $6.00/hour | Custom models |

#### Usage in PrepWise.AI

**Per Interview Session:**
- **Audio duration**: ~6-10 minutes per session (5-7 questions × 60s each)
- **Transcription cost**: 
  - 8 minutes = 0.133 hours
  - Cost: 0.133 × $1.00 = **~$0.13 per session**

**Note**: Azure Speech charges per hour of audio transcribed, rounded to the nearest second.

---

### 3. Azure Blob Storage

#### Pricing (as of 2024)

| Tier | Storage (per GB/month) | Transactions (per 10K) | Notes |
|------|------------------------|------------------------|-------|
| Hot | $0.018 | $0.05 | Frequently accessed |
| Cool | $0.01 | $0.05 | Infrequently accessed |
| Archive | $0.00099 | $0.05 | Rarely accessed |

#### Usage in PrepWise.AI

**Per Interview Session:**
- **Video files**: ~50-100 MB per session (5-7 recordings)
- **Audio files**: ~5-10 MB per session
- **Total storage**: ~60-110 MB per session

**Storage cost (Hot tier)**:
- 100 MB = 0.1 GB
- Monthly cost: 0.1 GB × $0.018 = **$0.0018 per session**

**Transaction costs**:
- Write operations: ~10-15 per session (upload videos/audio)
- Read operations: ~5-10 per session (retrieve recordings)
- Total transactions: ~20 per session
- Cost: 20 / 10,000 × $0.05 = **$0.0001 per session**

**Total Blob Storage per session: ~$0.002**

**Monthly storage** (assuming 100 sessions/month):
- 100 sessions × 100 MB = 10 GB
- Monthly cost: 10 GB × $0.018 = **$0.18/month**

---

## Supabase Costs

### Pricing Tiers

| Tier | Price | Database | Bandwidth | Storage | Notes |
|------|-------|----------|-----------|---------|-------|
| Free | $0 | 500 MB | 2 GB | 1 GB | Good for development |
| Pro | $25 | 8 GB | 50 GB | 100 GB | Recommended for production |
| Team | $599 | 100 GB | 500 GB | 1 TB | Enterprise scale |

### Database Usage

**Per Interview Session:**
- User profile: ~5-10 KB
- Interview plan: ~10-20 KB
- Evaluation results: ~20-30 KB
- Recording metadata: ~5-10 KB
- **Total per session: ~40-70 KB**

**Free Tier Capacity:**
- **500 MB database limit**
- Can store ~7,000-12,000 sessions before upgrade needed
- **Free tier sufficient** for early stage / low-medium traffic

**Monthly storage** (assuming 100 sessions/month):
- 100 sessions × 50 KB = 5 MB
- Plus user accounts, quizzes, learning content: ~50-100 MB total
- **Free tier can handle ~4,000-10,000 sessions** before upgrade

### Bandwidth Usage

**Per Session:**
- API requests: ~500 KB - 1 MB
- PDF report download: ~200-500 KB
- **Total per session: ~1-2 MB**

**Free Tier Capacity:**
- **2 GB bandwidth limit per month**
- Can handle ~1,000-2,000 sessions/month
- **Free tier sufficient** for early stage / low-medium traffic

**Monthly bandwidth** (assuming 100 sessions/month):
- 100 sessions × 1.5 MB = 150 MB
- Plus other API calls: ~500 MB - 1 GB total
- **Well within free tier limits**

### Recommendation

- **✅ Starting Out**: Free tier ($0) - handles up to ~1,000 sessions/month
- **Upgrade to Pro** ($25/month) when you exceed free tier limits
- **Upgrade to Team** ($599/month) only at enterprise scale

---

## Deployment Costs

### Vercel Pricing

| Tier | Price | Bandwidth | Builds | Notes |
|------|-------|-----------|--------|-------|
| Hobby | $0 | 100 GB | Unlimited | Personal projects |
| Pro | $20 | 1 TB | Unlimited | Team projects |
| Enterprise | Custom | Custom | Custom | Custom pricing |

### Usage

**Bandwidth per session:**
- Page loads: ~2-5 MB
- API responses: ~1-2 MB
- **Total per session: ~3-7 MB**

**Free Tier Capacity:**
- **100 GB bandwidth limit per month**
- Can handle ~14,000-33,000 sessions/month
- **Free tier more than sufficient** for starting out

**Monthly bandwidth** (assuming 100 sessions/month):
- 100 sessions × 5 MB = 500 MB
- Plus other traffic: ~1-2 GB total
- **Well within free tier limits**

**Recommendation**:
- **✅ Starting Out**: Hobby tier ($0) - handles massive traffic
- **Upgrade to Pro** ($20/month) only if you need team features or exceed 100GB

---

## Per-Session Cost Analysis

### Complete Cost Breakdown Per Interview Session (GPT-4o-mini Only)

| Component | Cost | Notes |
|-----------|------|-------|
| Azure OpenAI (resume) | $0.00165 | Resume parsing |
| Azure OpenAI (questions) | $0.0024 | Question generation |
| Azure OpenAI (evaluations) | $0.0099 | 6 response evaluations |
| Azure OpenAI (essay) | $0.0012 | Essay evaluation |
| Azure Speech | $0.13 | Audio transcription |
| Azure Blob Storage | $0.002 | Video/audio storage |
| Supabase (Free) | $0 | Database operations (free tier) |
| Vercel (Free) | $0 | Bandwidth (free tier) |
| **Total per session** | **~$0.145** | **~$0.15 rounded** |

### Cost Breakdown

- **Azure OpenAI**: ~$0.015 (10% of total)
- **Azure Speech**: ~$0.13 (90% of total) ⚠️ Largest cost component
- **Azure Blob Storage**: ~$0.002 (minimal)
- **Infrastructure**: $0 (using free tiers)

**Key Insight**: Audio transcription is the biggest cost driver. Consider optimizing audio length or using cheaper transcription for non-critical use cases.

---

## Monthly Cost Estimates (Starting with Free Tiers)

### Scenario 1: Starting Out (10 sessions/month) 🚀

#### Fixed Costs
- Supabase: **Free** ($0)
- Vercel: **Free** ($0)
- **Total Fixed: $0/month** ✅

#### Variable Costs (GPT-4o-mini)
- Azure OpenAI: 10 × $0.015 = $0.15
- Azure Speech: 10 × $0.13 = $1.30
- Azure Blob Storage: ~$0.02
- **Total Variable: ~$1.47/month**

**Total Monthly Cost: ~$1.50** 💰

### Scenario 2: Early Growth (50 sessions/month)

#### Fixed Costs
- Supabase: **Free** ($0)
- Vercel: **Free** ($0)
- **Total Fixed: $0/month** ✅

#### Variable Costs (GPT-4o-mini)
- Azure OpenAI: 50 × $0.015 = $0.75
- Azure Speech: 50 × $0.13 = $6.50
- Azure Blob Storage: ~$0.10
- **Total Variable: ~$7.35/month**

**Total Monthly Cost: ~$7.35** 💰

### Scenario 3: Growing Business (200 sessions/month)

#### Fixed Costs
- Supabase: **Free** ($0) - Still within limits
- Vercel: **Free** ($0) - Still within limits
- **Total Fixed: $0/month** ✅

#### Variable Costs (GPT-4o-mini)
- Azure OpenAI: 200 × $0.015 = $3.00
- Azure Speech: 200 × $0.13 = $26.00
- Azure Blob Storage: ~$0.40
- **Total Variable: ~$29.40/month**

**Total Monthly Cost: ~$29.40** 💰

### Scenario 4: Established Business (500 sessions/month)

#### Fixed Costs
- Supabase: **Free** ($0) - Approaching limits, consider upgrade
- Vercel: **Free** ($0) - Still fine
- **Total Fixed: $0/month** ✅

#### Variable Costs (GPT-4o-mini)
- Azure OpenAI: 500 × $0.015 = $7.50
- Azure Speech: 500 × $0.13 = $65.00
- Azure Blob Storage: ~$1.00
- **Total Variable: ~$73.50/month**

**Total Monthly Cost: ~$73.50** 💰

### Scenario 5: Scaling Up (1,000 sessions/month)

#### Fixed Costs
- Supabase: **Pro** ($25) - Upgrade needed for bandwidth
- Vercel: **Free** ($0) - Still fine
- **Total Fixed: $25/month**

#### Variable Costs (GPT-4o-mini)
- Azure OpenAI: 1,000 × $0.015 = $15.00
- Azure Speech: 1,000 × $0.13 = $130.00
- Azure Blob Storage: ~$2.00
- **Total Variable: ~$147/month**

**Total Monthly Cost: ~$172/month** 💰

### Scenario 6: High Traffic (5,000 sessions/month)

#### Fixed Costs
- Supabase: **Pro** ($25) - Still sufficient
- Vercel: **Pro** ($20) - Upgrade for team features
- **Total Fixed: $45/month**

#### Variable Costs (GPT-4o-mini)
- Azure OpenAI: 5,000 × $0.015 = $75.00
- Azure Speech: 5,000 × $0.13 = $650.00
- Azure Blob Storage: ~$10.00
- **Total Variable: ~$735/month**

**Total Monthly Cost: ~$780/month** 💰

### Cost Summary Table

| Sessions/Month | Fixed Cost | Variable Cost | **Total Cost** | Tier Status |
|----------------|------------|---------------|----------------|-------------|
| 10 | $0 | $1.50 | **$1.50** | ✅ All Free |
| 50 | $0 | $7.35 | **$7.35** | ✅ All Free |
| 200 | $0 | $29.40 | **$29.40** | ✅ All Free |
| 500 | $0 | $73.50 | **$73.50** | ✅ All Free |
| 1,000 | $25 | $147 | **$172** | ⚠️ Supabase Pro |
| 5,000 | $45 | $735 | **$780** | ⚠️ Both Pro |

---

## Cost Optimization Strategies

### 1. Start with Free Tiers ✅

**Use free tiers for as long as possible:**
- Supabase Free: Up to 500MB database, 2GB bandwidth
- Vercel Free: Up to 100GB bandwidth
- **Savings**: $0 fixed costs until you scale significantly

**When to upgrade:**
- Supabase: When you exceed 2GB bandwidth/month (~1,000+ sessions)
- Vercel: When you exceed 100GB bandwidth/month (~14,000+ sessions) or need team features

### 2. Optimize Audio Transcription (Biggest Cost Saver)

**Audio transcription is 90% of your costs!**

**Strategies:**
- Compress audio before transcription (reduce file size)
- Remove silence from recordings
- Use lower sample rates for non-critical audio
- Consider batch transcription for non-real-time use cases
- Skip transcription for practice sessions (optional)

**Savings**: Reduce transcription costs by 20-40%

### 3. Caching Strategies

**Cache frequently accessed data:**
- Quiz questions (regenerate only when needed)
- Learning content (static content)
- News feed (update periodically)

**Savings**: Reduce API calls by 20-30%

### 4. Storage Optimization

**Use Azure Blob Storage Cool tier** for:
- Old recordings (> 30 days)
- Archived sessions

**Savings**: 44% reduction in storage costs ($0.018 → $0.01 per GB)

### 5. Batch Processing

**Batch operations:**
- Process multiple evaluations together
- Bulk upload recordings
- Batch database operations

**Savings**: Reduce transaction costs

### 6. Tiered Storage Lifecycle

**Implement storage lifecycle:**
- Hot tier: Recent recordings (0-30 days)
- Cool tier: Older recordings (30-90 days)
- Archive tier: Very old recordings (> 90 days)

**Savings**: Up to 95% reduction in storage costs for archived data

---

## API Call Breakdown

### Per Interview Session

| API Endpoint | Calls | Tokens (Input) | Tokens (Output) | Cost (GPT-4o-mini) |
|--------------|-------|----------------|-----------------|---------------------|
| `/api/candidates/parse` | 1 | 3,000 | 2,000 | $0.00165 |
| `/api/interviews/plan` | 1 | 4,000 | 3,000 | $0.0024 |
| `/api/interviews/transcribe` | 6 | N/A | N/A | $0.13 (Speech) |
| `/api/interviews/evaluate` | 7 | 21,000 | 14,000 | $0.0111 |
| `/api/interviews/assets` | 1 | N/A | N/A | $0.002 (Storage) |
| `/api/interviews/report` | 1 | N/A | N/A | $0.0001 (Compute) |
| **Total** | **17** | **28,000** | **19,000** | **~$0.15** |

### Additional API Calls

| Feature | API Endpoint | Calls | Cost per Call |
|---------|--------------|-------|---------------|
| Quiz | `/api/quizzes/[id]/questions` | 1 | $0.0028 |
| Quiz Submit | `/api/quizzes/[id]/submit` | 1 | $0.0001 |
| Recording History | `/api/recordings` | 1 | $0.0001 |
| Learning Content | `/api/learn` | 1 | $0.0001 |
| News Feed | `/api/news` | 1 | $0.0001 |

---

## Scaling Cost Projections

### Cost per User (Monthly)

Assuming average user completes **5 interviews/month**:

| Component | Cost per User | Notes |
|-----------|---------------|-------|
| Azure OpenAI (GPT-4o-mini) | $0.075 | 5 sessions × $0.015 |
| Azure Speech | $0.65 | 5 sessions × $0.13 |
| Azure Blob Storage | $0.01 | Minimal |
| Supabase (shared, free tier) | $0 | Free tier covers many users |
| Vercel (shared, free tier) | $0 | Free tier covers many users |
| **Total per user** | **~$0.74** | **Much lower with free tiers!** |

### Revenue vs Cost Analysis

**Subscription Pricing:**
- Free tier: $0/month
- Premium tier: $29.99/month
- Enterprise tier: $99.99/month

**Cost per Premium User** (5 interviews/month): ~$0.74
**Revenue per Premium User**: $29.99
**Profit Margin**: ~97.5% 🎉

**Break-even Analysis:**
- Free tier users: Cost ~$0.74/month (no revenue)
- Premium tier users: Cost ~$0.74/month, Revenue $29.99/month
- **Need ~40 free users per premium user to break even** (but free tier infrastructure costs $0!)

### Scaling Projections (Using Free Tiers)

| Users | Sessions/Month | Monthly Cost | Revenue (Premium) | Profit | Infrastructure |
|-------|----------------|--------------|-------------------|--------|----------------|
| 20 | 100 | **$14.50** | $600 | $585.50 | ✅ All Free |
| 100 | 500 | **$73.50** | $2,999 | $2,925.50 | ✅ All Free |
| 200 | 1,000 | **$172** | $5,998 | $5,826 | ⚠️ Supabase Pro |
| 500 | 2,500 | **$367.50** | $14,995 | $14,627.50 | ⚠️ Supabase Pro |
| 1,000 | 5,000 | **$780** | $29,990 | $29,210 | ⚠️ Both Pro |

**Note**: Assumes 100% premium users. Actual mix will vary. Free tier infrastructure costs $0 until you exceed limits!

---

## Summary

### Key Takeaways

1. **✅ Starting Cost: $0/month fixed** - Use free tiers (Supabase Free + Vercel Free)
2. **Per-session cost: ~$0.15** (GPT-4o-mini only)
3. **Variable costs**: Primarily Azure Speech ($0.13/session = 90% of cost)
4. **Can run 500+ sessions/month for < $75** using free tiers
5. **Profitability**: High margin (~96%) for premium users

### Monthly Cost Ranges

| Stage | Sessions/Month | Monthly Cost |
|-------|----------------|--------------|
| **Starting Out** | 10-50 | **$1.50 - $7.35** |
| **Early Growth** | 200-500 | **$29 - $74** |
| **Scaling** | 1,000+ | **$172+** (upgrade Supabase) |

### Recommendations

1. **✅ Start with free tiers** - Supabase Free + Vercel Free ($0/month)
2. **✅ Use GPT-4o-mini only** - Cost-effective, good quality
3. **✅ Optimize audio transcription** - Biggest cost saver (90% of costs)
4. **Monitor usage** - Upgrade Supabase when you exceed 2GB bandwidth/month
5. **Implement caching** - Reduce API calls by 20-30%
6. **Set up cost alerts** - Azure Cost Management alerts
7. **Upgrade gradually** - Only when you hit free tier limits

### Cost Monitoring

Set up monitoring:
- Azure Cost Management alerts
- Supabase usage dashboard
- Vercel analytics
- Custom cost tracking dashboard

---

---

## Quick Start Cost Estimate

**Want to get started? Here's what it costs:**

- **Month 1 (10 sessions)**: ~$1.50 total
- **Month 2-3 (50 sessions/month)**: ~$7/month
- **Month 4-6 (200 sessions/month)**: ~$29/month
- **Month 7+ (500 sessions/month)**: ~$74/month

**All using free tiers!** Upgrade only when you exceed free tier limits.

---

**Last Updated**: December 2025  
**Pricing Subject to Change**: Check current pricing on Azure, Supabase, and Vercel websites  
**Model**: GPT-4o-mini only (cost-optimized)
