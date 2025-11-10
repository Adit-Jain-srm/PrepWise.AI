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

  const maxWords = 500;
  const minWords = Math.floor(prompt.targetWordCount * 0.8); // 80% of target (200 for 250 target)
  const withinRange = wordCount >= minWords && wordCount <= maxWords;
  const isUnderMin = wordCount > 0 && wordCount < minWords;
  const isOverMax = wordCount > maxWords;

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-inner">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
          Written Simulation
        </p>
        <h3 className="text-xl font-semibold text-amber-900">
          Essay Response ({prompt.targetWordCount} words target)
        </h3>
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

      <footer className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span
            className={
              isOverMax
                ? "font-semibold text-red-600"
                : isUnderMin
                  ? "font-semibold text-orange-600"
                  : withinRange
                    ? "font-semibold text-emerald-600"
                    : "text-amber-700"
            }
          >
            {wordCount} / {maxWords} words
            {isUnderMin && ` (minimum: ${minWords} words)`}
            {isOverMax && " (exceeds maximum)"}
            {withinRange && " ✓"}
          </span>
          <span className="text-xs text-amber-600">
            Target: {prompt.targetWordCount} words
          </span>
        </div>
        <button
          type="button"
          className="w-full rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300 disabled:opacity-50"
          onClick={onLockIn}
          disabled={disabled || !withinRange || wordCount === 0}
        >
          {isOverMax
            ? `Exceeds ${maxWords} words`
            : isUnderMin
              ? `Need at least ${minWords} words`
              : "Lock In Essay"}
        </button>
      </footer>
    </section>
  );
}
