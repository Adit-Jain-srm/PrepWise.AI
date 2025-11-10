"use client";

import { useMemo } from "react";
import { EssayPrompt } from "@/lib/types/interview";

type EssayResponseCardProps = {
  prompt: EssayPrompt;
  value: string;
  onChange: (value: string) => void;
  onLockIn: () => void;
  disabled?: boolean;
};

export function EssayResponseCard({
  prompt,
  value,
  onChange,
  onLockIn,
  disabled,
}: EssayResponseCardProps) {
  const wordCount = useMemo(
    () => value.trim().split(/\s+/).filter(Boolean).length,
    [value],
  );

  const withinRange =
    wordCount >= prompt.targetWordCount * 0.8 && wordCount <= prompt.targetWordCount * 1.2;

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-inner">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
          Written Simulation
        </p>
        <h3 className="text-xl font-semibold text-amber-900">200-Word Reflection</h3>
        <p className="mt-1 text-sm text-amber-700">{prompt.prompt}</p>
      </header>

      <textarea
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-70"
        placeholder="Craft a concise, specific answer highlighting your leadership decisions..."
        disabled={disabled}
      />

      <footer className="mt-3 flex items-center justify-between text-sm text-amber-700">
        <span>
          {wordCount} / {prompt.targetWordCount} words{" "}
          {!withinRange && "(aim for ±20%)"}
        </span>
        <button
          type="button"
          className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
          onClick={onLockIn}
          disabled={disabled || !withinRange}
        >
          Lock In Essay
        </button>
      </footer>
    </section>
  );
}
