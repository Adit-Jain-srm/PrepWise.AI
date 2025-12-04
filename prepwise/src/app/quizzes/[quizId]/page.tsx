"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { authenticatedFetch, handleApiResponse } from "@/lib/utils/api";
import { QuizQuestion } from "@/lib/types/user";
import Link from "next/link";

interface QuizResult {
  correct: boolean;
  userAnswer: string;
  correctAnswer: string | string[];
  explanation?: string;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const { userTier } = useAuth();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, string | string[]>>({});
  const [questionExplanations, setQuestionExplanations] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Record<string, QuizResult> | null>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      try {
        const response = await authenticatedFetch(`/api/quizzes/${quizId}/questions`);
        const data = await handleApiResponse<{ questions: QuizQuestion[] }>(response);
        setQuestions(data.questions);
        setStartTime(Date.now());
      } catch (error) {
        console.error("Error fetching quiz questions:", error);
        alert("Failed to load quiz. Please try again.");
        router.push("/quizzes");
      } finally {
        setLoading(false);
      }
    }

    if (quizId) {
      fetchQuestions();
    }
  }, [quizId, router]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      const confirmed = confirm(
        `You have only answered ${Object.keys(answers).length} out of ${questions.length} questions. Are you sure you want to submit?`
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      const timeTakenSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      const response = await authenticatedFetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers,
          timeTakenSeconds,
        }),
      });

      const data = await handleApiResponse<{
        score: number;
        correctCount: number;
        totalQuestions: number;
        results: Record<string, QuizResult>;
      }>(response);

      setScore(data.score);
      setResults(data.results);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (results && score !== null) {
    // Show results
    const correctCount = Object.values(results).filter((r) => r.correct).length;
    const totalQuestions = questions.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <Navigation />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Quiz Results</h1>
            <div className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-600 p-8 text-white shadow-lg">
              <div className="text-6xl font-bold mb-2 drop-shadow-md">{score.toFixed(1)}%</div>
              <div className="text-lg font-semibold">
                {correctCount} out of {totalQuestions} correct
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {questions.map((question, index) => {
              const result = results[question.id];
              const isCorrect = result?.correct;

              return (
                <div
                  key={question.id}
                  className={`rounded-xl border-2 p-6 ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-900 leading-relaxed flex-1">
                      <span className="text-slate-600 font-semibold">Question {index + 1}:</span>{" "}
                      <span className="text-slate-900">{question.question}</span>
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                        isCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  </div>

                  {question.type === "multiple-choice" && question.options && (
                    <div className="mb-4 space-y-2">
                      {question.options.map((option, optIndex) => {
                        const isSelected = answers[question.id] === option;
                        const isCorrectAnswer = String(result?.correctAnswer).toLowerCase() === option.toLowerCase();

                        return (
                          <div
                            key={optIndex}
                            className={`rounded-lg p-4 ${
                              isCorrectAnswer
                                ? "bg-emerald-100 border-2 border-emerald-600"
                                : isSelected && !isCorrect
                                ? "bg-rose-100 border-2 border-rose-600"
                                : "bg-white border border-slate-200"
                            }`}
                          >
                            <span className="text-base text-slate-900 font-medium">{option}</span>
                            {isCorrectAnswer && (
                              <span className="ml-2 text-emerald-800 font-semibold">(Correct Answer)</span>
                            )}
                            {isSelected && !isCorrectAnswer && (
                              <span className="ml-2 text-rose-800 font-semibold">(Your Answer)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.type === "true-false" && (
                    <div className="mb-4 space-y-2">
                      <div className="rounded-lg bg-white p-3 border border-slate-200">
                        <div className="text-sm font-medium text-slate-700 mb-1">Your Answer:</div>
                        <div className="text-base font-semibold text-slate-900">{result?.userAnswer || "No answer provided"}</div>
                      </div>
                      <div className={`rounded-lg p-3 border-2 ${
                        isCorrect ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-300"
                      }`}>
                        <div className="text-sm font-medium text-slate-700 mb-1">Correct Answer:</div>
                        <div className="text-base font-semibold text-slate-900">{String(result?.correctAnswer)}</div>
                      </div>
                    </div>
                  )}

                  {question.type === "short-answer" && (
                    <div className="mb-4 space-y-2">
                      <div className={`rounded-lg p-3 border-2 ${
                        isCorrect ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-300"
                      }`}>
                        <div className="text-sm font-medium text-slate-700 mb-1">Your Answer:</div>
                        <div className="text-base text-slate-900 whitespace-pre-wrap">{result?.userAnswer || "No answer provided"}</div>
                      </div>
                      <div className={`rounded-lg p-3 border-2 ${
                        isCorrect ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-300"
                      }`}>
                        <div className="text-sm font-medium text-slate-700 mb-1">Expected Answer:</div>
                        <div className="text-base text-slate-900 whitespace-pre-wrap">
                          {Array.isArray(result?.correctAnswer)
                            ? result.correctAnswer.join(", ")
                            : result?.correctAnswer || "N/A"}
                        </div>
                      </div>
                    </div>
                  )}

                  {result?.explanation && (
                    <div className="mt-4 rounded-lg bg-blue-50 border-2 border-blue-300 p-4">
                      <div className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wide">Explanation:</div>
                      <div className="text-base text-blue-900 leading-relaxed font-medium">{result.explanation}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/quizzes"
              className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
            >
              Back to Quizzes
            </Link>
            <button
              type="button"
              onClick={() => {
                setResults(null);
                setScore(null);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setStartTime(Date.now());
              }}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navigation />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Quiz</h1>
            <div className="text-sm text-slate-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-sky-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {answeredCount} of {questions.length} answered
          </div>
        </div>

        {currentQuestion && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              {currentQuestion.question}
            </h2>

            {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      answers[currentQuestion.id] === option
                        ? "border-sky-600 bg-sky-50"
                        : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="mr-3 h-4 w-4 text-sky-600"
                    />
                    <span className="text-slate-900">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === "true-false" && (
              <div className="space-y-3">
                {["True", "False"].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      answers[currentQuestion.id] === option
                        ? "border-sky-600 bg-sky-50"
                        : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="mr-3 h-4 w-4 text-sky-600"
                    />
                    <span className="text-slate-900">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === "short-answer" && (
              <textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full rounded-lg border border-slate-300 p-4 text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 min-h-[120px]"
              />
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`rounded-lg px-6 py-2 text-sm font-semibold transition-colors ${
                  currentQuestionIndex === 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Previous
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/quizzes"
            className="text-sm text-slate-600 hover:text-slate-900 underline"
          >
            ← Back to Quizzes
          </Link>
        </div>
      </main>
    </div>
  );
}

