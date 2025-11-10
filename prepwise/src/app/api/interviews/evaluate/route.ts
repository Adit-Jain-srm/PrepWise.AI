import { NextRequest, NextResponse } from "next/server";
import {
  loadCandidateProfile,
  loadInterviewSessionPlan,
  saveInterviewEvaluation,
  saveInterviewSessionPlan,
  saveCandidateProfile,
} from "@/lib/db/interviewRepository";
import {
  compileInterviewEvaluation,
  ResponseEvaluationInput,
} from "@/lib/services/evaluationEngine";
import {
  evaluateEssays,
  EssayEvaluationInput,
} from "@/lib/services/essayEvaluator";
import {
  NonVerbalSignal,
  SpeechAnalyticsSnapshot,
  InterviewSessionPlan,
  CandidateProfile,
  EssayPrompt,
  InterviewEvaluation,
  EssayEvaluation,
} from "@/lib/types/interview";

type ResponsePayload = {
  questionId: string;
  speech: SpeechAnalyticsSnapshot;
  nonVerbalSignals?: NonVerbalSignal[];
};

type EssayPayload = {
  essayId: string;
  content: string;
};

type EvaluateRequestBody = {
  sessionId: string;
  candidateId: string;
  responses: ResponsePayload[];
  essays?: EssayPayload[]; // Optional: essay responses to evaluate
  plan?: InterviewSessionPlan; // Optional: send plan from frontend if available
  profile?: CandidateProfile; // Optional: send profile from frontend if available
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EvaluateRequestBody;

    // Validate request
    if (!body.sessionId || !body.candidateId) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId and candidateId are required." },
        { status: 400 },
      );
    }

    if (!body.responses || !Array.isArray(body.responses) || body.responses.length === 0) {
      return NextResponse.json(
        { error: "No responses provided for evaluation. Please record at least one response." },
        { status: 400 },
      );
    }

    console.log(`Loading evaluation data for sessionId: ${body.sessionId}, candidateId: ${body.candidateId}`);

    // Prefer plan and profile from request body (more reliable), fallback to loading from store
    let plan: InterviewSessionPlan | null = body.plan ?? null;
    let profile: CandidateProfile | null = body.profile ?? null;

    // Load from store if not provided in request
    if (!plan) {
      console.log(`Loading plan from store for sessionId: ${body.sessionId}`);
      plan = await loadInterviewSessionPlan(body.sessionId);
    } else {
      console.log("Using plan from request body");
    }

    if (!profile) {
      console.log(`Loading profile from store for candidateId: ${body.candidateId}`);
      profile = await loadCandidateProfile(body.candidateId);
    } else {
      console.log("Using profile from request body");
    }

    if (!plan) {
      console.error(`Interview session plan not found for sessionId: ${body.sessionId}`);
      return NextResponse.json(
        { error: "Interview session plan not found. Please generate an interview plan first, then complete the interview." },
        { status: 404 },
      );
    }

    if (!profile) {
      console.error(`Candidate profile not found for candidateId: ${body.candidateId}`);
      return NextResponse.json(
        { error: "Candidate profile not found. Please upload a resume first." },
        { status: 404 },
      );
    }

    // Save plan and profile to store for future use (if provided in request)
    if (body.plan) {
      try {
        await saveInterviewSessionPlan(body.plan);
        console.log("Saved session plan to store");
      } catch (saveError) {
        console.warn("Failed to save session plan to store, continuing anyway:", saveError);
      }
    }

    if (body.profile && body.candidateId) {
      try {
        await saveCandidateProfile(body.candidateId, body.profile);
        console.log("Saved candidate profile to store");
      } catch (saveError) {
        console.warn("Failed to save candidate profile to store, continuing anyway:", saveError);
      }
    }

    // Validate plan structure
    if (!plan.questions || !Array.isArray(plan.questions) || plan.questions.length === 0) {
      console.error(`Invalid plan structure: questions is missing or empty for sessionId: ${body.sessionId}`);
      return NextResponse.json(
        { error: "Interview session plan is invalid: no questions found. Please generate a new interview plan." },
        { status: 400 },
      );
    }

    console.log(`Found plan with ${plan.questions.length} questions and profile for candidate`);

    // Build evaluation inputs
    const inputs: ResponseEvaluationInput[] = [];
    const missingQuestions: string[] = [];

    for (const payload of body.responses) {
      if (!payload.questionId) {
        console.warn("Response payload missing questionId, skipping");
        continue;
      }

      const question = plan.questions.find((item) => item.id === payload.questionId);

      if (!question) {
        console.warn(`Question not found for id: ${payload.questionId}`);
        missingQuestions.push(payload.questionId);
        continue; // Skip this response but continue with others
      }

      // Ensure speech data exists (handle missing/empty transcripts)
      const speech: SpeechAnalyticsSnapshot = payload.speech || {
        transcript: "[No transcript available]",
        fillerWordCount: 0,
        speakingRateWpm: 0,
        confidence: undefined,
      };

      inputs.push({
        sessionId: body.sessionId,
        question,
        profile,
        speech,
        nonVerbalSignals: payload.nonVerbalSignals || [],
      });
    }

    if (inputs.length === 0) {
      return NextResponse.json(
        { error: "No valid responses found for evaluation. Please ensure all responses correspond to questions in the interview plan." },
        { status: 400 },
      );
    }

    if (missingQuestions.length > 0) {
      console.warn(`Some questions were not found: ${missingQuestions.join(", ")}. Proceeding with ${inputs.length} valid responses.`);
    }

    console.log(`Evaluating ${inputs.length} video interview responses...`);

    // Evaluate video interview responses
    const evaluation = await compileInterviewEvaluation(inputs);

    // Evaluate essays if provided
    let essayEvaluations: EssayEvaluation[] | undefined = undefined;
    if (body.essays && Array.isArray(body.essays) && body.essays.length > 0 && plan) {
      console.log(`Evaluating ${body.essays.length} essay responses...`);
      
      // Get essay prompts from plan
      const essayPrompts: EssayPrompt[] = [];
      if (plan.essayPrompts && plan.essayPrompts.length > 0) {
        essayPrompts.push(...plan.essayPrompts);
      } else if (plan.essayPrompt) {
        essayPrompts.push(plan.essayPrompt);
      }

      // Build essay evaluation inputs
      const essayInputs: EssayEvaluationInput[] = [];
      for (const essayPayload of body.essays) {
        if (!essayPayload.essayId || !essayPayload.content) {
          console.warn("Essay payload missing essayId or content, skipping");
          continue;
        }

        const essayPrompt = essayPrompts.find((ep) => ep.id === essayPayload.essayId);
        if (!essayPrompt) {
          console.warn(`Essay prompt not found for id: ${essayPayload.essayId}`);
          continue;
        }

        essayInputs.push({
          sessionId: body.sessionId,
          essayPrompt,
          essayContent: essayPayload.content,
          profile,
        });
      }

      if (essayInputs.length > 0) {
        essayEvaluations = await evaluateEssays(essayInputs);
        console.log(`Successfully evaluated ${essayEvaluations.length} essays`);
        
        // Merge essay scores into overall evaluation
        // Add essay scores to rubric accumulator
        const rubricAccumulator = new Map<string, number[]>();
        
        // Add video response scores
        evaluation.responses.forEach((response) => {
          if (response.scores && typeof response.scores === "object") {
            Object.entries(response.scores).forEach(([dimension, score]) => {
              if (typeof score === "number" && !isNaN(score)) {
                if (!rubricAccumulator.has(dimension)) {
                  rubricAccumulator.set(dimension, []);
                }
                rubricAccumulator.get(dimension)?.push(score);
              }
            });
          }
        });
        
        // Add essay scores (map essay dimensions to interview dimensions)
        essayEvaluations.forEach((essayEval) => {
          if (essayEval.scores && typeof essayEval.scores === "object") {
            Object.entries(essayEval.scores).forEach(([dimension, score]) => {
              if (typeof score === "number" && !isNaN(score)) {
                // Map essay dimensions to interview dimensions
                let mappedDimension = dimension;
                if (dimension === "Writing Quality" || dimension === "Clarity") {
                  mappedDimension = "Communication";
                } else if (dimension === "Structure") {
                  mappedDimension = "Clarity";
                } else if (dimension === "Depth") {
                  mappedDimension = "Impact";
                } else if (dimension === "Impact") {
                  mappedDimension = "Impact";
                }
                
                if (!rubricAccumulator.has(mappedDimension)) {
                  rubricAccumulator.set(mappedDimension, []);
                }
                rubricAccumulator.get(mappedDimension)?.push(score);
              }
            });
          }
        });
        
        // Recalculate overall scores including essays
        const combinedRubricScores: Record<string, number> = {};
        rubricAccumulator.forEach((scores, dimension) => {
          const aggregate = scores.reduce((sum, current) => sum + current, 0) / Math.max(scores.length, 1);
          combinedRubricScores[dimension] = Number(aggregate.toFixed(2));
        });
        
        const overallScoreValues = Object.values(combinedRubricScores);
        const combinedOverallScore = overallScoreValues.length > 0
          ? Number((overallScoreValues.reduce((sum, current) => sum + current, 0) / overallScoreValues.length).toFixed(2))
          : evaluation.overallScore;
        
        // Update evaluation with combined scores
        evaluation.overallScore = combinedOverallScore;
        evaluation.rubricScores = { ...evaluation.rubricScores, ...combinedRubricScores };
      }
    }

    // Add essay evaluations to the evaluation result
    const finalEvaluation: InterviewEvaluation = {
      ...evaluation,
      essayEvaluations,
    };

    await saveInterviewEvaluation(body.sessionId, finalEvaluation);

    console.log(`Evaluation completed successfully for sessionId: ${body.sessionId} (${inputs.length} video responses${essayEvaluations ? `, ${essayEvaluations.length} essays` : ""})`);

    return NextResponse.json(finalEvaluation);
  } catch (error) {
    console.error("Failed to evaluate interview responses", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Evaluation failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
