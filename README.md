# PrepWise.AI – MBA Mock Interview Portal

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
- **YouTube Video:** [PLACEHOLDER]
- **GitHub Repository:** [https://github.com/Adit-Jain-srm/PrepWise.AI](https://github.com/Adit-Jain-srm/PrepWise.AI)

---

## 📖 About

PrepWise.AI is an Azure OpenAI-powered platform that parses a candidate's resume/essays, generates a personalized MBA interview loop, records video responses, and delivers instant AI feedback with a downloadable PDF report.

**Built in under 24 hours** for the HACKHOUND Virtual MBA Interview AI Hackathon, this project demonstrates rapid development of a production-ready AI application with comprehensive features.

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
│   │   │   │   ├── candidates/ # Resume parsing
│   │   │   │   ├── interviews/ # Interview flow APIs
│   │   │   │   └── health/    # Health check
│   │   │   ├── layout.tsx     # Root layout
│   │   │   └── page.tsx       # Main page
│   │   ├── components/        # React components
│   │   │   ├── ResumeUploadCard.tsx
│   │   │   ├── InterviewRecorder.tsx
│   │   │   ├── PerformanceDashboard.tsx
│   │   │   └── ...
│   │   └── lib/               # Shared libraries
│   │       ├── azure/         # Azure service clients
│   │       ├── db/            # Database repositories
│   │       ├── services/      # Business logic
│   │       └── types/         # TypeScript types
│   ├── docs/                  # Project documentation
│   ├── package.json
│   └── README.md              # Detailed setup and architecture
├── docs/                      # Additional documentation
│   ├── workflow.md            # Development workflow (1-day timeline)
│   ├── SETUP.md               # Detailed setup guide
│   ├── TROUBLESHOOTING.md     # Troubleshooting guide
│   ├── IMPLEMENTATION_SUMMARY.md # Implementation details
│   └── EVALUATION_VERIFICATION.md # Evaluation engine verification
├── .gitignore                 # Root gitignore
└── README.md                  # This file
```

## ✨ Features

### 1. Resume & Essay Parsing
- PDF/DOCX parsing with Azure OpenAI structured extraction
- Extracts education, experience, leadership, keywords, and summary bullets
- Optional essay prompt input (empty by default)
- Handles null values in LLM responses gracefully

### 2. Personalized Question Generation
- AI-powered interview questions tailored to candidate background
- Behavioral, situational, and school-specific questions
- Enhanced prompt engineering with detailed evaluation frameworks
- Multiple essay prompts support (1-2 prompts per session)
- 250-word target, 500-word maximum for essays

### 3. Video Interview Studio
- MediaRecorder-based interface with skip prep option
- 30s prep/60s response timers with visual countdowns
- Dual recording (video + audio) for analysis
- Edge case handling for missing audio/video
- Graceful error handling for recording failures

### 4. Written Essay Simulation
- 250-word target (500 max) essay responses with validation
- Real-time word count feedback with color-coded validation
- Multiple essay prompts support
- Word count validation (minimum: 80% of target, maximum: 500 words)

### 5. AI Evaluation Engine
- **Comprehensive Analysis**:
  - **Tone Analysis**: Vocal tone, confidence, engagement, professionalism
  - **Confidence Analysis**: Vocal authority, composure, self-assurance, presence
  - **Communication Clarity**: Structure, articulation, filler words, clarity of expression
  - **Non-Verbal Analysis**: Eye contact, presence, composure, engagement level
- Azure Speech SDK transcription with filler word detection
- Speaking rate calculation (words per minute)
- Comprehensive rubric scoring (Leadership, Communication, Clarity, Impact, Fit)

### 6. Performance Dashboard
- Interactive visualizations with Plotly.js (radar chart, bar charts)
- Question-wise analysis with detailed insights
- Strength playbook and growth opportunities
- Real-time performance metrics
- Enhanced UI with hackathon-winning design

### 7. PDF Report Generation
- Downloadable coaching reports with detailed feedback
- Includes all analysis fields (tone, confidence, clarity, non-verbal)
- Question-wise breakdown with strengths and improvements
- Professional formatting and styling
- PDFKit-based server-side generation

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
- **Azure OpenAI** (GPT-4o) for AI capabilities
- **Azure Speech SDK** for transcription
- **Azure Blob Storage** for asset storage
- **Supabase** (optional) for data persistence
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
- **Setup Guide**: See `docs/SETUP.md` for step-by-step setup instructions
- **Workflow**: See `docs/workflow.md` for development workflow and 1-day timeline
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md` for common issues and solutions
- **Implementation**: See `docs/IMPLEMENTATION_SUMMARY.md` for technical implementation details
- **Evaluation Verification**: See `docs/EVALUATION_VERIFICATION.md` for evaluation engine verification

## 🏆 Hackathon Submission

This project was developed for the **VIRTUAL MBA INTERVIEW AI HACKATHON** hosted by **HACKHOUND**. The platform demonstrates:

### ✅ Complete Feature Set
- Resume parsing with structured extraction
- Personalized question generation
- Video interview recording with skip prep option
- Written essay simulation with validation
- Comprehensive evaluation engine
- Performance dashboard with visualizations
- Downloadable PDF reports

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
- Azure OpenAI deployment (gpt-4o)
- Azure Blob Storage account
- Azure Speech Service
- (Optional) Supabase project for persistence

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
