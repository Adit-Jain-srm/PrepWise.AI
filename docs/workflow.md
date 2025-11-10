# PrepWise.AI Hackathon Workflow

## 1. Discovery & Planning (Day 0-0.5)
- Gather resume/essay samples and Azure OpenAI credentials
- Define scoring rubric (communication, leadership, clarity, confidence, content)
- Align on interview flow (question types, timers, evaluation metrics)

## 2. Architecture & Setup (Day 0.5-1)
- Frontend: Next.js 14 (App Router) deployed on Vercel, Tailwind UI kit
- Backend: Next.js API routes + LangChain orchestrations, Azure Blob Storage for uploads
- AI Services: Azure OpenAI (text + GPT-4o-mini for multimodal), Azure Speech SDK for transcription & audio sentiment, optional Form Recognizer for resume parsing
- Data: Supabase/Postgres (session storage, candidate reports)
- DevOps: GitHub repo + Vercel CI/CD, environment secrets via Vercel project settings
- Analytics & Monitoring: Vercel Analytics, Sentry (optional)

## 3. Core Feature Sprints

### Sprint 1 – Resume Intake & Parsing (Day 1-1.5)
- Implement secure file upload (PDF/DOCX) -> Azure Blob
- Extract raw text via `pdf-parse`/`mammoth`
- Apply keyword extraction & structured parsing (education, experience, leadership) with LangChain chains + prompt templates
- Store candidate profile JSON in Postgres

### Sprint 2 – Question Generation & Session Builder (Day 1.5-2)
- Prompt-engineer Azure OpenAI to output behavioral/situational/school-specific questions
- Provide admin-configurable interview templates
- Persist question sets per candidate session

### Sprint 3 – Interview UI & Recording (Day 2-3)
- Build React hooks for MediaRecorder video capture with 30s prep/60s record timers
- Stream recordings to backend (chunks) -> store in Azure Blob
- Display countdowns, question prompts, and progress tracker

### Sprint 4 – Evaluation Engine (Day 3-4)
- Generate transcripts via Azure Speech to Text
- Run feedback pipeline: verbal cues (clarity, filler words) + non-verbal (eye contact proxy via gaze estimation placeholder) using heuristics & Azure OpenAI analysis of transcript + metadata
- Score each response and overall sections

### Sprint 5 – Performance Dashboard & Reporting (Day 4-4.5)
- Build Next.js dashboard with charts (Plotly) for scores over rubric dimensions
- Render question-wise analysis and improvement tips
- Export to PDF via PDFKit (server-side)

### Sprint 6 – Polish & Deploy (Day 4.5-5)
- Responsive styling, accessibility checks
- E2E flow smoke test
- Deploy to Vercel, handoff documentation

## 4. Governance & Best Practices
- Use feature branches + PR reviews
- Add linting (`eslint`, `prettier`) and unit tests (Vitest/React Testing Library)
- Secure secrets in `.env.local` and Vercel project settings
- Log key events for audit (Interview start/end, evaluation logs)
- Write setup + run instructions in `README.md`

## 5. Stretch Goals (If Time)
- Candidate sentiment timeline visualization
- Coach chatbot for follow-up questions
- Integration with calendaring for live coach reviews
