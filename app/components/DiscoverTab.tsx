"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Compass, Sparkles, Loader2 } from "lucide-react";
import { Article } from "../types";
import ArticleCard from "./ArticleCard";

interface DiscoverTabProps {
  articles: Article[];
  onRead: (article: Article) => void;
  onQuickSummary: (article: Article, e: React.MouseEvent<any>) => void;
  preferredGenre?: string | null;
  recommendedArticles?: Article[];
  assignedArticleIds?: string[];
}

export default function DiscoverTab({
  articles,
  onRead,
  onQuickSummary,
  preferredGenre = null,
  recommendedArticles = [],
  assignedArticleIds = [],
}: DiscoverTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [readingLists, setReadingLists] = useState<any[]>([]);

  const [apiResults, setApiResults] = useState<Article[]>([]);
  const [apiResultsQuery, setApiResultsQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categories = ["All", "Technology", "Environment", "Architecture", "Science", "International"];

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
      ...categories.filter((c) => c !== "All"),
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
      setSelectedCategory("All");
    }
  }, [searchQuery]);

  const triggerSearch = async () => {
    if (!searchQuery.trim()) return;
    setSelectedCategory("All");
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

    const matchesDept =
      selectedDept === "All" ||
      readingLists
        .filter((l) => l.department.toLowerCase() === selectedDept.toLowerCase())
        .flatMap((l) => l.articleIds)
        .includes(article.id);

    return matchesCategory && matchesDept;
  });

  const trendingArticles = articles.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24" id="discover-view">
      {/* Search & Department Selector */}
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
                      setSelectedCategory("All");
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
                    {categories.includes(sug) ? "Category" : "Topic"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none transition-all cursor-pointer"
        >
          <option value="All">All Departments</option>
          <option value="CSE">CSE Recommended</option>
          <option value="ECE">ECE Recommended</option>
          <option value="EEE">EEE Recommended</option>
          <option value="MECH">MECH Recommended</option>
          <option value="CIVIL">CIVIL Recommended</option>
          <option value="MBA">MBA Recommended</option>
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

      {/* Category chips */}
      <div className="mb-8 flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? "bg-indigo-700 border-indigo-700 text-white dark:bg-indigo-600 dark:border-indigo-600 dark:text-white shadow-xs"
                  : "bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

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
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-20 text-center">
            <Compass className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-250">No documents matched your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try clarifying keywords or adjusting selectors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredArticles.map((art) => (
              <ArticleCard
                key={art.id}
                article={art}
                onRead={onRead}
                onQuickSummary={onQuickSummary}
                isAssigned={assignedArticleIds.includes(art.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
