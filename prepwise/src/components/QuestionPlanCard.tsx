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
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          Launch Mock Interview
        </button>
      </header>

      <ol className="space-y-3">
        {questions.map((question, index) => (
          <li
            key={question.id}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm transition hover:border-sky-200 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-sky-700">
                {categoryLabels[question.category]}
              </span>
              <span className="text-xs text-slate-500">
                {question.preparationSeconds}s prep • {question.responseSeconds}s response
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-900">
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
        <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/80 px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-600">
            Written Sim
          </p>
          <p className="mt-1 text-sm font-medium text-purple-900">{essayPrompt.prompt}</p>
          <p className="mt-1 text-xs text-purple-700">
            Target {essayPrompt.targetWordCount} words
          </p>
        </div>
      )}
    </section>
  );
}
