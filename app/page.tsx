"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { ARTICLES } from "./data/articles";
import { BookmarkRecord, Article } from "./types";
import Header from "./components/Header";
import BottomNav, { TabId } from "./components/BottomNav";
import DiscoverTab from "./components/DiscoverTab";
import LibraryTab from "./components/LibraryTab";
import SavedTab from "./components/SavedTab";
import ArticleView from "./components/ArticleView";
import AudioDigest from "./components/AudioDigest";
import Newsletter from "./components/Newsletter";
import NavigationSidebar from "./components/NavigationSidebar";
import SummaryModal from "./components/SummaryModal";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [readHistory, setReadHistory] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>(ARTICLES);
  const [summarizingArticle, setSummarizingArticle] = useState<Article | null>(null);

  // Categories derived from articles
  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];

  // Fetch dynamic articles on mount
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setArticles(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live articles, falling back to local archives", err);
      }
    };
    fetchArticles();
  }, []);

  // LocalStorage sync
  useEffect(() => {
    const stored = localStorage.getItem("editorial_bookmarks");
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored));
      } catch {}
    }
    const storedHistory = localStorage.getItem("editorial_history");
    if (storedHistory) {
      try {
        setReadHistory(JSON.parse(storedHistory));
      } catch {}
    }
  }, []);

  const saveToLocalStorage = (newBookmarks: BookmarkRecord[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem("editorial_bookmarks", JSON.stringify(newBookmarks));
  };

  const saveHistoryToLocalStorage = (newHistory: string[]) => {
    setReadHistory(newHistory);
    localStorage.setItem("editorial_history", JSON.stringify(newHistory));
  };

  // Check URL parameters on mount to deep-link straight to an article
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get("article");
    if (articleId) {
      const match = articles.find((a) => a.id === articleId) || ARTICLES.find((a) => a.id === articleId);
      if (match) {
        setActiveArticle(match);
      }
    }
  }, [articles]);

  const handleToggleSave = (articleId: string) => {
    const existing = bookmarks.find((b) => b.articleId === articleId);
    let updated: BookmarkRecord[];
    if (existing) {
      updated = bookmarks.filter((b) => b.articleId !== articleId);
    } else {
      updated = [
        ...bookmarks,
        {
          id: `b_${Date.now()}`,
          articleId,
          bookmarkedAt: new Date().toISOString(),
          completed: false,
          progressPercent: 0,
          lastReadAt: new Date().toISOString(),
        },
      ];
    }
    saveToLocalStorage(updated);
  };

  const handleRecordCompleted = (articleId: string) => {
    const updated = bookmarks.map((b) => {
      if (b.articleId === articleId) {
        return { ...b, completed: true, progressPercent: 100, lastReadAt: new Date().toISOString() };
      }
      return b;
    });
    // If not bookmarked, create a progress tracker
    const exists = bookmarks.some((b) => b.articleId === articleId);
    if (!exists) {
      updated.push({
        id: `b_${Date.now()}`,
        articleId,
        bookmarkedAt: new Date().toISOString(),
        completed: true,
        progressPercent: 100,
        lastReadAt: new Date().toISOString(),
      });
    }
    saveToLocalStorage(updated);
  };

  // When user opens an article, record it in history
  const handleReadArticle = (article: Article) => {
    setActiveArticle(article);
    if (!readHistory.includes(article.id)) {
      const updated = [article.id, ...readHistory];
      saveHistoryToLocalStorage(updated);
    }
  };

  // Quick summary handler (passed to DiscoverTab and SavedTab)
  const handleQuickSummary = (article: Article, e: React.MouseEvent<any>) => {
    e.stopPropagation();
    setSummarizingArticle(article);
  };

  // SavedTab toggle handler (needs Article + event signature)
  const handleSavedToggle = (article: Article, e: React.MouseEvent<any>) => {
    e.stopPropagation();
    handleToggleSave(article.id);
  };

  const handleClearHistory = () => {
    saveHistoryToLocalStorage([]);
  };

  // Compute library stats
  const completedIds = bookmarks.filter((b) => b.completed).map((b) => b.articleId);
  const savedIds = bookmarks.map((b) => b.articleId);
  const stats = {
    minutesRead: readHistory.reduce((total, id) => {
      const art = articles.find((a) => a.id === id) || ARTICLES.find((a) => a.id === id);
      if (art) {
        const mins = parseInt(art.readTime) || 5;
        return total + mins;
      }
      return total;
    }, 0),
    articlesCompleted: completedIds.length,
    streakDays: Math.min(readHistory.length, 7),
  };

  // Filter articles by category for the home/discover view
  const filteredArticles =
    selectedCategory === "All"
      ? articles
      : articles.filter((a) => a.category.toLowerCase() === selectedCategory.toLowerCase());

  // Genre (category) recommendation algorithm
  const getPreferredGenre = () => {
    if (readHistory.length === 0) return null;
    const counts: Record<string, number> = {};
    readHistory.forEach((id) => {
      const art = articles.find((a) => a.id === id) || ARTICLES.find((a) => a.id === id);
      if (art) {
        counts[art.category] = (counts[art.category] || 0) + 1;
      }
    });

    let maxCount = 0;
    let topGenre: string | null = null;
    Object.entries(counts).forEach(([genre, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topGenre = genre;
      }
    });
    return topGenre;
  };

  const preferredGenre = getPreferredGenre();

  const getRecommendedArticles = (genre: string) => {
    // Try to suggest unread articles of this category first
    let list = articles.filter(
      (a) => a.category.toLowerCase() === genre.toLowerCase() && !readHistory.includes(a.id)
    );
    // If they read all of them, fall back to showing all in that category
    if (list.length === 0) {
      list = articles.filter((a) => a.category.toLowerCase() === genre.toLowerCase());
    }
    return list.slice(0, 3);
  };

  const recommendedArticles = preferredGenre ? getRecommendedArticles(preferredGenre) : [];

  return (
    <div className="relative flex h-screen w-full md:flex-row flex-col bg-paper overflow-hidden text-charcoal">
      {activeArticle ? (
        <ArticleView
          article={activeArticle}
          onBack={() => {
            setActiveArticle(null);
            // Clean up share URL parameter
            window.history.replaceState({}, "", window.location.pathname);
          }}
          isSaved={bookmarks.some((b) => b.articleId === activeArticle.id)}
          onToggleSave={() => handleToggleSave(activeArticle.id)}
          onRecordCompleted={handleRecordCompleted}
        />
      ) : (
        <>
          {/* Persistent Sidebar on Desktop - visible only on md and larger */}
          <NavigationSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stats={stats}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onClearHistory={handleClearHistory}
            isPersistent={true}
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Header
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
            <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
              {activeTab === "home" && (
                <DiscoverTab
                  articles={filteredArticles}
                  onRead={handleReadArticle}
                  onQuickSummary={handleQuickSummary}
                  preferredGenre={preferredGenre}
                  recommendedArticles={recommendedArticles}
                />
              )}
              {activeTab === "discover" && (
                <DiscoverTab
                  articles={articles}
                  onRead={handleReadArticle}
                  onQuickSummary={handleQuickSummary}
                  preferredGenre={preferredGenre}
                  recommendedArticles={recommendedArticles}
                />
              )}
              {activeTab === "library" && (
                <LibraryTab
                  articles={articles}
                  historyIds={readHistory}
                  completedIds={completedIds}
                  stats={stats}
                  onRead={handleReadArticle}
                  onClearHistory={handleClearHistory}
                />
              )}
              {activeTab === "saved" && (
                <SavedTab
                  articles={articles}
                  savedIds={savedIds}
                  onRead={handleReadArticle}
                  onQuickSummary={handleQuickSummary}
                  onToggleSave={handleSavedToggle}
                />
              )}
              {activeTab === "digests" && (
                <AudioDigest 
                  userInterests={["World", "Tech", "Science"]} 
                  preferredGenre={preferredGenre}
                />
              )}

              {/* Newsletter shown on home tab */}
              {activeTab === "home" && <Newsletter />}
            </main>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </>
      )}

      {/* Global Navigation Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <NavigationSidebar
            onClose={() => setIsSidebarOpen(false)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stats={stats}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onClearHistory={handleClearHistory}
            isPersistent={false}
          />
        )}
      </AnimatePresence>

      {/* Quick Summary Modal from Feed */}
      <AnimatePresence>
        {summarizingArticle && (
          <SummaryModal
            article={summarizingArticle}
            onClose={() => setSummarizingArticle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}