"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useState } from "react";
import { InterviewEvaluation, CandidateProfile } from "@/lib/types/interview";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type PerformanceDashboardProps = {
  evaluation: InterviewEvaluation;
  sessionId: string;
  candidateId: string;
  profile?: CandidateProfile; // Optional: send profile for PDF report
};

export function PerformanceDashboard({ evaluation, sessionId, candidateId, profile }: PerformanceDashboardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/interviews/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId, 
          candidateId,
          evaluation, // Send evaluation from frontend state (more reliable)
          profile, // Send profile from frontend state for Profile Insights section
        }),
      });

      if (!response.ok) {
        // Try to parse error response for better error messages
        let errorMessage = "Download failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error ?? errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        console.error("PDF download failed:", errorMessage);
        alert(`Failed to download PDF: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      
      // Verify that we received a PDF
      if (!blob.type.includes("pdf")) {
        console.error("Received non-PDF response:", blob.type);
        throw new Error("Invalid PDF response from server");
      }
      
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `prepwise-report-${sessionId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download error:", error);
      // Error already shown in alert above, or log it for debugging
    } finally {
      setDownloading(false);
    }
  };

  const rubricLabels = Object.keys(evaluation.rubricScores);
  const rubricValues = rubricLabels.map((label) => evaluation.rubricScores[label] ?? 0);

  const responseBreakdown = useMemo(() => {
    return evaluation.responses.map((response, index) => ({
      questionLabel: `Q${index + 1}`,
      strengths: response.strengths,
      improvements: response.improvements,
      avgScore:
        Object.values(response.scores).reduce((sum, score) => sum + score, 0) /
        Math.max(Object.values(response.scores).length, 1),
    }));
  }, [evaluation.responses]);

  const aggregatedStrengths = evaluation.responses.flatMap((response) => response.strengths);
  const aggregatedDeltas = evaluation.responses.flatMap((response) => response.improvements);

  // Include essay strengths and improvements in aggregated lists
  if (evaluation.essayEvaluations && evaluation.essayEvaluations.length > 0) {
    evaluation.essayEvaluations.forEach((essayEval) => {
      aggregatedStrengths.push(...essayEval.strengths);
      aggregatedDeltas.push(...essayEval.improvements);
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          Step 4
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">Performance Report</h2>
        <p className="mt-1 text-sm text-slate-600">
          Instant analytics across communication, leadership, and school fit dimensions.
        </p>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl disabled:cursor-not-allowed disabled:from-emerald-300 disabled:to-emerald-300"
        >
          {downloading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Preparing PDF…
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF Report
            </>
          )}
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Rubric Radar (Avg Score {evaluation.overallScore.toFixed(2)} / 10)
          </h3>
          <Plot
            data={[
              {
                type: "scatterpolar",
                r: [...rubricValues, rubricValues[0] ?? 0],
                theta: [...rubricLabels, rubricLabels[0] ?? ""],
                fill: "toself",
                name: "Rubric",
                line: { color: "#0284c7" },
              },
            ]}
            layout={{
              polar: {
                radialaxis: { visible: true, range: [0, 10] },
              },
              margin: { t: 30, r: 30, b: 30, l: 30 },
              showlegend: false,
              paper_bgcolor: "rgba(0,0,0,0)",
              plot_bgcolor: "rgba(0,0,0,0)",
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%", height: "320px" }}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Question-Level Performance</h3>
          <Plot
            data={[
              {
                type: "bar",
                x: responseBreakdown.map((item) => item.questionLabel),
                y: responseBreakdown.map((item) => Number(item.avgScore.toFixed(2))),
                marker: { color: "#1d4ed8" },
              },
            ]}
            layout={{
              yaxis: { range: [0, 10], title: "Average Score" },
              margin: { t: 30, r: 30, b: 40, l: 50 },
              paper_bgcolor: "rgba(0,0,0,0)",
              plot_bgcolor: "rgba(0,0,0,0)",
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%", height: "320px" }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <span className="text-emerald-600">✓</span> Strength Playbook
            </h3>
            <ul className="space-y-2 text-sm text-emerald-900">
              {aggregatedStrengths.length ? (
                aggregatedStrengths.slice(0, 8).map((strength, index) => (
                  <li key={`${strength}-${index}`} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))
              ) : (
                <li className="text-emerald-700">No strengths captured yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <span className="text-amber-600">↑</span> Growth Opportunities
            </h3>
            <ul className="space-y-2 text-sm text-amber-900">
              {aggregatedDeltas.length ? (
                aggregatedDeltas.slice(0, 8).map((delta, index) => (
                  <li key={`${delta}-${index}`} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{delta}</span>
                  </li>
                ))
              ) : (
                <li className="text-amber-700">We didn&apos;t capture action items yet.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Question-Wise Analysis</h3>
          <div className="space-y-4">
            {evaluation.responses.map((response, index) => (
              <div
                key={response.questionId}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">Question {index + 1}</h4>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    Avg: {(
                      Object.values(response.scores).reduce((sum, score) => sum + score, 0) /
                      Math.max(Object.values(response.scores).length, 1)
                    ).toFixed(1)}/10
                  </span>
                </div>
                {response.toneAnalysis && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Tone Analysis
                    </p>
                    <p className="text-sm text-slate-700">{response.toneAnalysis}</p>
                  </div>
                )}
                {response.communicationClarity && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Communication Clarity
                    </p>
                    <p className="text-sm text-slate-700">{response.communicationClarity}</p>
                  </div>
                )}
                {response.confidenceAnalysis && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Confidence Analysis
                    </p>
                    <p className="text-sm text-slate-700">{response.confidenceAnalysis}</p>
                  </div>
                )}
                {response.nonVerbalAnalysis && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Non-Verbal Analysis
                    </p>
                    <p className="text-sm text-slate-700">{response.nonVerbalAnalysis}</p>
                  </div>
                )}
                {response.transcript && response.transcript !== "[No audio recorded]" && response.transcript !== "[No transcript available]" && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Transcript
                    </p>
                    <p className="text-sm text-slate-600 italic">{response.transcript.substring(0, 200)}{response.transcript.length > 200 ? "..." : ""}</p>
                  </div>
                )}
                <div className="grid gap-2 mt-3 sm:grid-cols-2">
                  {response.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Strengths</p>
                      <ul className="text-xs text-emerald-900 space-y-1">
                        {response.strengths.slice(0, 3).map((strength, idx) => (
                          <li key={idx}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {response.improvements.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-700 mb-1">Improvements</p>
                      <ul className="text-xs text-amber-900 space-y-1">
                        {response.improvements.slice(0, 3).map((improvement, idx) => (
                          <li key={idx}>• {improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {evaluation.essayEvaluations && evaluation.essayEvaluations.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-amber-900 mb-4">Written Essay Analysis</h3>
            <div className="space-y-4">
              {evaluation.essayEvaluations.map((essayEval, index) => (
                <div
                  key={essayEval.essayId}
                  className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-amber-900">Essay {index + 1}</h4>
                    <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded">
                      {essayEval.wordCount} words | Avg: {(
                        Object.values(essayEval.scores).reduce((sum, score) => sum + score, 0) /
                        Math.max(Object.values(essayEval.scores).length, 1)
                      ).toFixed(1)}/10
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                      Prompt
                    </p>
                    <p className="text-sm text-amber-900">{essayEval.prompt}</p>
                  </div>
                  {essayEval.writingClarity && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Writing Clarity
                      </p>
                      <p className="text-sm text-slate-700">{essayEval.writingClarity}</p>
                    </div>
                  )}
                  {essayEval.structureAnalysis && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Structure Analysis
                      </p>
                      <p className="text-sm text-slate-700">{essayEval.structureAnalysis}</p>
                    </div>
                  )}
                  {essayEval.depthAnalysis && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Depth Analysis
                      </p>
                      <p className="text-sm text-slate-700">{essayEval.depthAnalysis}</p>
                    </div>
                  )}
                  {essayEval.content && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Essay Preview
                      </p>
                      <p className="text-sm text-slate-600 italic">{essayEval.content.substring(0, 200)}{essayEval.content.length > 200 ? "..." : ""}</p>
                    </div>
                  )}
                  <div className="grid gap-2 mt-3 sm:grid-cols-2">
                    {essayEval.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 mb-1">Strengths</p>
                        <ul className="text-xs text-emerald-900 space-y-1">
                          {essayEval.strengths.slice(0, 3).map((strength, idx) => (
                            <li key={idx}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {essayEval.improvements.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-1">Improvements</p>
                        <ul className="text-xs text-amber-900 space-y-1">
                          {essayEval.improvements.slice(0, 3).map((improvement, idx) => (
                            <li key={idx}>• {improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
