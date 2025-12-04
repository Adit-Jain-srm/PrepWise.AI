import { NextRequest, NextResponse } from "next/server";
import { MBANewsItem } from "@/lib/types/user";
import { getUserFromRequest } from "@/lib/auth/server";
import { MBA_NEWS } from "@/lib/data/mbaNews";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Check if user is authenticated (news is premium feature)
    let userTier: "free" | "premium" | "enterprise" = "free";
    try {
      const authResult = await getUserFromRequest(request);
      if (authResult) {
        userTier = authResult.tier;
      }
    } catch {
      // Not authenticated, use free tier
    }

    // MBA News is now free for everyone
    // Filter news by category and active status
    let filteredNews = MBA_NEWS.filter(item => item.isActive !== false);
    
    if (category && category !== "all") {
      filteredNews = filteredNews.filter(item => item.category === category);
    }

    // Sort by published date (newest first)
    filteredNews.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ news: filteredNews });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

