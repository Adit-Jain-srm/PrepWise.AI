import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { getRecording } from "@/lib/db/recordingRepository";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { sessionId } = await params;

    const recording = await getRecording(userId, sessionId);

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    return NextResponse.json({
      recording: {
        id: recording.id,
        sessionId: recording.session_id,
        title: recording.title,
        profile: recording.profile_json,
        plan: recording.plan_json,
        evaluation: recording.evaluation_json,
        videoUrls: recording.video_urls,
        audioUrls: recording.audio_urls,
        essayResponses: recording.essay_responses,
        overallScore: recording.overall_score,
        completedAt: recording.completed_at,
        createdAt: recording.created_at,
      },
    });
  } catch (error) {
    console.error("Error fetching recording:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

