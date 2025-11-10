# PrepWise.AI Hackathon Workflow

> **🚀 Built in under 1 day for HACKHOUND Virtual MBA Interview AI Hackathon**

## Timeline Overview

- **Total Development Time**: < 24 hours
- **Hackathon Event**: 10th November 2025
- **Team**: Arize (Adit Jain)

## 1. Discovery & Planning (Hour 0-1)
- Gather resume/essay samples and Azure OpenAI credentials
- Define scoring rubric (communication, leadership, clarity, confidence, content, tone)
- Align on interview flow (question types, timers, evaluation metrics)
- Design essay prompts with 250-word target, 500-word maximum
- Set up Azure resources (OpenAI, Speech, Blob Storage)

## 2. Architecture & Setup (Hour 1-2)
- Frontend: Next.js 16 (App Router) deployed on Vercel, Tailwind CSS 4
- Backend: Next.js API routes + LangChain orchestrations, Azure Blob Storage for uploads
- AI Services: Azure OpenAI (GPT-4o for structured outputs), Azure Speech SDK for transcription & audio analysis
- Data: Supabase/Postgres (session storage, candidate reports) with in-memory fallback
- DevOps: GitHub repo + Vercel CI/CD, environment secrets via Vercel project settings
- Analytics & Monitoring: Vercel Analytics, comprehensive error logging

## 3. Core Feature Development (Hours 2-20)

### Phase 1 – Resume Intake & Parsing (Hours 2-4)
- Implement secure file upload (PDF/DOCX) → Azure Blob
- Extract raw text via `pdf-parse` v2 API (class-based) and `mammoth`
- Apply keyword extraction & structured parsing (education, experience, leadership) with Azure OpenAI JSON schema structured outputs
- Handle null values in LLM responses with `.nullish()` Zod schemas
- Store candidate profile JSON in Postgres or in-memory store
- Support optional essay prompt input (empty by default)

### Phase 2 – Question Generation & Session Builder (Hours 4-6)
- Prompt-engineer Azure OpenAI to output behavioral/situational/school-specific questions
- Enhanced prompt engineering with detailed evaluation frameworks
- Support multiple essay prompts (1-2 prompts per session)
- Essay prompts: 250-word target, 500-word maximum
- Use JSON mode (`response_format: { type: "json_object" }`) for reliable parsing
- Persist question sets per candidate session
- Send profile and plan from frontend to avoid store lookup issues

### Phase 3 – Interview UI & Recording (Hours 6-10)
- Build React hooks for MediaRecorder video capture with skip prep option
- 30s prep/60s record timers with visual countdowns
- Stream recordings to backend (chunks) → store in Azure Blob
- Display countdowns, question prompts, and progress tracker
- Handle edge cases: missing audio/video, empty responses
- Graceful error handling for recording failures

### Phase 4 – Evaluation Engine (Hours 10-14)
- Generate transcripts via Azure Speech SDK (using `require()` for Next.js compatibility)
- Configure `serverExternalPackages` in `next.config.ts` for CommonJS modules
- Run feedback pipeline: verbal cues (clarity, filler words, speaking rate) + non-verbal (eye contact proxy, pace control, confidence) using heuristics & Azure OpenAI analysis
- Enhanced evaluation with tone analysis, confidence analysis, and communication clarity
- Score each response and overall sections with comprehensive rubric
- Handle missing transcripts gracefully (continue evaluation with placeholder data)
- Fix string number conversion issues in rubric scores

### Phase 5 – Performance Dashboard & Reporting (Hours 14-18)
- Build Next.js dashboard with charts (Plotly) for scores over rubric dimensions
- Render question-wise analysis with tone, confidence, and clarity insights
- Strength playbook and growth opportunities sections
- Export to PDF via PDFKit (server-side) with enhanced formatting
- Downloadable coaching report with detailed feedback
- Enhanced UI with hackathon-winning design

### Phase 6 – Polish & Bug Fixes (Hours 18-22)
- Responsive styling with improved color schemes
- Fix white-on-white text issues in form inputs
- Accessibility checks and UI improvements
- E2E flow smoke test
- Edge case testing (missing audio, empty responses, server restarts)
- Fix evaluation engine validation issues
- Improve error handling throughout
- Documentation and README updates

### Phase 7 – Final Testing & Deployment (Hours 22-24)
- Comprehensive testing of all features
- Fix remaining edge cases
- Deploy to Vercel
- Verify all Azure services are working
- Test PDF report generation
- Final UI polish
- Documentation completion

## 4. Governance & Best Practices
- Use feature branches + PR reviews
- Add linting (`eslint`) and type checking (TypeScript strict mode)
- Secure secrets in `.env.local` and Vercel project settings
- Log key events for audit (Interview start/end, evaluation logs)
- Write setup + run instructions in `README.md`
- Comprehensive error handling in all API routes
- Type safety throughout the codebase

## 5. Stretch Goals (Future Enhancements)
- Candidate sentiment timeline visualization
- Coach chatbot for follow-up questions
- Integration with calendaring for live coach reviews
- Advanced eye contact estimation via WebRTC face landmarks

