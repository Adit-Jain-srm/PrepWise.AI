import { NextRequest, NextResponse } from "next/server";
import { Quiz } from "@/lib/types/user";
import { getUserFromRequest } from "@/lib/auth/server";
import { getAllQuizzes, saveQuiz } from "@/lib/db/quizRepository";
import { generateQuizQuestions } from "@/lib/services/quizGenerator";

export const dynamic = "force-dynamic";

// Default quizzes to create if none exist
const defaultQuizzes = [
  {
    title: "Behavioral Interview Questions",
    description: "Test your knowledge of common behavioral interview questions and best practices.",
    category: "Behavioral",
    difficulty: "beginner" as const,
    questionCount: 10,
    isPremium: false,
  },
  {
    title: "Leadership Scenarios",
    description: "Practice answering leadership-focused questions for MBA interviews.",
    category: "Leadership",
    difficulty: "intermediate" as const,
    questionCount: 15,
    isPremium: true,
  },
  {
    title: "School-Specific Questions",
    description: "Questions tailored to top MBA programs like Wharton, HBS, and Stanford.",
    category: "School-Specific",
    difficulty: "advanced" as const,
    questionCount: 20,
    isPremium: true,
  },
];

export async function GET(request: NextRequest) {
  try {
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

    // Get quizzes from database
    let quizzes = await getAllQuizzes();

    // If no quizzes exist, create default ones
    if (quizzes.length === 0) {
      console.log("No quizzes found, generating default quizzes...");
      
      for (const defaultQuiz of defaultQuizzes) {
        try {
          const questions = await generateQuizQuestions(
            defaultQuiz.category,
            defaultQuiz.difficulty,
            defaultQuiz.questionCount
          );
          
          await saveQuiz(
            defaultQuiz.title,
            defaultQuiz.description,
            defaultQuiz.category,
            defaultQuiz.difficulty,
            questions,
            defaultQuiz.isPremium
          );
        } catch (error) {
          console.error(`Error creating default quiz "${defaultQuiz.title}":`, error);
        }
      }
      
      // Fetch again after creating
      quizzes = await getAllQuizzes();
    }

    const isPremium = userTier === "premium" || userTier === "enterprise";
    
    // For free users, limit to first 3 quizzes
    const limitedQuizzes = isPremium ? quizzes : quizzes.slice(0, 3);

    return NextResponse.json({ 
      quizzes: limitedQuizzes,
      hasLimit: !isPremium,
      limit: isPremium ? null : 3,
      totalQuizzes: quizzes.length,
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

