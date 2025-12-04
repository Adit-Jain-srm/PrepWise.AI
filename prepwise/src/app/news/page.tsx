"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { authenticatedFetch, handleApiResponse } from "@/lib/utils/api";
import { MBANewsItem } from "@/lib/types/user";

export default function NewsPage() {
  const [news, setNews] = useState<MBANewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "admissions", "career", "schools", "trends"];

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const url = selectedCategory === "all" 
          ? "/api/news" 
          : `/api/news?category=${selectedCategory}`;
        
        const response = await authenticatedFetch(url);
        const data = await handleApiResponse<{ news: MBANewsItem[] }>(response);
        setNews(data.news);
      } catch (error) {
        console.error("Error fetching news:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, [selectedCategory]);

  const filteredNews =
    selectedCategory === "all"
      ? news
      : news.filter((item) => item.category === selectedCategory);

  const featuredNews = filteredNews.filter((item) => item.isFeatured);
  const regularNews = filteredNews.filter((item) => !item.isFeatured);

  const formatDate = (dateString: string | undefined): string => {
    // Handle undefined or invalid date strings
    if (!dateString) {
      return "Date unknown";
    }

    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Date unknown";
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navigation />
      
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            MBA News & Updates
          </h1>
          <p className="text-slate-600">
            Stay updated with the latest news, trends, and insights from the MBA world.
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
                  ? "All News"
                  : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-8">
              {featuredNews.length > 0 && (
                <section>
                  <h2 className="mb-4 text-2xl font-bold text-slate-900">Featured</h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {featuredNews.map((item) => (
                      <article
                        key={item.id}
                        className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-sky-300 hover:shadow-md transition-all"
                      >
                        {item.imageUrl && (
                          <div className="h-48 w-full bg-slate-200" />
                        )}
                        <div className="p-6">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                              Featured
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDate(item.publishedAt)}
                            </span>
                          </div>
                          <a 
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <h3 className="mb-2 text-xl font-semibold text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer">
                              {item.title}
                            </h3>
                          </a>
                          {item.summary && (
                            <p className="mb-4 text-sm text-slate-600">
                              {item.summary}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            {item.sourceName && (
                              <span className="text-xs text-slate-500">
                                Source: {item.sourceName}
                              </span>
                            )}
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-sky-600 hover:text-sky-700"
                            >
                              Read Full Article →
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {regularNews.length > 0 && (
                <section>
                  <h2 className="mb-4 text-2xl font-bold text-slate-900">Latest News</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {regularNews.map((item) => (
                      <article
                        key={item.id}
                        className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-sky-300 hover:shadow-md transition-all"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 capitalize">
                            {item.category}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(item.publishedAt)}
                          </span>
                        </div>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <h3 className="mb-2 text-lg font-semibold text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer">
                            {item.title}
                          </h3>
                        </a>
                        {item.summary && (
                          <p className="mb-4 text-sm text-slate-600 line-clamp-3">
                            {item.summary}
                          </p>
                        )}
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-sky-600 hover:text-sky-700"
                        >
                          Read Full Article →
                        </a>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {filteredNews.length === 0 && !loading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <div className="mb-4 text-6xl">📰</div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    No news found
                  </h3>
                  <p className="text-sm text-slate-600">
                    Check back later for the latest MBA news and updates.
                  </p>
                </div>
              )}
            </div>
          )}
      </main>
    </div>
  );
}

