"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { InterviewRecordingSummary } from "@/lib/types/user";
import { useAuth } from "@/components/AuthProvider";
import { authenticatedFetch, handleApiResponse } from "@/lib/utils/api";
import Link from "next/link";

export default function HistoryPage() {
  const [recordings, setRecordings] = useState<InterviewRecordingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { userTier } = useAuth();

  useEffect(() => {
    async function fetchRecordings() {
      setLoading(true);
      try {
        const limit = userTier === "free" ? 3 : undefined;
        const url = limit ? `/api/recordings?limit=${limit}` : "/api/recordings";
        
        const response = await authenticatedFetch(url);
        
        // Handle any non-ok response gracefully - treat as unauthenticated, show empty state
        if (!response.ok) {
          console.log(`Recordings API returned ${response.status}, showing empty state`);
          setRecordings([]);
          return;
        }
        
        const data = await handleApiResponse<{ recordings: InterviewRecordingSummary[] }>(response);
        setRecordings(data.recordings || []);
      } catch (error) {
        console.error("Error fetching recordings:", error);
        // If not authenticated or any error, show empty state
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRecordings();
  }, [userTier]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isPremium = userTier === "premium" || userTier === "enterprise";
  const maxRecordings = isPremium ? Infinity : 3;
  const visibleRecordings = isPremium ? recordings : recordings.slice(0, maxRecordings);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navigation />
      
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            My Interview Recordings
          </h1>
          <p className="text-slate-600">
            Review your past mock interviews and track your progress over time.
            {userTier === "free" && " Free users can view the last 3 recordings."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mb-4 text-6xl">📹</div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              No recordings yet
            </h3>
            <p className="mb-6 text-sm text-slate-600">
              Complete your first mock interview to see it here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
            >
              Start Interview
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleRecordings.map((recording) => (
                <Link
                  key={recording.id}
                  href={`/history/${recording.sessionId}`}
                  className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-sky-300 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 text-lg font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                        {recording.title || `Interview ${recording.sessionId.slice(0, 8)}`}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {formatDate(recording.createdAt)} at {formatTime(recording.createdAt)}
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
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>{recording.questionCount || 0} questions</span>
                    {recording.completedAt && (
                      <span className="text-emerald-600">✓ Completed</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {!isPremium && recordings.length >= maxRecordings && (
              <div className="mt-8 rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 p-8 text-center">
                <div className="mb-4 text-5xl">🔒</div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  Upgrade to Premium for Unlimited History
                </h3>
                <p className="mb-6 text-sm text-slate-600">
                  Free users can view up to {maxRecordings} recent recordings. Upgrade to access your complete interview history.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-sky-700 hover:to-emerald-700 transition-all"
                >
                  Upgrade to Premium
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

