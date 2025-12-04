"use client";

interface PremiumBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PremiumBadge({ className = "", size = "sm" }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm ${sizeClasses[size]} ${className}`}
    >
      <span className="mr-1">✨</span>
      Premium
    </span>
  );
}

