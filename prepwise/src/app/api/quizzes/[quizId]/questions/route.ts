import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/server";
import { getQuiz } from "@/lib/db/quizRepository";
import { generateQuizQuestions } from "@/lib/services/quizGenerator";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    
    // Try to get user (optional for backward compatibility)
    let userId: string | null = null;
    try {
      const authResult = await getUserFromRequest(request);
      if (authResult) {
        userId = authResult.userId;
      }
    } catch {
      // Not authenticated, continue without user
    }

    // Try to get quiz from database
    let quiz = await getQuiz(quizId);

    // If quiz doesn't exist, try to find it in the quizzes list or generate it on-the-fly
    if (!quiz) {
      // First, try to get quiz metadata from the quizzes list
      const { getAllQuizzes, saveQuiz } = await import("@/lib/db/quizRepository");
      const allQuizzes = await getAllQuizzes();
      const quizMetadata = allQuizzes.find((q) => q.id === quizId);
      
      if (quizMetadata) {
        // Quiz metadata exists but questions aren't saved yet - generate and save them
        const questions = await generateQuizQuestions(
          quizMetadata.category,
          quizMetadata.difficulty,
          quizMetadata.questionCount
        );
        
        // Save the quiz with generated questions, using the existing quizId
        const savedQuizId = await saveQuiz(
          quizMetadata.title,
          quizMetadata.description,
          quizMetadata.category,
          quizMetadata.difficulty,
          questions,
          quizMetadata.isPremium,
          quizId // Use the existing quizId
        );
        
        // Fetch the saved quiz
        quiz = await getQuiz(savedQuizId || quizId);
      } else {
        // No metadata found - generate based on URL params or defaults
        const category = request.nextUrl.searchParams.get("category") || "Behavioral";
        const difficulty = (request.nextUrl.searchParams.get("difficulty") || "beginner") as "beginner" | "intermediate" | "advanced";
        const questionCount = parseInt(request.nextUrl.searchParams.get("count") || "10", 10);

        const questions = await generateQuizQuestions(category, difficulty, questionCount);
        
        // Save the generated quiz with the requested quizId so it can be retrieved later
        const savedQuizId = await saveQuiz(
          `${category} Quiz`,
          `Quiz questions about ${category}`,
          category,
          difficulty,
          questions,
          false,
          quizId // Use the requested quizId
        );
        
        // Fetch the saved quiz
        quiz = await getQuiz(savedQuizId || quizId);
      }
    }

    // Return questions from stored quiz (hide correct answers from user, but include in response for grading)
    const questionsWithoutAnswers = quiz.questions_json.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      // Don't expose correctAnswer or explanation to user
    }));

    // Include correct answers map for client-side grading (will be stored in frontend)
    const correctAnswersMap: Record<string, string | string[]> = {};
    quiz.questions_json.forEach((q) => {
      correctAnswersMap[q.id] = q.correctAnswer;
    });

    return NextResponse.json({
      quizId: quiz.id,
      questions: questionsWithoutAnswers,
      correctAnswers: correctAnswersMap, // Include for grading on submit
      generated: false,
    });
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

