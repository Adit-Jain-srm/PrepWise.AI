import { NextRequest, NextResponse } from "next/server";
import { LearningContent } from "@/lib/types/user";
import { getUserFromRequest } from "@/lib/auth/server";
import { LEARNING_CONTENT } from "@/lib/data/learningContent";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Check if user is authenticated and get tier
    let userTier: "free" | "premium" | "enterprise" = "free";
    try {
      const authResult = await getUserFromRequest(request);
      if (authResult) {
        userTier = authResult.tier;
      }
    } catch {
      // Not authenticated, use free tier
    }

    // All learning content is now free
    let filteredContent = LEARNING_CONTENT.filter(content => content.isActive !== false);
    
    if (category && category !== "all") {
      filteredContent = filteredContent.filter(content => content.category === category);
    }

    // Sort by view count (most popular first)
    filteredContent.sort((a, b) => b.viewCount - a.viewCount);

    return NextResponse.json({ content: filteredContent });
  } catch (error) {
    console.error("Error fetching learning content:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

