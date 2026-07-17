"use client";

import React, { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  Trash2, 
  BookOpen, 
  RefreshCw, 
  ChevronRight, 
  BookMarked,
  Hourglass,
  Sparkles,
  History
} from "lucide-react";
import { motion } from "motion/react";

interface ReadingHistoryTabProps {
  onRead: (articleId: string) => void;
  onClearHistory: () => void;
}

interface HistoryEntry {
  id: string;
  articleId: string;
  articleTitle: string;
  readAt: string;
  timeSpentSeconds: number;
}

interface GroupedHistory {
  dateStr: string; // "Friday, July 17, 2026"
  formattedDay: string; // "Today", "Yesterday", "July 17"
  count: number;
  entries: HistoryEntry[];
}

export default function ReadingHistoryTab({ onRead, onClearHistory }: ReadingHistoryTabProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchDetailedHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reading-history?detailed=true");
      if (!res.ok) {
        throw new Error("Failed to load reading history.");
      }
      const data = await res.json();
      setHistory(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedHistory();
  }, []);

  const handleClearHistoryClick = async () => {
    if (!window.confirm("Are you sure you want to clear your entire reading history? This cannot be undone.")) {
      return;
    }

    setIsClearing(true);
    try {
      const res = await fetch("/api/reading-history", {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to clear reading history.");
      }
      setHistory([]);
      onClearHistory(); // sync parent state
    } catch (err: any) {
      alert(err.message || "Error clearing history.");
    } finally {
      setIsClearing(false);
    }
  };

  // Group history datewise
  const getGroupedHistory = (): GroupedHistory[] => {
    const groups: { [key: string]: HistoryEntry[] } = {};

    history.forEach((entry) => {
      const date = new Date(entry.readAt);
      const dateStr = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(entry);
    });

    const todayStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return Object.keys(groups).map((dateStr) => {
      let formattedDay = dateStr;
      if (dateStr === todayStr) {
        formattedDay = "Today";
      } else if (dateStr === yesterdayStr) {
        formattedDay = "Yesterday";
      }

      return {
        dateStr,
        formattedDay,
        count: groups[dateStr].length,
        entries: groups[dateStr],
      };
    });
  };

  const grouped = getGroupedHistory();

  // Statistics calculation
  const totalArticlesRead = new Set(history.map(h => h.articleId)).size;
  const totalMinutes = Math.round(history.reduce((acc, h) => acc + h.timeSpentSeconds, 0) / 60);
  const activeDays = grouped.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header section with Stats Card */}
      <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl px-6 py-6 md:px-8 md:py-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3 justify-center md:justify-start">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/30">
                  <History className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  My Reading History
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                Track your progress, revisit read articles, and view daily reading summaries.
              </p>
            </div>

            {history.length > 0 && (
              <div className="flex justify-center md:justify-end">
                <button
                  onClick={handleClearHistoryClick}
                  disabled={isClearing}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:text-white dark:text-rose-400 bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isClearing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Clear Reading History</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics Grid */}
          {history.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
              <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-xl p-3.5 text-center border border-slate-100 dark:border-slate-800/50 hover:scale-105 transition-all">
                <div className="flex items-center justify-center text-indigo-550 mb-1">
                  <BookMarked className="w-4 h-4" />
                </div>
                <div className="text-lg font-extrabold text-slate-800 dark:text-white">{totalArticlesRead}</div>
                <div className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Unique Read</div>
              </div>
              
              <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-xl p-3.5 text-center border border-slate-100 dark:border-slate-800/50 hover:scale-105 transition-all">
                <div className="flex items-center justify-center text-purple-550 mb-1">
                  <Hourglass className="w-4 h-4" />
                </div>
                <div className="text-lg font-extrabold text-slate-800 dark:text-white">{totalMinutes}m</div>
                <div className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Time Spent</div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-xl p-3.5 text-center border border-slate-100 dark:border-slate-800/50 hover:scale-105 transition-all">
                <div className="flex items-center justify-center text-pink-550 mb-1">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-lg font-extrabold text-slate-800 dark:text-white">{activeDays}</div>
                <div className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Days Active</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Retrieving reading records...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 text-slate-500">
          <p className="font-bold text-sm text-rose-600">Failed to load history</p>
          <p className="text-xs text-slate-450 mt-1">{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-8 text-slate-450 dark:text-slate-500">
          <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4 animate-pulse" />
          <p className="font-extrabold text-base text-slate-700 dark:text-slate-350">No reading history found</p>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-2 max-w-sm mx-auto">
            Articles you open from the dashboard or syllabus feed will appear here grouped by day.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group, gIdx) => (
            <div key={group.dateStr} className="space-y-4">
              
              {/* Date Header sticky line */}
              <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {group.formattedDay}
                  </span>
                  {group.formattedDay !== group.dateStr && (
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      ({group.dateStr})
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-extrabold tracking-wide uppercase px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow-sm">
                  {group.count} {group.count === 1 ? "article" : "articles"} read
                </span>
              </div>

              {/* Day Articles List */}
              <div className="grid grid-cols-1 gap-3 pl-2 border-l border-indigo-100 dark:border-indigo-900/40 ml-4 space-y-1">
                {group.entries.map((entry) => {
                  const entryTime = new Date(entry.readAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                  });

                  const timeSpentStr = entry.timeSpentSeconds > 0 
                    ? entry.timeSpentSeconds >= 60 
                      ? `${Math.round(entry.timeSpentSeconds / 60)} min read`
                      : `${entry.timeSpentSeconds}s read`
                    : "Just opened";

                  return (
                    <div
                      key={entry.id}
                      onClick={() => onRead(entry.articleId)}
                      className="group relative flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/50 hover:border-indigo-500/40 dark:border-slate-800/60 dark:hover:border-indigo-500/30 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-sm cursor-pointer select-none"
                    >
                      {/* Left: icon + content details */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="p-2.5 rounded-lg bg-indigo-50/50 group-hover:bg-indigo-500 dark:bg-indigo-950/20 dark:group-hover:bg-indigo-600 transition-colors">
                          <BookOpen className="w-4 h-4 text-indigo-650 dark:text-indigo-400 group-hover:text-white transition-colors" />
                        </div>
                        
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {entry.articleTitle}
                          </h4>
                          
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {entryTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                              <Hourglass className="w-3 h-3 text-purple-500" />
                              {timeSpentStr}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: action indicator */}
                      <div className="flex items-center text-slate-300 group-hover:text-indigo-500 dark:text-slate-700 dark:group-hover:text-indigo-400 transition-colors pl-2">
                        <span className="text-[10px] font-bold tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-opacity mr-1.5 hidden sm:inline">
                          Read Again
                        </span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
