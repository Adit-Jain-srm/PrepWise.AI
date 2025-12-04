"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";

export function Navigation() {
  const { userTier } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/interview", label: "Interview Prep", icon: "🎤" },
    { href: "/history", label: "My Recordings", icon: "📹", premium: false },
    { href: "/quizzes", label: "Quizzes", icon: "📝", premium: false },
    { href: "/learn", label: "Learn", icon: "📚", premium: false },
    { href: "/news", label: "MBA News", icon: "📰", premium: false },
  ];

  const isPremium = userTier === "premium" || userTier === "enterprise";

  return (
    <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                PrepWise.AI
              </h1>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const requiresPremium = item.premium && !isPremium;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative px-4 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? "text-sky-600 bg-sky-50" 
                        : "text-slate-700 hover:text-sky-600 hover:bg-slate-50"
                      }
                      ${requiresPremium ? "opacity-60" : ""}
                    `}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                    {requiresPremium && (
                      <span className="ml-1 text-xs text-amber-600">✨</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isPremium && (
              <Link
                href="/pricing"
                className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-emerald-600 rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all shadow-md"
              >
                Upgrade to Premium
              </Link>
            )}
            {isPremium && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full">
                ✨ {userTier === "enterprise" ? "Enterprise" : "Premium"}
              </span>
            )}
            
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const requiresPremium = item.premium && !isPremium;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? "text-sky-600 bg-sky-50" 
                      : "text-slate-700 hover:text-sky-600 hover:bg-slate-50"
                    }
                    ${requiresPremium ? "opacity-60" : ""}
                  `}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                  {requiresPremium && (
                    <span className="ml-1 text-xs text-amber-600">✨</span>
                  )}
                </Link>
              );
            })}
            {!isPremium && (
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block mt-4 px-4 py-3 text-sm font-semibold text-center text-white bg-gradient-to-r from-sky-600 to-emerald-600 rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all"
              >
                Upgrade to Premium
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

