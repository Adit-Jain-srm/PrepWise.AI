"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { authenticatedFetch, handleApiResponse } from "@/lib/utils/api";
import { Quiz } from "@/lib/types/user";
import Link from "next/link";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLimit, setHasLimit] = useState(false);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const { userTier } = useAuth();

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      try {
        const response = await authenticatedFetch("/api/quizzes");
        const data = await handleApiResponse<{ 
          quizzes: Quiz[]; 
          hasLimit?: boolean; 
          totalQuizzes?: number;
        }>(response);
        setQuizzes(data.quizzes);
        setHasLimit(data.hasLimit || false);
        setTotalQuizzes(data.totalQuizzes || data.quizzes.length);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
  }, [userTier]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-emerald-100 text-emerald-700";
      case "intermediate":
        return "bg-amber-100 text-amber-700";
      case "advanced":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const isPremium = userTier === "premium" || userTier === "enterprise";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navigation />
      
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Interview Preparation Quizzes
          </h1>
          <p className="text-slate-600">
            Test your knowledge and practice for MBA interviews with personalized quizzes.
            {hasLimit && (
              <span className="ml-2 text-amber-600 font-medium">
                (Free users: {quizzes.length} of {totalQuizzes} quizzes available)
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {hasLimit && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  <strong>Free Plan:</strong> You have access to {quizzes.length} quizzes.{" "}
                  <Link href="/pricing" className="font-semibold underline hover:text-amber-900">
                    Upgrade to Premium
                  </Link>{" "}
                  to access all {totalQuizzes} quizzes and unlock unlimited quiz attempts.
                </p>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => {
                const canAccess = !quiz.isPremium || isPremium;
                
                return (
                  <div
                    key={quiz.id}
                    className={`group rounded-xl border ${
                      canAccess
                        ? "border-slate-200 bg-white shadow-sm hover:border-sky-300 hover:shadow-md"
                        : "border-slate-200 bg-slate-50 opacity-60"
                    } p-6 transition-all`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-slate-900">
                          {quiz.title}
                        </h3>
                        <p className="mb-3 text-sm text-slate-600">
                          {quiz.description}
                        </p>
                      </div>
                      {quiz.isPremium && (
                        <span className="ml-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2 py-1 text-xs font-semibold text-white">
                          ✨
                        </span>
                      )}
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getDifficultyColor(
                          quiz.difficulty
                        )}`}
                      >
                        {quiz.difficulty}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {quiz.category}
                      </span>
                    </div>

                    <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
                      <span>{quiz.questionCount} questions</span>
                      <span>•</span>
                      <span>{quiz.estimatedMinutes} min</span>
                    </div>

                    <Link
                      href={canAccess ? `/quizzes/${quiz.id}` : "#"}
                      className={`w-full inline-block text-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        canAccess
                          ? "bg-sky-600 text-white hover:bg-sky-700"
                          : "cursor-not-allowed bg-slate-300 text-slate-500 pointer-events-none"
                      }`}
                    >
                      {canAccess ? "Start Quiz" : "Premium Only"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

