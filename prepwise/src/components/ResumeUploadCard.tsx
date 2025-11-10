"use client";

import { useState } from "react";
import { CandidateProfile } from "@/lib/types/interview";

type UploadResponse = {
  candidateId: string;
  profile: CandidateProfile;
};

type ResumeUploadCardProps = {
  onUploaded: (response: UploadResponse) => void;
};

const ACCEPTED_TYPES = ".pdf,.doc,.docx";

export function ResumeUploadCard({ onUploaded }: ResumeUploadCardProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [essayFile, setEssayFile] = useState<File | null>(null);
  const [essayText, setEssayText] = useState("");
  const [essayPrompt, setEssayPrompt] = useState("Explain your leadership philosophy.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resumeFile) {
      setError("Please upload a resume to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("essayPrompt", essayPrompt);

      if (essayFile) {
        formData.append("essayFile", essayFile);
      }

      if (essayText.trim().length > 0) {
        formData.append("essayText", essayText.trim());
      }

      const response = await fetch("/api/candidates/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error((await response.json())?.error ?? "Upload failed.");
      }

      const payload = (await response.json()) as UploadResponse;
      onUploaded(payload);
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-lg backdrop-blur">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">
          Step 1
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">
          Upload Resume &amp; Optional Essay
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          We&apos;ll parse your background to personalize the interview.
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Resume (PDF or Word)
          </label>
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            className="mt-2 block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
            onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Essay Prompt (optional)
            </label>
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              value={essayPrompt}
              onChange={(event) => setEssayPrompt(event.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Essay File (optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="mt-2 block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
              onChange={(event) => setEssayFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Essay Text (optional)
          </label>
          <textarea
            placeholder="Paste up to 200 words..."
            rows={4}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            value={essayText}
            onChange={(event) => setEssayText(event.target.value)}
          />
          <p className="mt-1 text-right text-xs text-slate-500">
            {essayText.trim().split(/\s+/).filter(Boolean).length} / 200 words
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {loading ? "Analyzing..." : "Analyze Profile"}
        </button>
      </form>
    </section>
  );
}
