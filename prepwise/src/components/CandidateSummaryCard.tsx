"use client";

import { CandidateProfile } from "@/lib/types/interview";

type CandidateSummaryCardProps = {
  profile: CandidateProfile;
};

export function CandidateSummaryCard({ profile }: CandidateSummaryCardProps) {
  const headline = [
    profile.fullName,
    profile.currentRole,
    profile.totalExperienceYears
      ? `${profile.totalExperienceYears}+ yrs experience`
      : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/30 to-slate-50 p-6 shadow-lg">
      <header className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Profile Insights</h3>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed">
          These highlights will drive the personalized interview questions tailored to your unique background.
        </p>
      </header>

      <div className="space-y-4 text-sm text-slate-700">
        {headline && <p className="font-medium text-slate-900">{headline}</p>}

        {profile.summaryBullets.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Key Takeaways
            </h4>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {profile.summaryBullets.slice(0, 6).map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.keywords.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Keywords
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.keywords.slice(0, 12).map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.experience.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Experience Highlights
            </h4>
            <div className="mt-2 space-y-2">
              {profile.experience.slice(0, 3).map((experience) => (
                <div
                  key={`${experience.company}-${experience.title}`}
                  className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 shadow-sm"
                >
                  <p className="font-semibold text-slate-900">
                    {experience.title} @ {experience.company}
                  </p>
                  {experience.leadershipHighlights?.length ? (
                    <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                      {experience.leadershipHighlights.slice(0, 2).map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  ) : (
                    experience.achievements?.length && (
                      <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                        {experience.achievements.slice(0, 2).map((achievement) => (
                          <li key={achievement}>{achievement}</li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.essays?.length ? (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Essay Signals
            </h4>
            <div className="mt-2 space-y-2">
              {profile.essays.map((essay) => (
                <article
                  key={essay.id}
                  className="rounded-2xl border border-purple-200 bg-purple-50/70 px-4 py-3 text-purple-900"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                    {essay.prompt}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed line-clamp-4">{essay.content}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
