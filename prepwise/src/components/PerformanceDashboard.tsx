"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useState } from "react";
import { InterviewEvaluation } from "@/lib/types/interview";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type PerformanceDashboardProps = {
  evaluation: InterviewEvaluation;
  sessionId: string;
  candidateId: string;
};

export function PerformanceDashboard({ evaluation, sessionId, candidateId }: PerformanceDashboardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/interviews/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, candidateId }),
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `prepwise-report-${sessionId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
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
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {downloading ? "Preparing PDF…" : "Download PDF"}
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          <h3 className="text-sm font-semibold text-emerald-900">Strength Playbook</h3>
          <ul className="mt-2 space-y-1 text-sm text-emerald-900">
            {aggregatedStrengths.length ? (
              aggregatedStrengths.map((strength, index) => <li key={`${strength}-${index}`}>• {strength}</li>)
            ) : (
              <li>No strengths captured yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
          <h3 className="text-sm font-semibold text-rose-900">Growth Opportunities</h3>
          <ul className="mt-2 space-y-1 text-sm text-rose-900">
            {aggregatedDeltas.length ? (
              aggregatedDeltas.map((delta, index) => <li key={`${delta}-${index}`}>• {delta}</li>)
            ) : (
              <li>We didn&apos;t capture action items yet.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
