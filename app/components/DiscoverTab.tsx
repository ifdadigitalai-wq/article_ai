"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Search, Compass, Sparkles, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Article } from "../types";
import ArticleCard from "./ArticleCard";
import { getAvailableCategories } from "../lib/categories";

interface DiscoverTabProps {
  articles: Article[];
  onRead: (article: Article) => void;
  onQuickSummary: (article: Article, e: React.MouseEvent<any>) => void;
  preferredGenre?: string | null;
  recommendedArticles?: Article[];
  assignedArticleIds?: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function DiscoverTab({
  articles,
  onRead,
  onQuickSummary,
  preferredGenre = null,
  recommendedArticles = [],
  assignedArticleIds = [],
  selectedCategory,
  onSelectCategory,
}: DiscoverTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [readingLists, setReadingLists] = useState<any[]>([]);

  // Get dynamic categories from articles data
  const categories = ["All", ...getAvailableCategories()];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll, { passive: true });
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const [apiResults, setApiResults] = useState<Article[]>([]);
  const [apiResultsQuery, setApiResultsQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);



  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch("/api/reading-lists");
        if (res.ok) {
          const data = await res.json();
          setReadingLists(data);
        }
      } catch (err) {
        console.error("Failed to load reading lists in DiscoverTab:", err);
      }
    };
    fetchLists();
  }, []);

  const suggestionPool = Array.from(
    new Set([
      ...getAvailableCategories(),
      ...(articles || []).map((a) => a.title),
      ...(articles || []).map((a) => a.category),
      "Quantum Computing",
      "Deep Sea Discoveries",
      "The Library of Alexandria",
      "Voyager Space Probes",
      "Artificial Intelligence",
      "Climate Change",
    ])
  ).filter(Boolean);

  const activeSuggestions =
    searchQuery.trim().length > 0
      ? suggestionPool
          .filter(
            (item) =>
              item.toLowerCase().includes(searchQuery.toLowerCase()) &&
              item.toLowerCase() !== searchQuery.toLowerCase()
          )
          .slice(0, 5)
      : [];

  useEffect(() => {
    if (searchQuery.trim()) {
      onSelectCategory("All");
    }
  }, [searchQuery]);

  const triggerSearch = async () => {
    if (!searchQuery.trim()) return;
    onSelectCategory("All");
    setIsSearching(true);
    try {
      const res = await fetch(`/api/articles?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setApiResults(data);
        setApiResultsQuery(searchQuery);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setApiResults([]);
      setApiResultsQuery("");
      return;
    }

    if (apiResultsQuery === searchQuery) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    let active = true;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/articles?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok && active) {
          const data = await res.json();
          setApiResults(data);
          setApiResultsQuery(searchQuery);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery]);

  let baseArticles: Article[] = [];
  if (!searchQuery.trim()) {
    baseArticles = articles || [];
  } else {
    if (apiResultsQuery === searchQuery) {
      baseArticles = apiResults;
    } else {
      const query = searchQuery.toLowerCase();
      baseArticles = (articles || []).filter((article) => {
        if (!article) return false;
        const title = (article.title || "").toLowerCase();
        const subtitle = (article.subtitle || "").toLowerCase();
        const content = (article.content || "").toLowerCase();
        return title.includes(query) || subtitle.includes(query) || content.includes(query);
      });
    }
  }

  const filteredArticles = baseArticles.filter((article) => {
    if (!article || !article.category) return false;

    const matchesCategory =
      selectedCategory === "All" || article.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesBranch =
      selectedBranch === "All" ||
      readingLists
        .filter((l) => l.branch.toLowerCase() === selectedBranch.toLowerCase())
        .flatMap((l) => l.articleIds)
        .includes(article.id);

    return matchesCategory && matchesBranch;
  });

  const trendingArticles = articles.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24" id="discover-view">
      {/* Search & Branch Selector */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          triggerSearch();
        }}
        className="relative mb-8 flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search global archives, topics, analysts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 pl-12 pr-12 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            id="search-input"
            autoComplete="off"
          />
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          {isSearching && (
            <Loader2 className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-indigo-500 animate-spin" />
          )}

          {showSuggestions && activeSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-slate-200/40 bg-white dark:bg-slate-900 shadow-lg overflow-hidden py-1">
              {activeSuggestions.map((sug) => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => {
                    setSearchQuery(sug);
                    const searchImmediate = async () => {
                      onSelectCategory("All");
                      setIsSearching(true);
                      try {
                        const res = await fetch(`/api/articles?q=${encodeURIComponent(sug)}`);
                        if (res.ok) {
                          const data = await res.json();
                          setApiResults(data);
                          setApiResultsQuery(sug);
                        }
                      } catch (err) {
                        console.error("Search failed:", err);
                      } finally {
                        setIsSearching(false);
                      }
                    };
                    searchImmediate();
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-200"
                >
                  <span className="font-semibold">{sug}</span>
                  <span className="text-[9px] uppercase tracking-wider opacity-60 font-bold">
                    {getAvailableCategories().includes(sug) ? "Category" : "Topic"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none transition-all cursor-pointer"
        >
          <option value="All">All Branches</option>
          <option value="Kalkalji">Kalkalji Branch</option>
          <option value="Badarpur">Badarpur Branch</option>
        </select>

        <button
          type="submit"
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </button>
      </form>

      {/* Recommended For You */}
      {preferredGenre && recommendedArticles.length > 0 && (
        <section className="mb-12 rounded-2xl border border-indigo-200/55 dark:border-indigo-950/60 bg-indigo-50/20 dark:bg-indigo-950/10 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-indigo-100/50 dark:border-indigo-900/20 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white">Recommended For You</h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-100/50 dark:bg-indigo-950/30 px-2.5 py-0.5 rounded-full">
              Based on interest in {preferredGenre}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedArticles.map((art) => (
              <motion.div
                key={art.id}
                onClick={() => onRead(art)}
                whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 cursor-pointer hover:border-indigo-150 dark:hover:border-indigo-900 flex flex-col justify-between group h-full"
              >
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {art.category}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-slate-850 dark:text-slate-250 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {art.title}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase mt-3">
                  {art.readTime} read
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}


      {/* Results feed */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {searchQuery ? `Results for "${searchQuery}"` : "Explore curated publications"}
          </h3>
          {isSearching && <Loader2 className="h-4 w-4 text-indigo-500 animate-spin ml-1" />}
        </div>

{filteredArticles.length === 0 ? (
  <div className="relative rounded-3xl border border-dashed border-slate-200/70 dark:border-slate-800/80 py-20 px-6 text-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">

    {/* Glow Background */}
    <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
      <div className="w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full"></div>
    </div>

    {/* Icon */}
    <div className="relative z-10 flex flex-col items-center">
      <div className="p-4 rounded-full bg-indigo-50 dark:bg-slate-800 shadow-inner mb-4">
        <Compass className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
      </div>

      {/* Text */}
      <p className="text-base font-semibold text-slate-800 dark:text-white">
        No documents found
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
        Try changing filters, keywords or explore other categories to find what you need.
      </p>

      {/* CTA Button */}
      <button
        onClick={() => onSelectCategory("All")}
        className="mt-5 px-4 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow hover:scale-105 transition"
      >
        Reset Filters
      </button>
    </div>
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {filteredArticles.map((art) => (
      <div
        key={art.id}
        className="group relative transition-transform duration-300 hover:-translate-y-1"
      >
        {/* Card Glow */}
        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 rounded-2xl blur-xl transition"></div>

        <ArticleCard
          article={art}
          onRead={onRead}
          onQuickSummary={onQuickSummary}
          isAssigned={assignedArticleIds.includes(art.id)}
        />
      </div>
    ))}
  </div>
)}

      </div>
    </div>
  );
}
