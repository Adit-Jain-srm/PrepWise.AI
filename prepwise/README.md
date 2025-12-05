# PrepWise.AI

AI-powered comprehensive MBA interview preparation platform. Candidates upload their resume and optional essays; the platform parses their profile, generates personalized question sets, records live video simulations, scores verbal/non‑verbal cues via Azure services, and produces downloadable PDF coaching reports. Includes premium subscriptions, personalized quizzes, learning content, MBA news feed, and recording history.

## Feature Highlights

### Core Interview Features
- **Resume & Essay Intake** – PDF/DOCX parsing backed by Azure OpenAI structured outputs and optional essay ingestion.
- **Personalized Interview Plan** – LangChain + Azure OpenAI craft behavioral, situational, and school-fit questions. Premium users get 7+ highly personalized questions vs 5 for free users.
- **Written Essay Simulation** – 250-word target (500-word maximum) essay responses with real-time word count validation and color-coded feedback.
- **Video Interview Studio** – MediaRecorder-based interface with skip prep option, 30s prep/60s response timers, dual audio/video capture, and comprehensive non-verbal analysis.
- **AI Evaluation Engine** – Azure Speech SDK transcription, filler/pace analytics, enhanced evaluation with tone analysis, confidence analysis, and communication clarity. LangChain scoring prompts, and radar/bar visualizations (Plotly).
- **PDF Coaching Report** – PDFKit-powered export including rubric breakdowns and question-level feedback.

### Platform Features
- **Premium Subscription System** – Three-tier system (Free, Premium $29.99/month, Enterprise $99.99/month) with feature gating and paywall protection.
- **Interview Recording History** – View all past mock interviews with search and filter capabilities. Free users: last 3 recordings; Premium: unlimited.
- **Personalized Quiz System** – Multiple quiz categories (Behavioral, Leadership, School-Specific, Technical) with difficulty levels and instant feedback.
- **Learning Hub** – Curated videos, articles, podcasts, and courses with personalized recommendations and progress tracking.
- **MBA News Feed** – Latest MBA world news categorized by Admissions, Career, Schools, and Trends.
- **Storage & Persistence** – Azure Blob Storage for assets; Supabase for user profiles, sessions, evaluations, subscriptions, and content.

## Architecture Overview

- **Frontend**: Next.js 16 (App Router) + Tailwind 4, TypeScript, React hooks, Plotly visualizations.
- **Backend**: Next.js API routes orchestrating LangChain chains, Azure OpenAI (chat completions), Azure Speech SDK, Azure Storage, and optional Supabase persistence.
- **Key Modules**:
  - `src/lib/services/resumeParser.ts` – file text extraction + LLM structuring.
  - `src/lib/services/questionGenerator.ts` – LangChain JSON-schema prompts for question sets.
  - `src/lib/services/evaluationEngine.ts` – response scoring orchestrator.
  - `src/app/api/...` – REST endpoints for intake, planning, transcription, evaluation, asset upload, PDF report.
  - `src/components/*` – UI cards for each stage of the candidate journey.

## Prerequisites

- Node.js 18+ (Next.js requirement) and npm.
- Azure resources:
  - Azure OpenAI deployment (recommended: `gpt-4o` for best results, or `gpt-4o-mini` for cost optimization) with JSON schema structured outputs support (API version `2024-02-15-preview` or later).
  - Azure Blob Storage (hot/cool tier, private container).
  - Azure Speech service (Speech-to-Text standard pricing tier).
- Optional: Supabase project (Postgres) for persistent session storage. Falls back to in-memory storage if not configured.

## Environment Variables

Create `prepwise/.env.local` with the following (see `.env.example` for template):

