import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/server";
import { getRecordings } from "@/lib/db/recordingRepository";
import { getQuizAttempts, getQuiz } from "@/lib/db/quizRepository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await getUserFromRequest(request);
    
    if (!authResult) {
      // Return empty stats for unauthenticated users
      return NextResponse.json({
        totalInterviews: 0,
        averageScore: 0,
        totalQuizzes: 0,
        averageQuizScore: 0,
        recentRecordings: [],
        recentQuizAttempts: [],
        stats: {
          totalInterviews: 0,
          totalQuizzes: 0,
          averageInterviewScore: 0,
          averageQuizScore: 0,
          bestInterviewScore: 0,
          bestQuizScore: 0,
        },
      });
    }

    const { userId } = authResult;

    // Get all recordings
    const recordings = await getRecordings(userId);
    
    // Calculate interview statistics
    const totalInterviews = recordings.length;
    const scores = recordings
      .map((r) => r.overallScore)
      .filter((s) => s !== undefined && s !== null) as number[];
    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    // Get all quiz attempts
    const quizAttempts = await getQuizAttempts(userId);
    
    // Calculate quiz statistics
    const totalQuizzes = quizAttempts.length;
    const quizScores = quizAttempts.map((a) => a.score);
    const averageQuizScore =
      quizScores.length > 0
        ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
        : 0;
    const bestQuizScore = quizScores.length > 0 ? Math.max(...quizScores) : 0;

    // Get recent recordings (last 3)
    const recentRecordings = recordings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    // Get recent quiz attempts (last 3) with quiz titles
    const recentQuizAttemptsWithTitles = await Promise.all(
      quizAttempts.slice(0, 3).map(async (attempt) => {
        const quiz = await getQuiz(attempt.quizId);
        return {
          ...attempt,
          quizTitle: quiz?.title || "Quiz",
        };
      })
    );

    return NextResponse.json({
      totalInterviews,
      averageScore: Math.round(averageScore * 10) / 10,
      totalQuizzes,
      averageQuizScore: Math.round(averageQuizScore * 10) / 10,
      recentRecordings,
      recentQuizAttempts: recentQuizAttemptsWithTitles,
      stats: {
        totalInterviews,
        totalQuizzes,
        averageInterviewScore: Math.round(averageScore * 10) / 10,
        averageQuizScore: Math.round(averageQuizScore * 10) / 10,
        bestInterviewScore: Math.round(bestScore * 10) / 10,
        bestQuizScore: Math.round(bestQuizScore * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    
    // Return empty stats on error
    return NextResponse.json({
      totalInterviews: 0,
      averageScore: 0,
      totalQuizzes: 0,
      averageQuizScore: 0,
      recentRecordings: [],
      recentQuizAttempts: [],
      stats: {
        totalInterviews: 0,
        totalQuizzes: 0,
        averageInterviewScore: 0,
        averageQuizScore: 0,
        bestInterviewScore: 0,
        bestQuizScore: 0,
      },
    });
  }
}
