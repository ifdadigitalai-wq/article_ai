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
import ProfilePage from "./components/ProfilePage";
import Leaderboard from "./components/Leaderboard";
import ReadingListTab from "./components/ReadingListTab";
import AdminDashboard from "./components/AdminDashboard";
import AdminDiscussions from "./components/AdminDiscussions";
import AdminStudents from "./components/AdminStudents";
import { RefreshCw } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  department: string;
  batch: string;
  role: string;
  avatar: string;
}

interface LibraryStats {
  minutesRead: number;
  articlesCompleted: number;
  streakDays: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [readHistory, setReadHistory] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>(ARTICLES);
  const [summarizingArticle, setSummarizingArticle] = useState<Article | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<LibraryStats>({ minutesRead: 0, articlesCompleted: 0, streakDays: 0 });
  const [readingLists, setReadingLists] = useState<any[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];

  // Fetch session user and database data on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        const resUser = await fetch("/api/auth/me");
        if (resUser.ok) {
          const userData = await resUser.json();
          setUser(userData);
          if (userData.role === "admin") {
            setActiveTab("admin");
          }
          
          // Load bookmarks, history, stats, lists from DB
          fetchBookmarks();
          fetchReadHistory();
          fetchLibraryStats();
          fetchReadingLists();
        } else {
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("Initialization error:", err);
        window.location.href = "/login";
      } finally {
        setIsLoadingSession(false);
      }
    };
    initApp();
  }, []);

  // Fetch dynamic articles on mount
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        if (typeof window !== "undefined" && !navigator.onLine) {
          throw new Error("Offline");
        }
        const res = await fetch("/api/articles");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setArticles(data);
            return;
          }
        }
        throw new Error("API failed");
      } catch (err) {
        console.log("Loading offline articles from cache...");
        try {
          if (typeof window !== "undefined" && "caches" in window) {
            const cache = await caches.open("offline-articles");
            const keys = await cache.keys();
            const cachedArticles: Article[] = [];
            for (const key of keys) {
              const cachedRes = await cache.match(key);
              if (cachedRes) {
                const art = await cachedRes.json();
                cachedArticles.push(art);
              }
            }
            if (cachedArticles.length > 0) {
              setArticles(cachedArticles);
            }
          }
        } catch (cacheErr) {
          console.error("Cache load failed:", cacheErr);
        }
      }
    };
    fetchArticles();

    if (typeof window !== "undefined") {
      window.addEventListener("offline", fetchArticles);
      window.addEventListener("online", fetchArticles);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("offline", fetchArticles);
        window.removeEventListener("online", fetchArticles);
      }
    };
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch("/api/user/saved");
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  const fetchReadHistory = async () => {
    try {
      const res = await fetch("/api/reading-history");
      if (res.ok) {
        const data = await res.json();
        setReadHistory(data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const fetchLibraryStats = async () => {
    try {
      const res = await fetch("/api/user/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          minutesRead: data.minutesRead,
          articlesCompleted: data.articlesCompleted,
          streakDays: data.streakDays,
        });
      }
    } catch (err) {
      console.error("Error fetching library stats:", err);
    }
  };

  const fetchReadingLists = async () => {
    try {
      const res = await fetch("/api/reading-lists");
      if (res.ok) {
        const data = await res.json();
        setReadingLists(data);
      }
    } catch (err) {
      console.error("Error fetching reading lists:", err);
    }
  };

  // Deep-link check on articles mount
  useEffect(() => {
    const fetchDeepLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get("article");
      if (articleId) {
        const match = articles.find((a) => a.id === articleId) || ARTICLES.find((a) => a.id === articleId);
        if (match) {
          setActiveArticle(match);
        } else {
          try {
            const res = await fetch(`/api/articles/${articleId}`);
            if (res.ok) {
              const data = await res.json();
              setActiveArticle(data);
            }
          } catch (err) {
            console.error("Error fetching deep link article:", err);
          }
        }
      }
    };
    fetchDeepLink();
  }, [articles]);

  const handleToggleSave = async (articleId: string) => {
    try {
      const art = articles.find((a) => a.id === articleId) || ARTICLES.find((a) => a.id === articleId);
      const res = await fetch("/api/user/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          articleTitle: art?.title || "Untitled",
          articleUrl: `/article?article=${articleId}`,
        }),
      });
      if (res.ok) {
        fetchBookmarks();
        fetchLibraryStats();
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  const handleRecordCompleted = async (articleId: string) => {
    try {
      const art = articles.find((a) => a.id === articleId) || ARTICLES.find((a) => a.id === articleId);
      const res = await fetch("/api/user/saved", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          completed: true,
          progressPercent: 100,
          articleTitle: art?.title || "Untitled",
        }),
      });
      if (res.ok) {
        fetchBookmarks();
        fetchLibraryStats();
      }
    } catch (err) {
      console.error("Error recording completed article:", err);
    }
  };

  const handleReadArticle = (article: Article) => {
    setActiveArticle(article);
    
    // Cache the read article for offline capabilities (max 10 articles)
    if (typeof window !== "undefined" && "caches" in window) {
      caches.open("offline-articles").then((cache) => {
        cache.put(
          `/api/offline-article/${article.id}`,
          new Response(JSON.stringify(article), {
            headers: { "Content-Type": "application/json" },
          })
        ).then(() => {
          cache.keys().then((keys) => {
            if (keys.length > 10) {
              const deleteCount = keys.length - 10;
              for (let i = 0; i < deleteCount; i++) {
                cache.delete(keys[i]);
              }
            }
          });
        });
      });
    }

    // Write start record to history
    fetch("/api/reading-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: article.id, articleTitle: article.title, timeSpentSeconds: 0 }),
    }).then(() => {
      fetchReadHistory();
      fetchLibraryStats();
    });
  };

  const handleQuickSummary = (article: Article, e: React.MouseEvent<any>) => {
    e.stopPropagation();
    setSummarizingArticle(article);
  };

  const handleSavedToggle = (article: Article, e: React.MouseEvent<any>) => {
    e.stopPropagation();
    handleToggleSave(article.id);
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch("/api/reading-history", { method: "DELETE" });
      if (res.ok) {
        setReadHistory([]);
        fetchLibraryStats();
      }
    } catch (err) {
      console.error("Error clearing history:", err);
    }
  };

  const completedIds = bookmarks.filter((b) => b.completed).map((b) => b.articleId);
  const savedIds = bookmarks.map((b) => b.articleId);

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
    let list = articles.filter(
      (a) => a.category.toLowerCase() === genre.toLowerCase() && !readHistory.includes(a.id)
    );
    if (list.length === 0) {
      list = articles.filter((a) => a.category.toLowerCase() === genre.toLowerCase());
    }
    return list.slice(0, 3);
  };

  const recommendedArticles = preferredGenre ? getRecommendedArticles(preferredGenre) : [];

  const filteredArticles =
    selectedCategory === "All"
      ? articles
      : articles.filter((a) => a.category.toLowerCase() === selectedCategory.toLowerCase());

  // Extract assigned articles for the student's department
  const assignedArticleIds = user
    ? readingLists
        .filter((l) => l.department.toLowerCase() === user.department.toLowerCase())
        .flatMap((l) => l.articleIds)
    : [];

  if (isLoadingSession) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold">Validating session credentials...</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full md:flex-row flex-col bg-paper dark:bg-slate-950 overflow-hidden text-charcoal dark:text-slate-100">
      {activeArticle ? (
        <ArticleView
          article={activeArticle}
          onBack={() => {
            setActiveArticle(null);
            window.history.replaceState({}, "", window.location.pathname);
            fetchReadHistory();
            fetchLibraryStats();
          }}
          isSaved={bookmarks.some((b) => b.articleId === activeArticle.id)}
          onToggleSave={() => handleToggleSave(activeArticle.id)}
          onRecordCompleted={handleRecordCompleted}
          user={user}
        />
      ) : (
        <>
          <NavigationSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stats={stats}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onClearHistory={handleClearHistory}
            isPersistent={true}
            user={user}
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Header
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              userRole={user?.role}
            />
            <main className="flex-1 overflow-y-auto pb-20 md:pb-6 bg-slate-50/30 dark:bg-slate-950/20">
              {activeTab === "home" && (
                <DiscoverTab
                  articles={filteredArticles}
                  onRead={handleReadArticle}
                  onQuickSummary={handleQuickSummary}
                  preferredGenre={preferredGenre}
                  recommendedArticles={recommendedArticles}
                  assignedArticleIds={assignedArticleIds}
                />
              )}
              {activeTab === "discover" && (
                <DiscoverTab
                  articles={articles}
                  onRead={handleReadArticle}
                  onQuickSummary={handleQuickSummary}
                  preferredGenre={preferredGenre}
                  recommendedArticles={recommendedArticles}
                  assignedArticleIds={assignedArticleIds}
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
              {activeTab === "profile" && <ProfilePage />}
              {activeTab === "leaderboard" && <Leaderboard />}
              {activeTab === "reading-lists" && (
                <ReadingListTab
                  articles={articles}
                  onRead={handleReadArticle}
                  userRole={user?.role || "student"}
                  userDepartment={user?.department || "CSE"}
                />
              )}
              {activeTab === "admin" && <AdminDashboard user={user} />}
              {activeTab === "students" && <AdminStudents />}
              {activeTab === "discussions" && (
                <AdminDiscussions
                  onSelectArticle={(articleId) => {
                    const match = articles.find((a) => a.id === articleId) || ARTICLES.find((a) => a.id === articleId);
                    if (match) {
                      setActiveArticle(match);
                    } else {
                      fetch(`/api/articles/${articleId}`).then((res) => {
                        if (res.ok) {
                          res.json().then((art) => setActiveArticle(art));
                        }
                      });
                    }
                  }}
                />
              )}

              {activeTab === "home" && <Newsletter />}
            </main>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} userRole={user?.role} />
          </div>
        </>
      )}

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
            user={user}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {summarizingArticle && (
          <SummaryModal article={summarizingArticle} onClose={() => setSummarizingArticle(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}