```bash
# Azure OpenAI Configuration
# Note: Endpoint should be base URL only (e.g., https://your-resource.openai.azure.com/)
# The system automatically handles path and query parameters
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_KEY="az-openai-key"
AZURE_OPENAI_DEPLOYMENT="gpt-4o"
# Optional: API version (default: 2024-10-01-preview)
# Supported versions: 2024-02-15-preview, 2024-10-01-preview, 2025-01-01-preview, etc.
AZURE_OPENAI_API_VERSION="2024-10-01-preview"

AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=...;AccountName=..."
AZURE_STORAGE_CONTAINER="prepwise-assets"

AZURE_SPEECH_KEY="azure-speech-key"
AZURE_SPEECH_REGION="eastus"

# Optional persistence layer
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="supabase-service-role-key"
```

> ℹ️ Missing optional variables trigger an in-memory store fallback—handy for demos.

## Local Development

```bash
cd prepwise
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Linting & Type Checks

```bash
npm run lint
```

### Important API Routes

#### Interview Flow
| Route | Method | Purpose |
| --- | --- | --- |
| `/api/candidates/parse` | POST (multipart) | Upload resume/essay → parse + store profile |
| `/api/interviews/plan` | POST | Generate tailored question plan (accepts profile from frontend, tier-aware) |
| `/api/interviews/transcribe` | POST (multipart) | Audio blob → Azure Speech transcription + speech metrics (handles missing audio gracefully) |
| `/api/interviews/evaluate` | POST | Responses → Azure/LangChain evaluation (accepts plan and profile from frontend) |
| `/api/interviews/assets` | POST (multipart) | Persist audio/video/essay resources to Blob Storage (optional, non-blocking) |
| `/api/interviews/save` | POST | Save interview session to database |
| `/api/interviews/report` | POST | Generate PDF report for a session |

#### Platform Features
| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/user` | GET | Get current authenticated user and subscription tier |
| `/api/dashboard` | GET | Get user dashboard data (recordings, progress, stats) |
| `/api/quizzes` | GET | List available quizzes (tier-aware) |
| `/api/quizzes/[quizId]/questions` | GET | Get quiz questions |
| `/api/quizzes/[quizId]/submit` | POST | Submit quiz answers and get score |
| `/api/recordings` | GET | List user's interview recordings (tier-aware limits) |
| `/api/recordings/[sessionId]` | GET | Get specific recording details |
| `/api/learn` | GET | Get learning content (tier-aware) |
| `/api/news` | GET | Get MBA news feed |
| `/api/health` | GET | Health check and configuration verification |

## Deployment (Vercel)

1. Push to GitHub and import in Vercel.
2. Configure the same environment variables in Vercel Project Settings → Environment Variables (Production + Preview).
3. Ensure Azure Blob container exists (CLI: `az storage container create ...`).
4. Optional: configure Supabase service key as `SUPABASE_SERVICE_ROLE_KEY` (never expose in browser). Falls back to in-memory storage if not configured.
5. Vercel build command: `npm run build` (already default). The PDF endpoint relies on Node runtime (Edge incompatible) which is automatically handled with `dynamic = "force-dynamic"`.
6. **Important**: Ensure `next.config.ts` includes `serverExternalPackages` for CommonJS modules (pdf-parse, Azure Speech SDK).
7. Test the deployment using the health check endpoint: `/api/health`

## Recent Enhancements

### Platform Transformation (2024)
PrepWise.AI has been transformed from a single-session mock interview tool into a comprehensive MBA interview preparation platform with:

#### Premium Subscription System 💎
- Three-tier system: Free, Premium ($29.99/month), Enterprise ($99.99/month)
- Tier-based access control throughout the platform
- Paywall gates for premium features
- Visual premium indicators and badges
- Automatic tier detection in API routes

#### Enhanced Question Generation 🎯
- **Free Tier**: 5 basic interview questions
- **Premium Tier**: 7+ highly personalized questions referencing specific experiences
- Target school integration for premium users
- Enhanced essay prompts with deeper analysis
- Premium question generator service with detailed candidate analysis

