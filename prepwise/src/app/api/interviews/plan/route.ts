import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  loadCandidateProfile,
  saveInterviewSessionPlan,
} from "@/lib/db/interviewRepository";
import { generateInterviewSessionPlan } from "@/lib/services/questionGenerator";
import { CandidateProfile } from "@/lib/types/interview";

type PlanRequestBody = {
  candidateId?: string;
  profile?: CandidateProfile;
  questionCount?: number;
  sessionId?: string;
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PlanRequestBody;

  const candidateId = body.candidateId ?? crypto.randomUUID();
  const questionCount = body.questionCount ?? 5;
  const sessionId = body.sessionId ?? crypto.randomUUID();

  let profile: CandidateProfile | null = body.profile ?? null;

  if (!profile && body.candidateId) {
    profile = await loadCandidateProfile(body.candidateId);
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Candidate profile not found. Please upload a resume first." },
      { status: 404 },
    );
  }

  try {
    const plan = await generateInterviewSessionPlan(candidateId, profile, {
      sessionId,
      questionCount,
    });

    await saveInterviewSessionPlan(plan);

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to generate interview plan", error);
    return NextResponse.json(
      { error: "Failed to generate interview plan. Please retry in a moment." },
      { status: 500 },
    );
  }
}
