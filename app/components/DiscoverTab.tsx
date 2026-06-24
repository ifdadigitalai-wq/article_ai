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
}

export default function DiscoverTab({
  articles,
  onRead,
  onQuickSummary,
  preferredGenre = null,
  recommendedArticles = []
}: DiscoverTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // API search states
  const [apiResults, setApiResults] = useState<Article[]>([]);
  const [apiResultsQuery, setApiResultsQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categories = ["All", "Technology", "Environment", "Architecture", "Science", "International"];

  // Suggestion pool generated from categories and articles
  const suggestionPool = Array.from(new Set([
    ...categories.filter(c => c !== "All"),
    ...(articles || []).map(a => a.title),
    ...(articles || []).map(a => a.category),
    "Quantum Computing",
    "Deep Sea Discoveries",
    "The Library of Alexandria",
    "Voyager Space Probes",
    "Artificial Intelligence",
    "Climate Change"
  ])).filter(Boolean);

  const activeSuggestions = searchQuery.trim().length > 0
    ? suggestionPool
        .filter(item => 
          item.toLowerCase().includes(searchQuery.toLowerCase()) && 
          item.toLowerCase() !== searchQuery.toLowerCase()
        )
        .slice(0, 5)
    : [];

  // Auto-reset category to "All" when user searches to prevent filtering out results
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

  // Debounced API fetch for global matching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setApiResults([]);
      setApiResultsQuery("");
      return;
    }

    // Skip if we already fetched for this query
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

  // Determine what base list of articles to use
  let baseArticles: Article[] = [];
  if (!searchQuery.trim()) {
    baseArticles = articles || [];
  } else {
    // If the API results are for the current search query, use them.
    // Otherwise, show the instant local matches.
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

  // Filter based on selectedCategory
  const filteredArticles = baseArticles.filter((article) => {
    if (!article || !article.category) return false;
    const matchesCategory =
      selectedCategory === "All" ||
      article.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesCategory;
  });

  // Trending articles mapped to design
  const trendingArticles = articles.slice(0, 3); // Grab some for list

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24" id="discover-view">
      {/* 1. Styled Search Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          triggerSearch();
        }}
        className="relative mb-8 flex gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search global archives, topics, analysts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full rounded-2xl border border-border-outline/30 bg-white py-4 pl-12 pr-12 text-sm shadow-sm transition-all focus:border-[#d44d2e] focus:outline-none focus:ring-1 focus:ring-[#d44d2e]/15"
            id="search-input"
            autoComplete="off"
          />
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-secondary-gray pointer-events-none" />
          {isSearching && (
            <Loader2 className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-[#d44d2e] animate-spin" />
          )}

          {/* Floating Auto-suggestions Dropdown */}
          {showSuggestions && activeSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2.5 z-50 rounded-xl border border-border-outline/10 bg-[#fcfaf7] shadow-lg overflow-hidden py-1 animate-fade-in">
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
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-[#d44d2e] hover:text-white transition-colors cursor-pointer flex items-center justify-between text-charcoal font-sans"
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
        <button
          type="submit"
          className="rounded-2xl bg-charcoal px-6 py-4 text-xs font-bold text-white hover:bg-[#d44d2e] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </button>
      </form>

      {/* 1.5. Recommended For You (Personalization section) */}
      {preferredGenre && recommendedArticles.length > 0 && (
        <section className="mb-12 rounded-2xl border border-primary/25 bg-primary/2 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-primary/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <h3 className="font-serif text-lg font-bold text-charcoal">Recommended For You</h3>
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
              Based on your interest in {preferredGenre}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedArticles.map((art) => (
              <motion.div
                key={art.id}
                onClick={() => onRead(art)}
                whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                className="flex flex-col bg-white border border-border-outline/10 p-4 rounded-xl cursor-pointer transition-all"
              >
                <span className="text-[8px] font-bold text-primary uppercase tracking-wider self-start bg-primary/5 px-2 py-0.5 rounded mb-2">
                  {art.category}
                </span>
                <h4 className="font-serif text-sm font-bold text-charcoal leading-snug line-clamp-2 mb-2 hover:text-primary transition-colors">
                  {art.title}
                </h4>
                <p className="text-[10px] text-secondary-gray mt-auto">
                  {art.readTime} • {art.date}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Trending Now Section (Literal matching to screenshot design) */}
      <section className="mb-12 rounded-2xl border border-border-outline/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-outline/10 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="font-serif text-lg font-bold text-charcoal">Trending Now</h3>
          </div>
          <span className="text-xs font-semibold text-secondary-gray font-mono">01 — 03</span>
        </div>

        <div className="space-y-6">
          {trendingArticles.map((art, idx) => {
            const indexStr = `0${idx + 1}`;
            return (
              <motion.div
                key={art.id}
                onClick={() => onRead(art)}
                className="flex gap-4 items-start group cursor-pointer border-b border-border-outline/5 pb-4 last:border-none last:pb-0"
                whileHover={{ x: 4 }}
              >
                <span className="font-serif text-4xl font-extrabold text-border-outline/30 select-none tracking-tight leading-none">
                  {indexStr}
                </span>
                <div className="flex-1">
                  <h4 className="font-serif text-base font-bold text-charcoal leading-snug group-hover:text-primary transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-xs text-secondary-gray mt-1.5 font-semibold tracking-wide">
                    {art.readTime} • {art.category}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. Filter category chips inside discover tab */}
      <div className="mb-8 flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-border-outline/20 text-secondary-gray hover:bg-black/2"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 4. Results feed */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">
            {searchQuery ? `Results for "${searchQuery}"` : "Explore curated releases"}
          </h3>
          {isSearching && (
            <Loader2 className="h-4 w-4 text-primary animate-spin ml-1" />
          )}
        </div>

        {filteredArticles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-outline/40 py-20 text-center">
            <Compass className="h-10 w-10 text-border-outline/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-charcoal">No documents matched your filter</p>
            <p className="text-xs text-secondary-gray mt-1">Try clarifying keywords or adjusting filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredArticles.map((art) => (
              <ArticleCard
                key={art.id}
                article={art}
                onRead={onRead}
                onQuickSummary={onQuickSummary}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