#### Interview Recording History 📹
- Recording library with search and filter capabilities
- Free users: Last 3 recordings; Premium: Unlimited
- Detailed view with full evaluations and recordings
- Progress tracking over time
- Azure Blob Storage integration for video/audio files

#### Personalized Quiz System 📝
- Multiple quiz categories: Behavioral, Leadership, School-Specific, Technical
- Difficulty levels: Beginner, Intermediate, Advanced
- Interactive interface with multiple choice, true/false, short answer
- Instant feedback with scoring and explanations
- Progress tracking for quiz attempts

#### Learning Ecosystem 📚
- Curated videos, articles, podcasts, and courses
- Personalized content recommendations based on profile
- Progress tracking with bookmarks and ratings
- Categorized by topic and difficulty
- Premium exclusive content library

#### MBA News Feed 📰
- Latest MBA world news and updates
- Categories: Admissions, Career, Schools, Trends
- Featured articles and personalized feed
- Source attribution and credibility

### Technical Improvements
- Enhanced system prompts for question generation with detailed evaluation frameworks
- Improved essay prompt generation (250-word target, 500-word maximum)
- Better personalization based on candidate background
- JSON mode for reliable parsing
- Added tone analysis for vocal characteristics
- Added confidence analysis for presence assessment
- Added communication clarity analysis
- Enhanced non-verbal cue analysis
- Improved feedback quality with specific, actionable insights
- Handle missing audio/video gracefully
- Continue evaluation with placeholder data if transcription fails
- Send profile and plan from frontend to avoid store lookup issues
- Handle server restarts without losing data (frontend state persistence)
- Empty essay prompt field (not auto-filled)
- Graceful error handling throughout the application
- Fixed color scheme issues (white-on-white text)
- Improved accessibility with better contrast ratios
- Enhanced visual hierarchy with gradients and shadows
- Skip prep option in interview recorder
- Real-time word count feedback for essays
- Color-coded validation for essay word counts

## Future Enhancements

- Eye-contact estimation via WebRTC face landmarks.
- Sentiment timeline overlays on Plotly charts.
- Coach chatbot for follow-up drills.
- Calendar integration for live coach reviews.
- Advanced analytics with performance trends over time.
- Multi-language support.
- Custom evaluation rubrics.

## Troubleshooting

- **Camera/Mic blocked**: Chrome/Edge require HTTPS or `localhost`. Ensure permissions are granted.
- **Azure Speech errors**: The SDK is configured for Next.js compatibility using `require()`. If you see "AudioInputStream not available" errors, ensure `serverExternalPackages` is configured in `next.config.ts`. The system handles missing audio gracefully.
- **Supabase unavailable**: the app falls back to in-memory maps; restart wipes data. The system now sends profile and plan from frontend to avoid store lookup issues.
- **Large resumes**: heavy PDFs may exceed Azure OpenAI token limits; the system automatically truncates if necessary.
- **TypeScript errors**: Run `npm install` to ensure all type definitions are installed, including `@types/pdfkit`.
- **Build errors**: Ensure all environment variables are set in `.env.local` or Vercel project settings.
- **Candidate profile not found**: This is fixed by sending profile from frontend state. Ensure you're using the latest version.
- **White text on white background**: Fixed in latest version. All form inputs now have explicit text colors.
- **Essay prompt auto-filled**: Fixed in latest version. The field now starts empty with a placeholder example.

See [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) for detailed troubleshooting guide.

## Development Best Practices

- **Code Quality**: Run `npm run lint` before committing
- **Type Safety**: TypeScript strict mode enabled - fix all type errors
- **Error Handling**: All API routes include try-catch blocks with proper error responses and graceful fallbacks
- **State Management**: Using React hooks with refs for synchronous state access where needed
- **Security**: Never expose API keys in client-side code; use server-side API routes
- **Edge Cases**: Handle missing data gracefully (missing audio/video, empty responses, server restarts)
- **Module Compatibility**: CommonJS modules (pdf-parse, Azure Speech SDK) require `serverExternalPackages` configuration
- **UI/UX**: Ensure proper color contrast, accessibility, and user feedback