## 6. Implementation Status

### ✅ Completed Features (All implemented in < 24 hours)
- **Resume Parser**: PDF/DOCX parsing with Azure OpenAI structured extraction
  - Fixed pdf-parse v2 API integration (class-based)
  - Handle null values in LLM responses
  - Optional essay prompt input (empty by default)
- **Question Generator**: LangChain + Azure OpenAI for personalized interview questions
  - Enhanced prompt engineering
  - Multiple essay prompts support (1-2 per session)
  - 250-word target, 500-word maximum for essays
  - JSON mode for reliable parsing
- **Video Interview Interface**: MediaRecorder API with skip prep option
  - 30s prep/60s response timers
  - Edge case handling for missing audio/video
  - Graceful error handling
- **Essay Response**: 250-word target (500 max) written simulation with word count validation
  - Multiple essay prompts support
  - Real-time word count feedback
  - Color-coded validation (under min, within range, over max)
- **Speech Transcription**: Azure Speech SDK integration with filler word detection
  - Fixed SDK import using `require()` for Next.js compatibility
  - Configured `serverExternalPackages` in `next.config.ts`
  - Handle missing audio gracefully
  - Edge case handling for empty buffers
- **Evaluation Engine**: AI-powered scoring with comprehensive feedback
  - Enhanced evaluation: tone analysis, confidence analysis, communication clarity
  - Non-verbal cue analysis (eye contact, pace, confidence)
  - Handle missing transcripts gracefully
  - Send profile and plan from frontend to avoid store issues
  - Fixed string number conversion in rubric scores
- **Performance Dashboard**: Plotly visualizations (radar chart, bar charts)
  - Question-wise analysis with detailed insights
  - Strength playbook and growth opportunities
  - Enhanced UI with improved color schemes
  - Non-verbal analysis display
  - Transcript preview
- **PDF Report Generation**: PDFKit-based exportable reports
  - Enhanced formatting with tone, confidence, and clarity analysis
  - Downloadable coaching report
  - All analysis fields included
- **Storage Integration**: Azure Blob Storage for assets
- **Database**: Supabase/Postgres with in-memory fallback
- **UI Improvements**: Fixed color scheme issues, improved accessibility

### 🔧 Technical Implementation Details
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API routes with TypeScript
- **AI Services**: 
  - Azure OpenAI (GPT-4o) with JSON schema structured outputs
  - Azure Speech SDK for transcription (CommonJS compatibility)
  - LangChain for prompt orchestration
- **Storage**: Azure Blob Storage for resume, video, audio, essay assets
- **Database**: Supabase (optional, falls back to in-memory storage)
- **Visualization**: Plotly.js for performance charts
- **PDF Generation**: PDFKit for report exports
- **Module Compatibility**: Configured `serverExternalPackages` for CommonJS modules (pdf-parse, Azure Speech SDK)

### 🐛 Known Issues & Fixes Applied
- ✅ Fixed Azure Speech SDK import (using `require()` for Next.js compatibility)
- ✅ Configured `serverExternalPackages` in `next.config.ts` for CommonJS modules
- ✅ Fixed pdf-parse v2 API integration (class-based API)
- ✅ Fixed Zod schema validation (using `.nullish()` for null values)
- ✅ Fixed InterviewRecorder response collection (using refs for synchronous state)
- ✅ Enhanced Azure Speech SDK error handling
- ✅ Added TypeScript type definitions for PDFKit
- ✅ Enhanced speech transcription confidence extraction
- ✅ Improved error handling in evaluation pipeline
- ✅ Fixed edge cases: missing audio/video, empty responses, server restarts
- ✅ Fixed color scheme issues (white-on-white text)
- ✅ Fixed empty essay prompt auto-fill issue
- ✅ Improved profile and plan data flow (send from frontend)
- ✅ Enhanced evaluation engine with tone, confidence, and clarity analysis
- ✅ Improved prompt engineering for better question generation
- ✅ Fixed string number conversion in rubric scores
- ✅ Added validation for missing analysis fields
- ✅ Enhanced performance dashboard with non-verbal analysis

### 📝 Setup Requirements
1. Azure OpenAI deployment (gpt-4o) with JSON schema support
2. Azure Blob Storage account
3. Azure Speech Service
4. (Optional) Supabase project for persistence
5. Node.js 18+ and npm
6. Next.js 16 with App Router

### 🚀 Deployment Notes
- Vercel deployment ready
- Environment variables configured via Vercel project settings
- API routes use `force-dynamic` for Node.js runtime
- PDF generation requires Node.js runtime (not Edge)
- Azure Blob container must be created before deployment
- CommonJS modules (pdf-parse, Azure Speech SDK) handled via `serverExternalPackages`

### 🎨 UI/UX Improvements
- Fixed color scheme issues (form inputs now have proper text colors)
- Improved accessibility with better contrast ratios
- Enhanced visual hierarchy with gradients and shadows
- Skip prep option in interview recorder
- Real-time word count feedback for essays
- Color-coded validation for essay word counts
- Hackathon-winning UI design

