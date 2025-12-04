import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { saveRecording } from "@/lib/db/recordingRepository";
import { loadInterviewSessionPlan } from "@/lib/db/interviewRepository";
import { loadInterviewEvaluation } from "@/lib/db/interviewRepository";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json();

    const { sessionId, candidateId, title, plan, evaluation, overallScore, profile } = body;

    if (!sessionId || !candidateId) {
      return NextResponse.json(
        { error: "sessionId and candidateId are required" },
        { status: 400 }
      );
    }

    // Prefer plan and evaluation from request body, fallback to loading from store
    let finalPlan = plan;
    let finalEvaluation = evaluation;

    if (!finalPlan) {
      finalPlan = await loadInterviewSessionPlan(sessionId);
    }

    if (!finalEvaluation) {
      finalEvaluation = await loadInterviewEvaluation(sessionId);
    }

    if (!finalPlan) {
      return NextResponse.json(
        { error: "Interview session plan not found" },
        { status: 404 }
      );
    }

    // Save recording to Supabase
    await saveRecording(userId, sessionId, candidateId, {
      title: title || `Interview - ${new Date().toLocaleDateString()}`,
      plan: finalPlan,
      evaluation: finalEvaluation || undefined,
      overallScore: overallScore || finalEvaluation?.overallScore,
      profile: profile || finalPlan.candidateProfile,
    });

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("Error saving interview:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

