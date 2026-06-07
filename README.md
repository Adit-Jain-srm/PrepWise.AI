<div align="center">

# PrepWise.AI

**AI-Powered Interview Preparation Platform**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/Adit-Jain-srm/PrepWise.AI)](https://github.com/Adit-Jain-srm/PrepWise.AI)

*Smart interview preparation with AI-generated questions, real-time feedback, and personalized coaching.*

</div>

---

> **🚀 VIRTUAL MBA INTERVIEW AI HACKATHON**  
> **By HACKHOUND**  
> **Built in under 24 hours by Team Arize**

## 🎯 Challenge

Build an AI-Powered MBA Mock Interview Portal featuring:
- Resume Parser & AI Question Generator
- Video Interview & Written Test Analysis
- Comprehensive Evaluation Engine with Tone, Confidence, and Communication Clarity Analysis
- Downloadable PDF Performance Reports

**📅 Event Date:** 10th November 2025  
**⏰ Registration Deadline:** 9th November 2025  
**⏱️ Development Time:** < 24 hours

---

## 👥 Team Information

- **Team Name:** Arize
- **Team Leader:** Adit Jain
- **Registration No:** RA2311026030176
- **Live Deployment (vercel):** https://prep-wise-ai-gvw4.vercel.app
- **YouTube Video:** https://youtu.be/iWFEWtzod9k (Version- 1)
- **GitHub Repository:** [https://github.com/Adit-Jain-srm/PrepWise.AI](https://github.com/Adit-Jain-srm/PrepWise.AI)

---

## 📖 About

PrepWise.AI is a comprehensive Azure OpenAI-powered MBA interview preparation platform. It parses candidate resumes/essays, generates personalized interview questions, records video responses, and delivers instant AI feedback with downloadable PDF reports.

**Built in under 24 hours** for the HACKHOUND Virtual MBA Interview AI Hackathon, and **enhanced into a full platform** with:
- Premium subscription tiers (Free, Premium $29.99/month, Enterprise $99.99/month)
- Interview recording history with progress tracking
- Personalized quiz system with multiple categories
- Learning hub with curated content
- MBA news feed

The full application lives inside the `prepwise` Next.js workspace. See `prepwise/README.md` for detailed setup instructions, architecture notes, and deployment guidance.

## 🚀 Quick Start

1. Navigate to the `prepwise` directory
2. Follow the setup instructions in `prepwise/README.md`
3. Configure your Azure services (OpenAI, Speech, Blob Storage)
4. Run `npm install` and `npm run dev`

## 📁 Project Structure

```
PrepWise.AI/
├── prepwise/                    # Next.js application (main workspace)
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── api/           # API routes
│   │   │   │   ├── auth/      # Authentication
│   │   │   │   ├── candidates/ # Resume parsing
│   │   │   │   ├── dashboard/  # User dashboard
│   │   │   │   ├── interviews/ # Interview flow APIs
│   │   │   │   ├── quizzes/    # Quiz system
│   │   │   │   ├── recordings/ # Recording history
│   │   │   │   ├── learn/      # Learning content
│   │   │   │   └── news/       # MBA news feed
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   ├── history/        # Recording history page
│   │   │   ├── interview/      # Main interview page
│   │   │   ├── quizzes/        # Quiz pages
│   │   │   ├── learn/          # Learning hub page
│   │   │   ├── news/           # News feed page
│   │   │   ├── pricing/        # Pricing page
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Landing page
│   │   ├── components/        # React components
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── PaywallGate.tsx
│   │   │   ├── PremiumBadge.tsx
│   │   │   ├── ResumeUploadCard.tsx
│   │   │   ├── InterviewRecorder.tsx
│   │   │   ├── PerformanceDashboard.tsx
│   │   │   └── Navigation.tsx
│   │   └── lib/               # Shared libraries
│   │       ├── auth/           # Auth utilities
│   │       ├── azure/          # Azure service clients
│   │       ├── db/             # Database repositories
│   │       ├── services/       # Business logic
│   │       └── types/          # TypeScript types
│   ├── docs/                  # Project documentation
│   ├── package.json
│   └── README.md              # Detailed setup and architecture
├── docs/                      # Additional documentation
│   ├── INTEGRATION_GUIDE.md   # Integration guide for existing websites
│   ├── COST_ANALYSIS.md       # Cost analysis and API usage
│   ├── DATABASE_SCHEMA.md     # Database schema
│   ├── FEATURES_ENHANCEMENT.md # Feature documentation
│   ├── workflow.md            # Development workflow (1-day timeline)
│   ├── SETUP.md               # Detailed setup guide
│   ├── TROUBLESHOOTING.md     # Troubleshooting guide
│   └── ...
├── .gitignore                 # Root gitignore
└── README.md                  # This file
```

## ✨ Features

### Core Interview Features
- **Resume & Essay Parsing** – PDF/DOCX parsing with Azure OpenAI structured extraction
- **Personalized Question Generation** – AI-powered questions (5 for free, 7+ for premium)
- **Video Interview Studio** – MediaRecorder-based recording with 30s prep/60s response timers
- **Written Essay Simulation** – 250-word target (500 max) with real-time validation
- **AI Evaluation Engine** – Comprehensive analysis with tone, confidence, clarity, and non-verbal cues
- **Performance Dashboard** – Interactive visualizations with Plotly.js
- **PDF Report Generation** – Downloadable coaching reports with detailed feedback

### Platform Features
- **Premium Subscriptions** – Three-tier system (Free, Premium $29.99/month, Enterprise $99.99/month)
- **Recording History** – View past interviews (last 3 for free, unlimited for premium)
- **Personalized Quizzes** – Multiple categories with difficulty levels and instant feedback
- **Learning Hub** – Curated videos, articles, podcasts, and courses
- **MBA News Feed** – Latest MBA world news categorized by topic

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Plotly.js** for visualizations
- **MediaRecorder API** for video/audio capture

### Backend
- **Next.js API Routes** (serverless)
- **TypeScript** (strict mode)
- **Azure OpenAI** (GPT-4o-mini recommended for cost optimization)
- **Azure Speech SDK** for transcription
- **Azure Blob Storage** for asset storage
- **Supabase** for user management, subscriptions, and data persistence
- **PDFKit** for PDF report generation

### AI Services
- **Azure OpenAI**: Resume parsing, question generation, evaluation
- **Azure Speech SDK**: Speech-to-text transcription, audio analysis
- **LangChain**: Prompt orchestration

### Storage & Database
- **Azure Blob Storage**: Resume, video, audio, essay assets
- **Supabase/Postgres**: Session storage, candidate reports (optional, in-memory fallback)

## 📚 Documentation

- **Main Documentation**: See `prepwise/README.md` for detailed setup, architecture, and deployment
- **Integration Guide**: See `docs/INTEGRATION_GUIDE.md` for integrating PrepWise.AI into existing websites
- **Cost Analysis**: See `docs/COST_ANALYSIS.md` for detailed cost breakdown and API usage
- **Setup Guide**: See `docs/SETUP.md` for step-by-step setup instructions
- **Workflow**: See `docs/workflow.md` for development workflow and 1-day timeline
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md` for common issues and solutions

## 🏆 Hackathon Submission

This project was developed for the **VIRTUAL MBA INTERVIEW AI HACKATHON** hosted by **HACKHOUND**. The platform demonstrates:

### ✅ Complete Feature Set
- Resume parsing with structured extraction
- Personalized question generation (tier-aware: 5 free, 7+ premium)
- Video interview recording with skip prep option
- Written essay simulation with validation
- Comprehensive evaluation engine (tone, confidence, clarity analysis)
- Performance dashboard with visualizations
- Downloadable PDF reports
- Premium subscription system (Free, Premium, Enterprise)
- Recording history and progress tracking
- Personalized quizzes and learning content
- MBA news feed

### ✅ Technical Excellence
- Production-ready code with TypeScript strict mode
- Comprehensive error handling
- Edge case management
- Graceful degradation for missing data
- Robust validation and logging
- Modern UI/UX with hackathon-winning design

### ✅ Innovation Highlights
- **Comprehensive Evaluation**: Tone, confidence, and communication clarity analysis
- **Graceful Degradation**: Handles missing data without crashing
- **Frontend State Management**: Reliable data flow without store dependencies
- **Enhanced Prompts**: Detailed evaluation frameworks for better feedback
- **Multiple Essay Support**: Support for multiple essay prompts
- **Real-time Validation**: Word count validation with color-coded feedback

### ✅ Development Speed
- **Built in**: < 24 hours
- **Features**: 8 major features fully implemented
- **Bug Fixes**: 15+ issues resolved
- **Quality**: Production-ready code
- **Documentation**: Complete documentation and setup guides

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- Azure OpenAI deployment (gpt-4o-mini recommended for cost optimization)
- Azure Blob Storage account
- Azure Speech Service
- Supabase project for user management and persistence

### Quick Deploy
1. Push to GitHub
2. Import in Vercel
3. Configure environment variables
4. Deploy

See `prepwise/README.md` and `docs/SETUP.md` for detailed deployment instructions.

## 📊 Development Timeline

- **Hour 0-1**: Discovery & Planning
- **Hour 1-2**: Architecture & Setup
- **Hours 2-4**: Resume Intake & Parsing
- **Hours 4-6**: Question Generation
- **Hours 6-10**: Interview UI & Recording
- **Hours 10-14**: Evaluation Engine
- **Hours 14-18**: Performance Dashboard & Reporting
- **Hours 18-22**: Polish & Bug Fixes
- **Hours 22-24**: Final Testing & Deployment

See `docs/workflow.md` for detailed development workflow.

## 🎯 Key Achievements

- ✅ **8 Major Features** fully implemented
- ✅ **Production-Ready** code with comprehensive error handling
- ✅ **Comprehensive Evaluation** with tone, confidence, and clarity analysis
- ✅ **Modern UI/UX** with hackathon-winning design
- ✅ **Complete Documentation** with setup and troubleshooting guides
- ✅ **Robust Error Handling** throughout the application
- ✅ **Edge Case Management** for missing data and failures
- ✅ **Type Safety** with TypeScript strict mode

## 🔧 Technical Challenges Overcome

1. **pdf-parse v2 API**: Switched to class-based API, configured webpack
2. **Azure Speech SDK**: Used `require()` for Next.js compatibility
3. **String Numbers**: Added coercion and preprocessing for rubric scores
4. **Missing Data**: Implemented graceful fallbacks for missing audio/video
5. **Store Issues**: Send data from frontend to avoid store lookup problems
6. **Color Scheme**: Fixed white-on-white text issues
7. **Evaluation Validation**: Enhanced validation and error handling

## 📄 License

This is a hackathon project. See individual file headers for license information.

## 🙏 Acknowledgments

- **HACKHOUND** for organizing the Virtual MBA Interview AI Hackathon
- **Azure OpenAI** for AI capabilities
- **Azure Speech SDK** for transcription services
- **Next.js** for the amazing framework
- **Vercel** for deployment platform

---

**Built with ❤️ by Team Arize for HACKHOUND Virtual MBA Interview AI Hackathon**

**Development Time**: < 24 hours  
**Status**: ✅ Production Ready  
**GitHub**: [https://github.com/Adit-Jain-srm/PrepWise.AI](https://github.com/Adit-Jain-srm/PrepWise.AI)
