import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  loadCandidateProfile,
  saveCandidateProfile,
  saveInterviewSessionPlan,
} from "@/lib/db/interviewRepository";
import { generateInterviewSessionPlan } from "@/lib/services/questionGenerator";
import { generatePremiumInterviewSessionPlan } from "@/lib/services/premiumQuestionGenerator";
import { CandidateProfile } from "@/lib/types/interview";
import { getUserFromRequest } from "@/lib/auth/server";

type PlanRequestBody = {
  candidateId?: string;
  profile?: CandidateProfile;
  questionCount?: number;
  sessionId?: string;
  targetSchools?: string[];
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PlanRequestBody;

    // Validate required fields
    if (!body.candidateId && !body.profile) {
      return NextResponse.json(
        { error: "Either candidateId or profile must be provided." },
        { status: 400 },
      );
    }

    // Try to get user from auth (optional for backward compatibility)
    let userTier: "free" | "premium" | "enterprise" = "free";
    try {
      const authResult = await getUserFromRequest(request);
      if (authResult) {
        userTier = authResult.tier;
      }
    } catch {
      // Not authenticated, use free tier
    }

    const candidateId = body.candidateId ?? crypto.randomUUID();
    const questionCount = body.questionCount ?? (userTier !== "free" ? 7 : 5);
    const sessionId = body.sessionId ?? crypto.randomUUID();

    // Prefer profile from request body (more reliable), fallback to loading from store
    let profile: CandidateProfile | null = body.profile ?? null;

    if (!profile && body.candidateId) {
      console.log(`Loading profile for candidateId: ${body.candidateId}`);
      profile = await loadCandidateProfile(body.candidateId);
      
      if (!profile) {
        console.warn(`Profile not found in store for candidateId: ${body.candidateId}`);
      }
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Candidate profile not found. Please upload a resume first." },
        { status: 404 },
      );
    }

    // Ensure profile is saved to store for future use
    if (body.candidateId && profile) {
      try {
        await saveCandidateProfile(candidateId, profile);
      } catch (saveError) {
        console.warn("Failed to save profile to store, continuing anyway:", saveError);
        // Continue even if save fails - we have the profile in memory
      }
    }

    console.log(`Generating interview plan for candidateId: ${candidateId}, sessionId: ${sessionId}, tier: ${userTier}`);
    
    // Use premium generator for premium/enterprise users, standard for free
    const plan = userTier !== "free"
      ? await generatePremiumInterviewSessionPlan(candidateId, profile, {
          sessionId,
          questionCount,
          targetSchools: body.targetSchools,
        })
      : await generateInterviewSessionPlan(candidateId, profile, {
          sessionId,
          questionCount,
        });

    await saveInterviewSessionPlan(plan);

    console.log(`Interview plan generated successfully: ${sessionId}`);

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to generate interview plan:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate interview plan.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
