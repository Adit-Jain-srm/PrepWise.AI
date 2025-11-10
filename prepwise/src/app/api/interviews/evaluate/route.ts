import { NextRequest, NextResponse } from "next/server";
import {
  loadCandidateProfile,
  loadInterviewSessionPlan,
  saveInterviewEvaluation,
} from "@/lib/db/interviewRepository";
import {
  compileInterviewEvaluation,
  NonVerbalSignal,
  SpeechAnalyticsSnapshot,
} from "@/lib/services/evaluationEngine";

type ResponsePayload = {
  questionId: string;
  speech: SpeechAnalyticsSnapshot;
  nonVerbalSignals?: NonVerbalSignal[];
};

type EvaluateRequestBody = {
  sessionId: string;
  candidateId: string;
  responses: ResponsePayload[];
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as EvaluateRequestBody;

  if (!body.sessionId || !body.candidateId || !body.responses?.length) {
    return NextResponse.json({ error: "Missing required evaluation payload." }, { status: 400 });
  }

  const [plan, profile] = await Promise.all([
    loadInterviewSessionPlan(body.sessionId),
    loadCandidateProfile(body.candidateId),
  ]);

  if (!plan) {
    return NextResponse.json(
      { error: "Interview session not found. Generate a plan first." },
      { status: 404 },
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Candidate profile not found for evaluation." },
      { status: 404 },
    );
  }

  try {
    const inputs = body.responses.map((payload) => {
      const question = plan.questions.find((item) => item.id === payload.questionId);

      if (!question) {
        throw new Error(`Unknown question id ${payload.questionId}`);
      }

      return {
        sessionId: body.sessionId,
        question,
        profile,
        speech: payload.speech,
        nonVerbalSignals: payload.nonVerbalSignals,
      };
    });

    const evaluation = await compileInterviewEvaluation(inputs);
    await saveInterviewEvaluation(body.sessionId, evaluation);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Failed to evaluate interview responses", error);
    return NextResponse.json(
      { error: "Evaluation failed. Please retry once media processing completes." },
      { status: 500 },
    );
  }
}
