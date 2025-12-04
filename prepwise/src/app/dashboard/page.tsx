"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { authenticatedFetch, handleApiResponse } from "@/lib/utils/api";
import { InterviewRecordingSummary } from "@/lib/types/user";
import { QuizAttempt } from "@/lib/types/user";
import Link from "next/link";

interface QuizAttemptWithTitle extends QuizAttempt {
  quizTitle?: string;
}

interface DashboardStats {
  totalInterviews: number;
  averageScore: number;
  totalQuizzes: number;
  averageQuizScore: number;
  recentRecordings: InterviewRecordingSummary[];
  recentQuizAttempts: QuizAttemptWithTitle[];
  stats: {
    totalInterviews: number;
    totalQuizzes: number;
    averageInterviewScore: number;
    averageQuizScore: number;
    bestInterviewScore: number;
    bestQuizScore: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { userTier, user } = useAuth();
  const isPremium = userTier === "premium" || userTier === "enterprise";

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const response = await authenticatedFetch("/api/dashboard");
        const data = await handleApiResponse<DashboardStats>(response);
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set default stats on error
        setStats({
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
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <Navigation />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          </div>
        </main>
      </div>
    );
  }

  const dashboardStats = stats || {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : user?.email ? `, ${user.email.split("@")[0]}` : ""}! 👋
          </h1>
          <p className="text-slate-600">
            Track your progress and continue your MBA interview preparation journey.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Link
            href="/interview"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-sky-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">🎤</div>
              <div className="text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                Start →
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Mock Interview</h3>
            <p className="text-sm text-slate-600">
              Practice with AI-powered questions
            </p>
          </Link>

          <Link
            href="/quizzes"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">📝</div>
              <div className="text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                Practice →
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Take a Quiz</h3>
            <p className="text-sm text-slate-600">
              Test your knowledge with quizzes
            </p>
          </Link>

          <Link
            href="/learn"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-amber-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">📚</div>
              <div className="text-xs font-semibold text-amber-600 group-hover:text-amber-700">
                Learn →
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Learning Hub</h3>
            <p className="text-sm text-slate-600">
              Explore curated resources
            </p>
          </Link>

          <Link
            href="/history"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">📹</div>
              <div className="text-xs font-semibold text-purple-600 group-hover:text-purple-700">
                View →
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">My Recordings</h3>
            <p className="text-sm text-slate-600">
              Review past interviews
            </p>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-600">Total Interviews</div>
              <div className="text-2xl">🎤</div>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {dashboardStats.totalInterviews}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {dashboardStats.totalInterviews === 1 ? "interview completed" : "interviews completed"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-600">Average Score</div>
              <div className="text-2xl">⭐</div>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {dashboardStats.averageScore > 0 ? dashboardStats.averageScore.toFixed(1) : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {dashboardStats.averageScore > 0 ? "out of 100" : "Complete an interview"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-600">Quizzes Taken</div>
              <div className="text-2xl">📝</div>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {dashboardStats.totalQuizzes}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {dashboardStats.totalQuizzes === 1 ? "quiz completed" : "quizzes completed"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-600">Quiz Avg. Score</div>
              <div className="text-2xl">🎯</div>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {dashboardStats.averageQuizScore > 0 ? dashboardStats.averageQuizScore.toFixed(1) : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {dashboardStats.averageQuizScore > 0 ? "out of 100" : "Take a quiz"}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Interviews */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Recent Interviews</h2>
              <Link
                href="/history"
                className="text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                View All →
              </Link>
            </div>

            {dashboardStats.recentRecordings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📹</div>
                <p className="text-sm text-slate-600 mb-4">
                  No interviews yet. Start your first mock interview!
                </p>
                <Link
                  href="/interview"
                  className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
                >
                  Start Interview
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardStats.recentRecordings.map((recording) => (
                  <Link
                    key={recording.id}
                    href={`/history/${recording.sessionId}`}
                    className="block rounded-lg border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                          {recording.title || `Interview ${recording.sessionId.slice(0, 8)}`}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {formatDate(recording.createdAt)}
                        </p>
                      </div>
                      {recording.overallScore !== undefined && (
                        <div className="ml-4 rounded-lg bg-sky-50 px-3 py-1.5">
                          <div className="text-lg font-bold text-sky-600">
                            {recording.overallScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-slate-500">Score</div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quiz Attempts */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Recent Quiz Attempts</h2>
              <Link
                href="/quizzes"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                View All →
              </Link>
            </div>

            {dashboardStats.recentQuizAttempts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm text-slate-600 mb-4">
                  No quiz attempts yet. Take your first quiz!
                </p>
                <Link
                  href="/quizzes"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Take Quiz
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardStats.recentQuizAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                          {(attempt as QuizAttemptWithTitle).quizTitle || "Quiz Attempt"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {formatDate(attempt.completedAt)}
                        </p>
                      </div>
                      <div className="ml-4 rounded-lg bg-emerald-50 px-3 py-1.5">
                        <div className="text-lg font-bold text-emerald-600">
                          {attempt.score.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-500">Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Banner for Free Users */}
        {!isPremium && (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 p-8 text-center">
            <div className="mb-4 text-5xl">🚀</div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">
              Unlock Your Full Potential with Premium
            </h3>
            <p className="mb-6 text-sm text-slate-600 max-w-md mx-auto">
              Get unlimited interviews, personalized questions, and access to all quizzes. Upgrade today and accelerate your MBA journey.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-sky-700 hover:to-emerald-700 transition-all"
            >
              Upgrade to Premium
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
