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
  const [essayPrompt, setEssayPrompt] = useState("");
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
      // Only append essayPrompt if it's not empty (it's optional)
      if (essayPrompt.trim().length > 0) {
        formData.append("essayPrompt", essayPrompt.trim());
      }

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

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(
          `Server error: ${response.status} ${response.statusText}. Please check your Azure credentials and try again.`,
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? `Upload failed: ${response.status} ${response.statusText}`);
      }

      const payload = data as UploadResponse;
      onUploaded(payload);
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-xl backdrop-blur-sm">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
          Step 1
        </p>
        <h2 className="text-3xl font-bold text-slate-900 mt-2">
          Upload Resume &amp; Optional Essay
        </h2>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed">
          We&apos;ll parse your background to personalize the interview. Upload your resume and optionally include essay responses for deeper personalization.
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
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              value={essayPrompt}
              onChange={(event) => setEssayPrompt(event.target.value)}
              placeholder="e.g., Explain your leadership philosophy."
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
            placeholder="Paste your essay text (up to 500 words)..."
            rows={5}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            value={essayText}
            onChange={(event) => setEssayText(event.target.value)}
          />
          <p className="mt-1 text-right text-xs text-slate-500">
            {essayText.trim().split(/\s+/).filter(Boolean).length} / 500 words
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-sky-700 hover:to-sky-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:from-sky-300 disabled:to-sky-300"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing Profile...
            </span>
          ) : (
            "Analyze Profile"
          )}
        </button>
      </form>
    </section>
  );
}
