# PrepWise.AI

AI-powered portal for MBA mock interviews. Candidates upload their resume and optional essays; the platform parses their profile, generates a tailored question set, records a live video simulation, scores verbal/non‑verbal cues via Azure services, and produces a downloadable PDF coaching report.

## Feature Highlights

- **Resume & Essay Intake** – PDF/DOCX parsing backed by Azure OpenAI structured outputs and optional essay ingestion.
- **Personalized Interview Plan** – LangChain + Azure OpenAI craft behavioral, situational, and school-fit questions.
- **200-Word Written Simulation** – Guided essay practice with word-count enforcement and storage.
- **Video Interview Studio** – MediaRecorder-based interface with 30s prep/60s response timers, dual audio/video capture, and basic non-verbal heuristics.
- **AI Evaluation Engine** – Azure Speech SDK transcription, filler/pace analytics, LangChain scoring prompts, and radar/bar visualizations (Plotly).
- **PDF Coaching Report** – PDFKit-powered export including rubric breakdowns and question-level feedback.
- **Storage & Persistence** – Azure Blob Storage for assets; Supabase (optional) for profiles/sessions/evaluations.

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
  - Azure OpenAI deployment (e.g., `gpt-4o-mini` or `gpt-4o` for chat completions with Structured Outputs).
  - Azure Blob Storage (hot/cool tier, private container).
  - Azure Speech service (Speech-to-Text standard pricing tier).
- Optional: Supabase project (Postgres) for persistent session storage.

## Environment Variables

Create `prepwise/.env.local` with the following (copy/adjust as needed):

```bash
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_KEY="az-openai-key"
AZURE_OPENAI_DEPLOYMENT="gpt-4o-mini"
# optional override (default 2024-10-01-preview)
# AZURE_OPENAI_API_VERSION=""

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

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/candidates/parse` | POST (multipart) | Upload resume/essay → parse + store profile |
| `/api/interviews/plan` | POST | Generate tailored question plan |
| `/api/interviews/transcribe` | POST (multipart) | Audio blob → Azure Speech transcription + speech metrics |
| `/api/interviews/evaluate` | POST | Responses → Azure/LangChain evaluation |
| `/api/interviews/assets` | POST (multipart) | Persist audio/video/essay resources to Blob Storage |
| `/api/interviews/report` | POST | Generate PDF report for a session |

## Deployment (Vercel)

1. Push to GitHub and import in Vercel.
2. Configure the same environment variables in Vercel Project Settings → Environment Variables (Production + Preview).
3. Ensure Azure Blob container exists (CLI: `az storage container create ...`).
4. Optional: configure Supabase service key as `SUPABASE_SERVICE_ROLE_KEY` (never expose in browser).
5. Vercel build command: `npm run build` (already default). The PDF endpoint relies on Node runtime (Edge incompatible) which is automatically handled with `dynamic = "force-dynamic"`.

## Future Enhancements

- Eye-contact estimation via WebRTC face landmarks.
- Sentiment timeline overlays on Plotly charts.
- Coach chatbot for follow-up drills.
- Calendar integration for live coach reviews.

## Troubleshooting

- **Camera/Mic blocked**: Chrome/Edge require HTTPS or `localhost`. Ensure permissions are granted.
- **Azure Speech errors**: confirm MIME type `audio/webm` is supported in your region; adjust `MediaRecorder` MIME type if needed.
- **Supabase unavailable**: the app falls back to in-memory maps; restart wipes data.
- **Large resumes**: heavy PDFs may exceed Azure OpenAI token limits; consider chunking if necessary.

Happy interviewing 🚀
