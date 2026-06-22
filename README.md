<div align="center">

# PrepWise.AI

**AI-Powered Interview Preparation Platform**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Azure OpenAI](https://img.shields.io/badge/Azure_OpenAI-GPT--4o-0078D4?logo=microsoftazure)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/Live-Vercel-black?logo=vercel)](https://prep-wise-ai-gvw4.vercel.app)
[![Last Commit](https://img.shields.io/github/last-commit/Adit-Jain-srm/PrepWise.AI)](https://github.com/Adit-Jain-srm/PrepWise.AI)

Intelligent interview preparation with adaptive AI questions, real-time tone and confidence analysis, and personalized coaching reports.

[Live Demo](https://prep-wise-ai-gvw4.vercel.app) · [Demo Video](https://youtu.be/iWFEWtzod9k) · [Documentation](./docs/)

</div>

---

## Overview

PrepWise.AI is a full-stack interview preparation platform that uses generative AI to deliver a realistic, feedback-rich mock interview experience. Candidates upload a resume or essay, receive tailored interview questions, record video responses, and get instant AI-generated evaluations covering tone, confidence, communication clarity, and content quality — all packaged into a downloadable PDF coaching report.

## Key Features

### Adaptive Interview Engine
- **Resume and Essay Parsing** — Structured extraction from PDF/DOCX uploads using Azure OpenAI
- **Personalized Question Generation** — Context-aware questions derived from candidate background and target role
- **Video Interview Studio** — Browser-based recording with configurable prep and response timers
- **Written Response Simulation** — Timed essay prompts with real-time word count validation

### AI Evaluation and Feedback
- **Multi-Dimensional Scoring** — Tone, confidence, clarity, and content relevance analysis
- **Speech-to-Text Transcription** — Azure Speech Services for accurate response capture
- **Performance Dashboard** — Interactive visualizations powered by Plotly.js
- **PDF Coaching Reports** — Downloadable, detailed feedback documents

### Platform Capabilities
- **Quiz System** — Multiple categories with adaptive difficulty and instant scoring
- **Learning Hub** — Curated videos, articles, podcasts, and courses for interview preparation
- **Recording History** — Review past sessions and track improvement over time
- **Subscription Tiers** — Free, Premium, and Enterprise plans with tiered access

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Plotly.js |
| **Backend** | Next.js API Routes (serverless), TypeScript (strict mode) |
| **AI Services** | Azure OpenAI (GPT-4o), Google Gemini (fallback), LangChain |
| **Speech** | Azure Speech SDK (transcription and audio analysis) |
| **Storage** | Azure Blob Storage (media assets), Supabase/Postgres (data persistence) |
| **PDF Generation** | PDFKit |
| **Deployment** | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- Azure OpenAI deployment (GPT-4o-mini recommended for cost efficiency)
- Azure Speech Service resource
- Azure Blob Storage account
- Supabase project (optional — in-memory fallback available)

### Installation

```bash
git clone https://github.com/Adit-Jain-srm/PrepWise.AI.git
cd PrepWise.AI/prepwise
npm install
```

### Configuration

Copy the environment template and populate your service credentials:

```bash
cp .env.example .env.local
```

Required environment variables are documented in [`docs/SETUP.md`](./docs/SETUP.md).

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Deployment

PrepWise.AI is optimized for Vercel deployment:

1. Push to GitHub
2. Import the repository in Vercel
3. Set environment variables in the Vercel dashboard
4. Deploy

See [`docs/SETUP.md`](./docs/SETUP.md) for detailed deployment instructions.

## Project Structure

```
PrepWise.AI/
├── prepwise/                    # Next.js application
│   ├── src/
│   │   ├── app/                # App Router pages and API routes
│   │   │   ├── api/
│   │   │   │   ├── auth/      # Authentication endpoints
│   │   │   │   ├── candidates/ # Resume parsing
│   │   │   │   ├── dashboard/  # User dashboard data
│   │   │   │   ├── interviews/ # Interview flow
│   │   │   │   ├── quizzes/    # Quiz system
│   │   │   │   ├── recordings/ # Recording history
│   │   │   │   ├── learn/      # Learning content
│   │   │   │   └── news/       # News feed
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   ├── history/        # Recording history page
│   │   │   ├── interview/      # Interview studio page
│   │   │   ├── quizzes/        # Quiz pages
│   │   │   ├── learn/          # Learning hub page
│   │   │   ├── news/           # News feed page
│   │   │   ├── pricing/        # Pricing page
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Landing page
│   │   ├── components/         # React components
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── PaywallGate.tsx
│   │   │   ├── ResumeUploadCard.tsx
│   │   │   ├── InterviewRecorder.tsx
│   │   │   ├── PerformanceDashboard.tsx
│   │   │   └── Navigation.tsx
│   │   └── lib/                # Shared libraries
│   │       ├── auth/           # Auth utilities
│   │       ├── azure/          # Azure service clients
│   │       ├── db/             # Database repositories
│   │       ├── services/       # Business logic
│   │       └── types/          # TypeScript type definitions
│   ├── docs/                   # Project documentation
│   └── package.json
├── docs/                       # Additional documentation
│   ├── INTEGRATION_GUIDE.md    # Embedding PrepWise in existing apps
│   ├── COST_ANALYSIS.md        # API cost breakdown
│   ├── DATABASE_SCHEMA.md      # Database schema reference
│   ├── SETUP.md                # Setup and deployment guide
│   └── TROUBLESHOOTING.md      # Common issues and solutions
└── README.md
```

## Documentation

| Document | Description |
|----------|-------------|
| [`prepwise/README.md`](./prepwise/README.md) | Detailed architecture and internal setup |
| [`docs/SETUP.md`](./docs/SETUP.md) | Step-by-step installation and configuration |
| [`docs/INTEGRATION_GUIDE.md`](./docs/INTEGRATION_GUIDE.md) | Embedding PrepWise.AI into existing websites |
| [`docs/COST_ANALYSIS.md`](./docs/COST_ANALYSIS.md) | API usage and cost optimization |
| [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) | Database schema reference |
| [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) | Common issues and solutions |

## Architecture Highlights

- **Serverless-first** — All backend logic runs as Next.js API routes on Vercel Edge/Serverless functions
- **Graceful degradation** — Missing services (speech, storage, database) fall back to in-memory alternatives
- **Type safety** — TypeScript strict mode across the entire codebase
- **Modular AI layer** — Swappable between Azure OpenAI and Google Gemini via configuration

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

<div align="center">

**[Live Demo](https://prep-wise-ai-gvw4.vercel.app)** · **[GitHub](https://github.com/Adit-Jain-srm/PrepWise.AI)** · **[Demo Video](https://youtu.be/iWFEWtzod9k)**

</div>
