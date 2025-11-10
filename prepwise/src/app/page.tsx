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
  const [essayResponses, setEssayResponses] = useState<Record<string, string>>({});
  const [essayLocked, setEssayLocked] = useState(false);
  const [lockedEssays, setLockedEssays] = useState<Set<string>>(new Set());
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
    if (!candidateId || !profile) {
      setError("Please upload a resume first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send both candidateId and profile to ensure the API has the data
      // This avoids issues with in-memory store being lost on server restart
      const response = await fetch("/api/interviews/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, profile }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error ?? "Failed to generate plan.");
      }

      const plan = (await response.json()) as InterviewSessionPlan;
      setSessionPlan(plan);
      setEssayResponse("");
      setEssayResponses({});
      setEssayLocked(false);
      setLockedEssays(new Set());
    } catch (generateError) {
      console.error("Failed to generate plan:", generateError);
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate interview plan.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEssayLock = async (essayId?: string) => {
    if (!sessionPlan) {
      return;
    }

    // Handle single essay (backward compatibility)
    if (sessionPlan.essayPrompt && !essayId) {
      if (!essayResponse.trim()) {
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
      return;
    }

    // Handle multiple essays
    if (essayId && sessionPlan.essayPrompts) {
      const essayText = essayResponses[essayId];
      if (!essayText || !essayText.trim()) {
        return;
      }
      setLockedEssays((prev) => new Set(prev).add(essayId));
      try {
        const blob = new Blob([essayText.trim()], { type: "text/plain" });
        const file = new File([blob], `essay-${essayId}.txt`, { type: "text/plain" });
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
      setError("Missing required data. Please ensure you have uploaded a resume and generated an interview plan.");
      return;
    }

    // Handle edge case: no responses recorded
    if (!responses || responses.length === 0) {
      setError("No interview responses recorded. Please record at least one response before completing the interview.");
      return;
    }

    setStep("interview");
    setLoading(true);
    setError(null);

    try {
      const analytics: SpeechAnalyticsSnapshot[] = [];

      for (const response of responses) {
        // Upload assets (don't fail if upload fails - these are optional)
        try {
          if (response.videoBlob && response.videoBlob.size > 0) {
            await uploadInterviewAsset(
              sessionPlan.sessionId,
              response.videoBlob,
              "video",
              response.question.id,
            );
          }
        } catch (videoError) {
          console.warn(`Failed to upload video for ${response.question.id}:`, videoError);
        }

        try {
          if (response.audioBlob && response.audioBlob.size > 0) {
            await uploadInterviewAsset(
              sessionPlan.sessionId,
              response.audioBlob,
              "audio",
              response.question.id,
            );
          }
        } catch (audioError) {
          console.warn(`Failed to upload audio for ${response.question.id}:`, audioError);
        }

        // Transcribe audio (handle empty or missing audio gracefully)
        try {
          if (response.audioBlob && response.audioBlob.size > 0) {
            const transcription = await transcribeAudio(response.audioBlob);
            analytics.push(transcription);
          } else {
            // No audio provided - create empty analytics
            console.warn(`No audio blob for question ${response.question.id}`);
            analytics.push({
              transcript: "[No audio recorded]",
              fillerWordCount: 0,
              speakingRateWpm: 0,
              confidence: undefined,
            });
          }
        } catch (transcriptionError) {
          console.warn(`Failed to transcribe audio for ${response.question.id}:`, transcriptionError);
          // Continue with empty transcript
          analytics.push({
            transcript: `[Transcription failed: ${transcriptionError instanceof Error ? transcriptionError.message : "Unknown error"}]`,
            fillerWordCount: 0,
            speakingRateWpm: 0,
            confidence: undefined,
          });
        }
      }

      // Ensure we have analytics for all responses
      if (analytics.length !== responses.length) {
        console.warn(`Analytics count (${analytics.length}) doesn't match responses count (${responses.length})`);
        // Pad analytics if needed
        while (analytics.length < responses.length) {
          analytics.push({
            transcript: "[No audio recorded]",
            fillerWordCount: 0,
            speakingRateWpm: 0,
            confidence: undefined,
          });
        }
      }

      // Collect essay responses for evaluation
      const essayPayloads: Array<{ essayId: string; content: string }> = [];
      
      // Handle single essay (backward compatibility)
      if (sessionPlan.essayPrompt && essayResponse.trim() && essayLocked) {
        essayPayloads.push({
          essayId: sessionPlan.essayPrompt.id,
          content: essayResponse.trim(),
        });
      }
      
      // Handle multiple essays from essayResponses state
      if (sessionPlan.essayPrompts && sessionPlan.essayPrompts.length > 0) {
        for (const essayPrompt of sessionPlan.essayPrompts) {
          if (lockedEssays.has(essayPrompt.id)) {
            // essayResponses is a Record<string, string> state variable
            const essayText = essayResponses[essayPrompt.id];
            if (essayText && essayText.trim()) {
              // Check if we already added this essay
              if (!essayPayloads.find((e) => e.essayId === essayPrompt.id)) {
                essayPayloads.push({
                  essayId: essayPrompt.id,
                  content: essayText.trim(),
                });
              }
            }
          }
        }
      }

      // Send plan and profile from frontend state to avoid store lookup issues
      const evaluatePayload = {
        sessionId: sessionPlan.sessionId,
        candidateId,
        plan: sessionPlan, // Send plan from frontend state (more reliable)
        profile: profile, // Send profile from frontend state (more reliable)
        responses: responses.map((response, index) => {
          const speechAnalytics = analytics[index] || {
            transcript: "[No audio recorded]",
            fillerWordCount: 0,
            speakingRateWpm: 0,
            confidence: undefined,
          };
          
          return {
            questionId: response.question.id,
            speech: speechAnalytics,
            nonVerbalSignals: buildNonVerbalSignals(response.metadata, speechAnalytics),
          };
        }),
        essays: essayPayloads.length > 0 ? essayPayloads : undefined, // Include essays for evaluation
      };
      
      console.log(`Including ${essayPayloads.length} essays for evaluation`);

      console.log(`Sending evaluation request for sessionId: ${sessionPlan.sessionId}, ${responses.length} responses`);

      const evaluationResponse = await fetch("/api/interviews/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluatePayload),
      });

      if (!evaluationResponse.ok) {
        // Try to parse error response, but handle cases where it's not JSON
        let errorMessage = "Evaluation failed";
        try {
          const errorData = await evaluationResponse.json();
          errorMessage = errorData?.error ?? errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use status text
          errorMessage = `${evaluationResponse.status} ${evaluationResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const evaluationData = (await evaluationResponse.json()) as InterviewEvaluation;
      
      // Validate evaluation data structure
      if (!evaluationData || !evaluationData.responses || !Array.isArray(evaluationData.responses)) {
        throw new Error("Invalid evaluation response: missing responses array");
      }
      
      if (!evaluationData.rubricScores || typeof evaluationData.rubricScores !== "object") {
        console.warn("Evaluation response missing rubricScores, using empty object");
        evaluationData.rubricScores = {};
      }
      
      if (typeof evaluationData.overallScore !== "number") {
        console.warn("Evaluation response missing overallScore, calculating from rubric scores");
        const scores = Object.values(evaluationData.rubricScores);
        evaluationData.overallScore = scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              PrepWise.AI
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-700 leading-relaxed">{heroDescription}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-2.5 text-xs font-medium text-slate-700 shadow-sm">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Powered by</span> Azure OpenAI + LangChain + Azure Speech
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

        {step !== "upload" && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {profile ? (
              <CandidateSummaryCard profile={profile} />
            ) : (
              <section className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-amber-900">
                  Profile Not Loaded
                </h3>
                <p className="mt-2 text-sm text-amber-700">
                  Please upload a resume to continue. Your profile information is required to generate personalized interview questions.
                </p>
              </section>
            )}
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
                    disabled={loading || !profile || !candidateId}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                  >
                    {loading ? "Designing Interview..." : "Generate Interview"}
                  </button>
                  {(!profile || !candidateId) && (
                    <p className="mt-2 text-xs text-amber-600">
                      Please upload a resume first to generate your interview plan.
                    </p>
                  )}
                </section>
              )}

              {showEssayCard && sessionPlan?.essayPrompt && (
                <EssayResponseCard
                  prompt={sessionPlan.essayPrompt}
                  value={essayResponse}
                  onChange={setEssayResponse}
                  onLockIn={() => handleEssayLock()}
                  disabled={essayLocked || loading}
                />
              )}
              {sessionPlan?.essayPrompts && sessionPlan.essayPrompts.length > 1 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Written Essays ({sessionPlan.essayPrompts.length} questions)
                  </p>
                  {sessionPlan.essayPrompts.map((essayPrompt) => (
                    <EssayResponseCard
                      key={essayPrompt.id}
                      prompt={essayPrompt}
                      value={essayResponses[essayPrompt.id] || ""}
                      onChange={(value) =>
                        setEssayResponses((prev) => ({ ...prev, [essayPrompt.id]: value }))
                      }
                      onLockIn={() => handleEssayLock(essayPrompt.id)}
                      disabled={lockedEssays.has(essayPrompt.id) || loading}
                    />
                  ))}
                </div>
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
            profile={profile ?? undefined}
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