## Project Structure

```
prepwise/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication
│   │   │   ├── candidates/    # Resume parsing
│   │   │   ├── dashboard/     # User dashboard
│   │   │   ├── interviews/    # Interview flow APIs
│   │   │   ├── quizzes/       # Quiz system
│   │   │   ├── recordings/    # Recording history
│   │   │   ├── learn/         # Learning content
│   │   │   └── news/          # MBA news feed
│   │   ├── dashboard/         # Dashboard page
│   │   ├── history/           # Recording history page
│   │   ├── interview/         # Main interview page
│   │   ├── quizzes/           # Quiz pages
│   │   ├── learn/             # Learning hub page
│   │   ├── news/              # News feed page
│   │   ├── pricing/           # Pricing page
│   │   ├── layout.tsx         # Root layout with AuthProvider
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── AuthProvider.tsx   # Authentication context
│   │   ├── PaywallGate.tsx    # Premium feature gating
│   │   ├── PremiumBadge.tsx   # Premium indicators
│   │   ├── ResumeUploadCard.tsx
│   │   ├── InterviewRecorder.tsx
│   │   ├── PerformanceDashboard.tsx
│   │   └── Navigation.tsx     # Multi-page navigation
│   └── lib/                   # Shared libraries
│       ├── auth/              # Auth utilities (client/server)
│       ├── azure/             # Azure service clients
│       ├── db/                # Database repositories
│       │   ├── interviewRepository.ts
│       │   ├── quizRepository.ts
│       │   ├── recordingRepository.ts
│       │   └── userRepository.ts
│       ├── services/          # Business logic
│       │   ├── premiumQuestionGenerator.ts
│       │   ├── questionGenerator.ts
│       │   ├── quizGenerator.ts
│       │   └── ...
│       └── types/             # TypeScript types
│           ├── subscription.ts
│           └── user.ts
├── docs/                      # Documentation
│   ├── INTEGRATION_GUIDE.md   # Integration guide for existing websites
│   ├── COST_ANALYSIS.md       # Cost analysis and API usage
│   └── ...
└── package.json
```

## Documentation

- **[Integration Guide](../docs/INTEGRATION_GUIDE.md)** – Step-by-step guide for integrating PrepWise.AI into existing websites
- **[Cost Analysis](../docs/COST_ANALYSIS.md)** – Detailed cost breakdown per session, API usage, and infrastructure costs
- **[Database Schema](../docs/DATABASE_SCHEMA.md)** – Complete database schema documentation
- **[Features Enhancement](../docs/FEATURES_ENHANCEMENT.md)** – Detailed feature documentation
- **[Setup Instructions](../docs/SETUP_INSTRUCTIONS.md)** – Quick setup guide
- **[Troubleshooting](../docs/TROUBLESHOOTING.md)** – Common issues and solutions

## Subscription Tiers

| Feature | Free | Premium | Enterprise |
|---------|------|---------|------------|
| Basic Interview Questions | ✅ (5) | ✅ (Unlimited) | ✅ (Unlimited) |
| Personalized Questions | ❌ | ✅ | ✅ |
| Recording History | ✅ (Last 3) | ✅ (Unlimited) | ✅ (Unlimited) |
| Quizzes | ✅ (Limited) | ✅ (Unlimited) | ✅ (Unlimited) |
| Learning Content | ✅ (Basic) | ✅ (Full Library) | ✅ (Full Library) |
| MBA News | ✅ | ✅ | ✅ |
| Progress Tracking | ❌ | ✅ | ✅ |
| PDF Reports | ✅ | ✅ | ✅ |
| Team Management | ❌ | ❌ | ✅ |
| Custom Branding | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |

Happy interviewing 🚀
