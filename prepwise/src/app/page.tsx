"use client";

import { useMemo, useState } from "react";
import {
  CandidateProfile,
  InterviewEvaluation,
  InterviewSessionPlan,
  NonVerbalSignal,
  SpeechAnalyticsSnapshot,
} from "@/lib/types/interview";
import { ResumeUploadCard } from "@/components/ResumeUploadCard";
import { CandidateSummaryCard } from "@/components/CandidateSummaryCard";
import { QuestionPlanCard } from "@/components/QuestionPlanCard";
import { EssayResponseCard } from "@/components/EssayResponseCard";
import { InterviewRecorder, RecordedResponse } from "@/components/InterviewRecorder";
import { PerformanceDashboard } from "@/components/PerformanceDashboard";

type Step = "upload" | "plan" | "interview" | "report";

type UploadResponse = {
  candidateId: string;
  profile: CandidateProfile;
};

type TranscriptionResponse = SpeechAnalyticsSnapshot;

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [sessionPlan, setSessionPlan] = useState<InterviewSessionPlan | null>(null);
  const [essayResponse, setEssayResponse] = useState("");
  const [essayLocked, setEssayLocked] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showEssayCard = Boolean(sessionPlan?.essayPrompt);

  const handleUploadComplete = (payload: UploadResponse) => {
    setCandidateId(payload.candidateId);
    setProfile(payload.profile);
    setSessionPlan(null);
    setEvaluation(null);
    setStep("plan");
    setError(null);
  };

  const handleGeneratePlan = async () => {
    if (!candidateId) {
      setError("Please upload a resume first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interviews/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });

      if (!response.ok) {
        throw new Error((await response.json())?.error ?? "Failed to generate plan.");
      }

      const plan = (await response.json()) as InterviewSessionPlan;
      setSessionPlan(plan);
      setEssayResponse("");
      setEssayLocked(false);
    } catch (generateError) {
      console.error(generateError);
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate interview plan.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEssayLock = async () => {
    if (!sessionPlan || !essayResponse.trim()) {
      return;
    }

    setEssayLocked(true);

    try {
      const blob = new Blob([essayResponse.trim()], { type: "text/plain" });
      const file = new File([blob], "essay.txt", { type: "text/plain" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionPlan.sessionId);
      formData.append("assetType", "essay");

      await fetch("/api/interviews/assets", {
        method: "POST",
        body: formData,
      });
    } catch (uploadError) {
      console.warn("Essay upload failed", uploadError);
    }
  };

  const uploadInterviewAsset = async (
    sessionId: string,
    blob: Blob,
    assetType: "video" | "audio",
    questionId: string,
  ) => {
    const filename = `${questionId}-${assetType}.${blob.type.split("/").pop() ?? "webm"}`;
    const file = new File([blob], filename, { type: blob.type });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    formData.append("assetType", assetType);
    formData.append("questionId", questionId);

    try {
      const response = await fetch("/api/interviews/assets", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Asset upload failed");
      }
    } catch (assetError) {
      console.warn(`Failed to upload ${assetType} for ${questionId}`, assetError);
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<TranscriptionResponse> => {
    const file = new File([audioBlob], "response.webm", { type: audioBlob.type });
    const formData = new FormData();
    formData.append("audio", file);

    const response = await fetch("/api/interviews/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error((await response.json())?.error ?? "Transcription failed.");
    }

    return (await response.json()) as TranscriptionResponse;
  };

  const buildNonVerbalSignals = (
    metadata: RecordedResponse["metadata"],
    speech: SpeechAnalyticsSnapshot,
  ): NonVerbalSignal[] => {
    const eyeContactScore = Number((10 - Math.min(9, metadata.tabAwayRatio * 10)).toFixed(1));
    const paceIdeal = 145;
    const speakingRate = speech.speakingRateWpm || paceIdeal;
    const paceScore = Number(
      (10 - Math.min(9, Math.abs(speakingRate - paceIdeal) / 10)).toFixed(1),
    );
    const fillerScore = Number(
      (10 - Math.min(9, speech.fillerWordCount * 1.5)).toFixed(1),
    );

    return [
      {
        label: "Eye Contact",
        score: parseFloat(eyeContactScore.toFixed(1)),
        notes: `Tab away ${Math.round(metadata.tabAwayRatio * 100)}% of the time`,
      },
      {
        label: "Pace Control",
        score: parseFloat(paceScore.toFixed(1)),
        notes: `${Math.round(speakingRate)} words per minute`,
      },
      {
        label: "Verbal Confidence",
        score: parseFloat(fillerScore.toFixed(1)),
        notes: `${speech.fillerWordCount} filler words detected`,
      },
    ];
  };

  const handleInterviewComplete = async (responses: RecordedResponse[]) => {
    if (!sessionPlan || !candidateId || !profile) {
      return;
    }

    setStep("interview");
    setLoading(true);
    setError(null);

    try {
      const analytics: SpeechAnalyticsSnapshot[] = [];

      for (const response of responses) {
        await uploadInterviewAsset(
          sessionPlan.sessionId,
          response.videoBlob,
          "video",
          response.question.id,
        );
        await uploadInterviewAsset(
          sessionPlan.sessionId,
          response.audioBlob,
          "audio",
          response.question.id,
        );

        const transcription = await transcribeAudio(response.audioBlob);
        analytics.push(transcription);
      }

      const evaluatePayload = {
        sessionId: sessionPlan.sessionId,
        candidateId,
        responses: responses.map((response, index) => ({
          questionId: response.question.id,
          speech: analytics[index],
          nonVerbalSignals: buildNonVerbalSignals(response.metadata, analytics[index]),
        })),
      };

      const evaluationResponse = await fetch("/api/interviews/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluatePayload),
      });

      if (!evaluationResponse.ok) {
        throw new Error((await evaluationResponse.json())?.error ?? "Evaluation failed");
      }

      const evaluationData = (await evaluationResponse.json()) as InterviewEvaluation;
      setEvaluation(evaluationData);
      setStep("report");
    } catch (evaluationError) {
      console.error(evaluationError);
      setError(
        evaluationError instanceof Error
          ? evaluationError.message
          : "Could not evaluate responses.",
      );
    } finally {
      setLoading(false);
    }
  };

  const heroDescription = useMemo(() => {
    if (step === "upload") {
      return "PrepWise.AI reverse-engineers top MBA interview rubrics and personalizes drills from your resume and essays.";
    }
    if (step === "plan") {
      return "Profile parsed. Generate your high-signal interview set when ready.";
    }
    if (step === "interview") {
      return "Lights on. Stay composed and narrate impact — we handle timers and scoring.";
    }
    return "Review strengths, gaps, and question-wise insights. Download the report for your coach.";
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">PrepWise.AI</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">{heroDescription}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            Azure OpenAI + LangChain + Azure Speech
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {step === "upload" && <ResumeUploadCard onUploaded={handleUploadComplete} />}

        {step !== "upload" && profile && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <CandidateSummaryCard profile={profile} />
            <div className="flex flex-col gap-6">
              {!sessionPlan && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Generate Your Mock Interview Plan
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    We tailor questions across leadership, execution, and school fit dimensions.
                  </p>
                  <button
                    type="button"
                    onClick={handleGeneratePlan}
                    disabled={loading}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                  >
                    {loading ? "Designing Interview..." : "Generate Interview"}
                  </button>
                </section>
              )}

              {showEssayCard && sessionPlan?.essayPrompt && (
                <EssayResponseCard
                  prompt={sessionPlan.essayPrompt}
                  value={essayResponse}
                  onChange={setEssayResponse}
                  onLockIn={handleEssayLock}
                  disabled={essayLocked || loading}
                />
              )}
            </div>
          </div>
        )}

        {sessionPlan && step !== "interview" && step !== "report" && (
          <QuestionPlanCard
            questions={sessionPlan.questions}
            essayPrompt={sessionPlan.essayPrompt}
            onStartInterview={() => setStep("interview")}
            disabled={loading}
          />
        )}

        {sessionPlan && step === "interview" && (
          <InterviewRecorder questions={sessionPlan.questions} onComplete={handleInterviewComplete} />
        )}

        {evaluation && step === "report" && sessionPlan && candidateId && (
          <PerformanceDashboard
            evaluation={evaluation}
            sessionId={sessionPlan.sessionId}
            candidateId={candidateId}
          />
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
            Processing with Azure services…
          </div>
        )}
      </main>
    </div>
  );
}
