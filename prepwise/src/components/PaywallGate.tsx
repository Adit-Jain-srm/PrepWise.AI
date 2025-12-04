"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { UserTier } from "@/lib/types/user";

interface PaywallGateProps {
  children: ReactNode;
  requiredTier?: UserTier;
  userTier: UserTier;
  featureName: string;
  description?: string;
}

export function PaywallGate({
  children,
  requiredTier = "premium",
  userTier,
  featureName,
  description,
}: PaywallGateProps) {
  const tierOrder: UserTier[] = ["free", "premium", "enterprise"];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  const hasAccess = userTierIndex >= requiredTierIndex;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-8 text-center">
      <div className="mx-auto max-w-md">
        <div className="mb-4 text-6xl">🔒</div>
        <h3 className="mb-2 text-xl font-bold text-slate-900">
          {featureName} is a Premium Feature
        </h3>
        {description && (
          <p className="mb-6 text-sm text-slate-600">{description}</p>
        )}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-left">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            What you&apos;ll get with Premium:
          </p>
          <ul className="space-y-1 text-sm text-slate-600">
            <li className="flex items-center">
              <span className="mr-2 text-emerald-600">✓</span>
              Unlimited personalized interview questions
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-emerald-600">✓</span>
              Access to all quizzes and learning content
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-emerald-600">✓</span>
              Unlimited recording history
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-emerald-600">✓</span>
              Advanced analytics and progress tracking
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-emerald-600">✓</span>
              Latest MBA news and updates
            </li>
          </ul>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-sky-700 hover:to-emerald-700 transition-all"
        >
          Upgrade to Premium
        </Link>
        <p className="mt-4 text-xs text-slate-500">
          Starting at $29.99/month • Cancel anytime
        </p>
      </div>
    </div>
  );
}

