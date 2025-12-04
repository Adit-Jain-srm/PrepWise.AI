"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { authenticatedFetch, handleApiResponse } from "@/lib/utils/api";
import { LearningContent } from "@/lib/types/user";

export default function LearnPage() {
  const [content, setContent] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { userTier } = useAuth();

  const categories = [
    "all",
    "interview-prep",
    "leadership",
    "communication",
    "case-studies",
    "school-specific",
  ];

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      try {
        const url = selectedCategory === "all" 
          ? "/api/learn" 
          : `/api/learn?category=${selectedCategory}`;
        
        const response = await authenticatedFetch(url);
        const data = await handleApiResponse<{ content: LearningContent[] }>(response);
        setContent(data.content);
      } catch (error) {
        console.error("Error fetching learning content:", error);
        setContent([]);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [selectedCategory, userTier]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navigation />
      
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Learning Hub
          </h1>
          <p className="text-slate-600">
            Explore curated videos, articles, and courses to boost your MBA interview preparation.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-sky-600 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {category === "all"
                ? "All Content"
                : category.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-sky-300 hover:shadow-md transition-all"
              >
                {item.thumbnailUrl && item.contentType === "video" && (
                  <div className="relative h-48 w-full bg-slate-200">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-white/90 p-4">
                        <svg
                          className="h-8 w-8 text-sky-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    {item.durationMinutes && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
                        {item.durationMinutes} min
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 capitalize">
                      {item.contentType}
                    </span>
                  </div>
                  
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h3 className="mb-2 text-lg font-semibold text-slate-900 hover:text-sky-600 transition-colors cursor-pointer">
                      {item.title}
                    </h3>
                  </a>
                  
                  <p className="mb-4 text-sm text-slate-600">
                    {item.description}
                  </p>
                  
                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg px-4 py-2 text-sm font-semibold transition-colors bg-sky-600 text-white hover:bg-sky-700"
                    >
                      View Resource →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