## 7. Development Approach

### Rapid Prototyping Strategy
- **Parallel Development**: Frontend and backend developed simultaneously
- **Incremental Testing**: Test each feature as it's built
- **Quick Iterations**: Fast feedback loops for prompt engineering
- **Error Handling First**: Robust error handling from the start
- **Type Safety**: TypeScript strict mode to catch errors early

### Key Decisions
- **In-Memory Fallback**: Use in-memory storage as fallback for faster development
- **Frontend State**: Send profile and plan from frontend to avoid store issues
- **JSON Mode**: Use JSON mode for reliable LLM responses
- **CommonJS Compatibility**: Configure Next.js for CommonJS modules
- **Graceful Degradation**: Handle missing data gracefully

### Challenges Overcome
1. **pdf-parse v2 API**: Switched to class-based API, configured webpack
2. **Azure Speech SDK**: Used `require()` for Next.js compatibility
3. **String Numbers**: Added coercion and preprocessing for rubric scores
4. **Missing Data**: Implemented graceful fallbacks for missing audio/video
5. **Store Issues**: Send data from frontend to avoid store lookup problems
6. **Color Scheme**: Fixed white-on-white text issues
7. **Evaluation Validation**: Enhanced validation and error handling

## 8. Recent Enhancements

### Prompt Engineering Improvements
- Enhanced system prompts for question generation with detailed evaluation frameworks
- Improved essay prompt generation with 250-word target, 500-word maximum
- Better personalization based on candidate background
- Required fields for tone, confidence, and communication clarity analysis

### Evaluation Engine Enhancements
- Added tone analysis for vocal characteristics
- Added confidence analysis for presence assessment
- Added communication clarity analysis
- Enhanced non-verbal cue analysis
- Improved feedback quality with specific, actionable insights
- Validation and logging for missing analysis fields
- Fallback messages for missing data

### Edge Case Handling
- Handle missing audio/video gracefully
- Continue evaluation with placeholder data if transcription fails
- Send profile and plan from frontend to avoid store lookup issues
- Handle server restarts without losing data (frontend state persistence)
- Empty essay prompt field (not auto-filled)
- Graceful error handling throughout the application
- Validate evaluation response structure
- Handle string number conversion in rubric scores

## 9. Performance Metrics

### Development Speed
- **Total Time**: < 24 hours
- **Features Completed**: 8 major features
- **Bug Fixes**: 15+ issues resolved
- **Code Quality**: TypeScript strict mode, comprehensive error handling
- **Documentation**: Complete setup, troubleshooting, and implementation guides

### Feature Completeness
- ✅ Resume parsing with structured extraction
- ✅ Personalized question generation
- ✅ Video interview recording
- ✅ Essay response handling
- ✅ Speech transcription
- ✅ Comprehensive evaluation engine
- ✅ Performance dashboard
- ✅ PDF report generation

## 10. Lessons Learned

### What Worked Well
- **TypeScript**: Caught many errors early
- **Incremental Testing**: Found issues quickly
- **Error Handling**: Robust error handling prevented crashes
- **Frontend State**: Sending data from frontend avoided store issues
- **JSON Mode**: Reliable LLM responses
- **CommonJS Configuration**: Proper Next.js configuration for external packages

### Areas for Improvement
- **Testing**: More comprehensive unit tests
- **Documentation**: Earlier documentation during development
- **Error Messages**: More user-friendly error messages
- **Performance**: Optimize LLM calls for faster responses
- **Caching**: Implement caching for frequently accessed data

## 11. Hackathon Highlights

### Achievement Summary
- **Built in**: < 24 hours
- **Features**: 8 major features fully implemented
- **Technologies**: Next.js 16, React 19, Azure OpenAI, Azure Speech SDK, Plotly.js, PDFKit
- **Quality**: Production-ready code with comprehensive error handling
- **Documentation**: Complete documentation and setup guides
- **UI/UX**: Hackathon-winning design with modern, polished interface

### Key Innovations
- **Comprehensive Evaluation**: Tone, confidence, and communication clarity analysis
- **Graceful Degradation**: Handles missing data without crashing
- **Frontend State Management**: Reliable data flow without store dependencies
- **Enhanced Prompts**: Detailed evaluation frameworks for better feedback
- **Multiple Essay Support**: Support for multiple essay prompts
- **Real-time Validation**: Word count validation with color-coded feedback

### Technical Excellence
- **Type Safety**: TypeScript strict mode throughout
- **Error Handling**: Comprehensive error handling in all API routes
- **Module Compatibility**: Proper handling of CommonJS modules in Next.js
- **Validation**: Robust validation with Zod schemas
- **Edge Cases**: Handles missing data, empty responses, server restarts
- **Performance**: Efficient Azure OpenAI usage with JSON mode

---

**Built with ❤️ by Team Arize for HACKHOUND Virtual MBA Interview AI Hackathon**
