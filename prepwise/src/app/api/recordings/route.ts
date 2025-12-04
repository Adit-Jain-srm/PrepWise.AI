import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getUserFromRequest } from "@/lib/auth/server";
import { getRecordings, saveRecording } from "@/lib/db/recordingRepository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Try to get user, but don't require authentication (allow unauthenticated users to see empty list)
    let authResult;
    try {
      authResult = await getUserFromRequest(request);
    } catch (authError) {
      // If authentication check fails, treat as unauthenticated
      console.log("Authentication check failed, returning empty recordings:", authError);
      return NextResponse.json({ recordings: [] });
    }
    
    if (!authResult || !authResult.userId) {
      // Not authenticated - return empty array
      return NextResponse.json({ recordings: [] });
    }

    const { userId } = authResult;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    const recordings = await getRecordings(userId, limit);

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    
    // Always return empty array on any error to prevent 401/500 errors from breaking the UI
    return NextResponse.json({ recordings: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json();

    const {
      sessionId,
      candidateId,
      title,
      profile,
      plan,
      evaluation,
      videoUrls,
      audioUrls,
      essayResponses,
      overallScore,
    } = body;

    if (!sessionId || !candidateId) {
      return NextResponse.json(
        { error: "sessionId and candidateId are required" },
        { status: 400 }
      );
    }

    const recordingId = await saveRecording(userId, sessionId, candidateId, {
      title,
      profile,
      plan,
      evaluation,
      videoUrls,
      audioUrls,
      essayResponses,
      overallScore,
    });

    return NextResponse.json({ recordingId, sessionId });
  } catch (error) {
    console.error("Error saving recording:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

