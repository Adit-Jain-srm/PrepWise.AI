export type ResumeEducationEntry = {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  achievements?: string[];
};

export type ResumeExperienceEntry = {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  responsibilities?: string[];
  achievements?: string[];
  leadershipHighlights?: string[];
};

export type ResumeLeadershipEntry = {
  organization: string;
  role: string;
  impact: string;
  metrics?: string[];
};

export type CandidateProfile = {
  fullName?: string;
  currentRole?: string;
  totalExperienceYears?: number;
  keywords: string[];
  summaryBullets: string[];
  education: ResumeEducationEntry[];
  experience: ResumeExperienceEntry[];
  leadership: ResumeLeadershipEntry[];
  extracurriculars?: string[];
  achievements?: string[];
  essays?: CandidateEssay[];
};

export type QuestionCategory = "behavioral" | "situational" | "school-specific" | "essay";

export type InterviewQuestion = {
  id: string;
  category: QuestionCategory;
  prompt: string;
  followUps: string[];
  rubricFocus: string[];
  preparationSeconds: number;
  responseSeconds: number;
};

export type EssayPrompt = {
  id: string;
  prompt: string;
  targetWordCount: number;
};

export type InterviewSessionPlan = {
  sessionId: string;
  candidateId: string;
  questions: InterviewQuestion[];
  essayPrompt: EssayPrompt | null;
  essayPrompts?: EssayPrompt[]; // Multiple essay prompts support
};

export type ResponseEvaluation = {
  questionId: string;
  transcript: string;
  toneAnalysis?: string;
  nonVerbalAnalysis?: string;
  communicationClarity?: string;
  confidenceAnalysis?: string;
  strengths: string[];
  improvements: string[];
  scores: Record<string, number>;
};

export type EssayEvaluation = {
  essayId: string;
  prompt: string;
  content: string;
  wordCount: number;
  writingClarity?: string;
  structureAnalysis?: string;
  depthAnalysis?: string;
  strengths: string[];
  improvements: string[];
  scores: Record<string, number>;
};

export type InterviewEvaluation = {
  overallScore: number;
  rubricScores: Record<string, number>;
  responses: ResponseEvaluation[];
  essayEvaluations?: EssayEvaluation[]; // Essay evaluations (optional for backward compatibility)
};

export type PerformanceReport = {
  candidateName?: string;
  generatedAt: string;
  summary: string;
  headlineInsights: string[];
  evaluation: InterviewEvaluation;
};

export type SpeechAnalyticsSnapshot = {
  transcript: string;
  fillerWordCount: number;
  speakingRateWpm: number;
  averagePitchHz?: number;
  sentiment?: "positive" | "neutral" | "negative";
  confidence?: number;
};

export type NonVerbalSignal = {
  label: string;
  score: number;
  notes?: string;
};

export type CandidateEssay = {
  id: string;
  prompt: string;
  content: string;
};
