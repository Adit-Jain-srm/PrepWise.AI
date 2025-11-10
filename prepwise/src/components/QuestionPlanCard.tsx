"use client";

import { InterviewQuestion, EssayPrompt } from "@/lib/types/interview";

type QuestionPlanCardProps = {
  questions: InterviewQuestion[];
  essayPrompt: EssayPrompt | null;
  onStartInterview: () => void;
  disabled?: boolean;
};

const categoryLabels: Record<InterviewQuestion["category"], string> = {
  behavioral: "Behavioral",
  situational: "Situational",
  "school-specific": "School Fit",
  essay: "Written",
};

export function QuestionPlanCard({
  questions,
  essayPrompt,
  onStartInterview,
  disabled,
}: QuestionPlanCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">
            Step 2
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">Personalized Interview Set</h2>
          <p className="mt-1 text-sm text-slate-600">
            Five questions crafted around your leadership and impact stories.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onStartInterview}
          className="rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-sky-700 hover:to-sky-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:from-sky-300 disabled:to-sky-300"
        >
          🚀 Launch Mock Interview
        </button>
      </header>

      <ol className="space-y-4">
        {questions.map((question, index) => (
          <li
            key={question.id}
            className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50 px-5 py-4 shadow-md transition-all hover:border-sky-300 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-100 to-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-700 shadow-sm">
                {categoryLabels[question.category]}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                {question.preparationSeconds}s prep • {question.responseSeconds}s response
              </span>
            </div>
            <p className="text-base font-semibold text-slate-900 leading-relaxed">
              {index + 1}. {question.prompt}
            </p>
            {question.followUps?.length ? (
              <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                {question.followUps.map((followUp) => (
                  <li key={followUp}>{followUp}</li>
                ))}
              </ul>
            ) : null}
            {question.rubricFocus?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {question.rubricFocus.map((focus) => (
                  <span
                    key={focus}
                    className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-amber-700"
                  >
                    {focus}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {essayPrompt && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
            Written Simulation
          </p>
          <p className="mt-2 text-sm font-medium text-amber-900">{essayPrompt.prompt}</p>
          <p className="mt-2 text-xs text-amber-700 bg-amber-100/50 inline-block px-2 py-1 rounded">
            Target: {essayPrompt.targetWordCount} words (Max: 500 words)
          </p>
        </div>
      )}
    </section>
  );
}
