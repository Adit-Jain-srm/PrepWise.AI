import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getUserFromRequest } from "@/lib/auth/server";
import { getQuiz, saveQuizAttempt } from "@/lib/db/quizRepository";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const body = await request.json();
    const { answers, timeTakenSeconds } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Answers are required" },
        { status: 400 }
      );
    }

    // Try to get user (optional for backward compatibility)
    let userId: string | null = null;
    try {
      const authResult = await getUserFromRequest(request);
      if (authResult) {
        userId = authResult.userId;
      }
    } catch {
      // Not authenticated, can still grade but won't save attempt
    }

    // Get quiz to check answers
    const quiz = await getQuiz(quizId);
    
    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Grade the quiz
    let correctCount = 0;
    const totalQuestions = quiz.questions_json.length;
    const results: Record<string, { correct: boolean; userAnswer: string; correctAnswer: string | string[]; explanation?: string }> = {};

    quiz.questions_json.forEach((question) => {
      const userAnswer = answers[question.id];
      const correctAnswer = quiz.correct_answers_json[question.id];
      
      let isCorrect = false;
      
      if (question.type === "multiple-choice" || question.type === "true-false") {
        // Exact match for multiple choice and true/false
        isCorrect = String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
      } else if (question.type === "short-answer") {
        // For short answer, do a fuzzy match (check if key words are present)
        const userAnswerLower = String(userAnswer).toLowerCase();
        const correctAnswerStr = Array.isArray(correctAnswer) 
          ? correctAnswer.join(" ").toLowerCase()
          : String(correctAnswer).toLowerCase();
        
        // Simple keyword matching - can be enhanced
        const correctKeywords = correctAnswerStr.split(/\s+/).filter(w => w.length > 3);
        const userHasKeywords = correctKeywords.some(keyword => userAnswerLower.includes(keyword));
        isCorrect = userHasKeywords || userAnswerLower.includes(correctAnswerStr);
      }

      if (isCorrect) {
        correctCount++;
      }

      results[question.id] = {
        correct: isCorrect,
        userAnswer: String(userAnswer || ""),
        correctAnswer,
        explanation: question.explanation,
      };
    });

    const score = Math.round((correctCount / totalQuestions) * 100 * 100) / 100; // Round to 2 decimal places

    // Save attempt if user is authenticated
    let attemptId: string | null = null;
    if (userId && timeTakenSeconds !== undefined) {
      try {
        attemptId = await saveQuizAttempt(userId, quizId, answers, score, timeTakenSeconds);
      } catch (saveError) {
        console.warn("Failed to save quiz attempt:", saveError);
        // Continue even if save fails
      }
    }

    return NextResponse.json({
      quizId,
      attemptId,
      score,
      correctCount,
      totalQuestions,
      results,
      percentage: score,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

