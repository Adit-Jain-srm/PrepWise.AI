"use client";

import { Navigation } from "@/components/Navigation";
import { TIER_FEATURES } from "@/lib/types/subscription";
import { UserTier } from "@/lib/types/user";
import Link from "next/link";

export default function PricingPage() {
  const tiers: UserTier[] = ["free", "premium", "enterprise"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-slate-900">
            Choose Your Plan
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Select the plan that fits your MBA interview preparation needs. All users get access to quizzes, learning content, and MBA news - free forever!
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {tiers.map((tier) => {
            const tierInfo = TIER_FEATURES[tier];
            const isPopular = tier === "premium";
            
            return (
              <div
                key={tier}
                className={`relative rounded-2xl border-2 ${
                  isPopular
                    ? "border-sky-500 bg-white shadow-xl scale-105"
                    : "border-slate-200 bg-white shadow-lg"
                } p-8`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 px-4 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="mb-2 text-2xl font-bold text-slate-900">
                    {tierInfo.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900">
                      ${tierInfo.price}
                    </span>
                    {tierInfo.price > 0 && (
                      <span className="text-slate-600">/month</span>
                    )}
                  </div>
                  {tierInfo.price === 0 && (
                    <p className="text-sm text-slate-600">Perfect for getting started - includes quizzes, learning content & news!</p>
                  )}
                </div>

                <ul className="mb-8 space-y-3">
                  {tierInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span
                        className={`mr-3 mt-1 ${
                          feature.available
                            ? "text-emerald-600"
                            : "text-slate-300"
                        }`}
                      >
                        {feature.available ? (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </span>
                      <div className="flex-1">
                        <span
                          className={`text-sm ${
                            feature.available
                              ? "text-slate-900"
                              : "text-slate-400"
                          }`}
                        >
                          {feature.name}
                          {feature.limit && (
                            <span className="ml-1 text-slate-500">
                              (up to {feature.limit})
                            </span>
                          )}
                        </span>
                        {feature.description && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {feature.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {tier === "free" ? (
                  <Link
                    href="/"
                    className="block w-full rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                  >
                    Get Started
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`w-full rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors ${
                      isPopular
                        ? "bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
                        : "bg-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    {tier === "premium" ? "Start Free Trial" : "Contact Sales"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600">
            All plans include a 14-day free trial. Cancel anytime. No credit card required for free tier.
          </p>
        </div>
      </main>
    </div>
  );
}

