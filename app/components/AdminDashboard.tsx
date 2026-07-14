"use client";

import React, { useEffect, useState } from "react";
import { Users, BarChart3, TrendingUp, RefreshCw, AlertTriangle, Upload, CheckCircle2, AlertCircle, Sparkles, Check } from "lucide-react";

interface DailyRead {
  date: string;
  count: number;
}

interface TopArticle {
  articleId: string;
  articleTitle: string;
  reads: number;
}

interface AnalyticsData {
  articlesReadPerDay: DailyRead[];
  activeUsers: number;
  totalUsers: number;
  topArticles: TopArticle[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  branch: string;
  batch: string;
  role: string;
  avatar: string;
}

interface AdminDashboardProps {
  user?: UserProfile | null;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      } else {
        if (res.status === 403) {
          setError("Forbidden: Faculty or Admin access only.");
        } else {
          setError("Failed to fetch administrative analytics.");
        }
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading administrative dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 rounded-full inline-block">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Access Error</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  // Find max reads count to scale helper bar charts
  const maxReadCount = Math.max(...data.articlesReadPerDay.map((d) => d.count), 1);

  return (
    <div className="max-w-5xl mx-auto px-5 py-10 space-y-10 animate-fadeIn">

  {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-6">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
        <BarChart3 className="w-6 h-6 text-indigo-500" />
        Faculty & Admin Dashboard
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Monitor platform performance, engagement, and syllabus insights.
      </p>
    </div>

    <div className="text-xs text-slate-400">
      Last updated: {new Date().toLocaleString()}
    </div>
  </div>

  {/* Metrics Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

    {/* Total Users */}
    <div className="group relative p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition" />

      <div className="flex justify-between items-center relative z-10">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">
            Total Users
          </p>
          <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
            {data.totalUsers}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Registered in system
          </p>
        </div>

        <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
          <Users className="w-6 h-6" />
        </div>
      </div>
    </div>

    {/* Active Users */}
    <div className="group relative p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition" />

      <div className="flex justify-between items-center relative z-10">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">
            Active Readers
          </p>
          <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
            {data.activeUsers}
          </h4>
          <p className="text-xs text-emerald-500 font-medium mt-1">
            {data.totalUsers > 0
              ? `${Math.round((data.activeUsers / data.totalUsers) * 100)}% engagement`
              : "0% engagement"}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>
    </div>
  </div>

  {/* Charts + Articles */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

    {/* Daily Reads */}
    <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
      <h3 className="text-xs font-bold uppercase text-slate-500 mb-4">
        Daily Readings
      </h3>

      <div className="space-y-4">
        {data.articlesReadPerDay.map((d) => {
          const widthPct = (d.count / maxReadCount) * 100;
          const dateObj = new Date(d.date);

          return (
            <div key={d.date}>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">
                  {dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-indigo-500">
                  {d.count} reads
                </span>
              </div>

              <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Top Articles */}
    <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col">
      <h3 className="text-xs font-bold uppercase text-slate-500 mb-4">
        Top Articles
      </h3>

      {data.topArticles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
          No data available
        </div>
      ) : (
        <div className="space-y-3">
          {data.topArticles.map((art, idx) => (
            <div
              key={art.articleId}
              className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="max-w-[75%]">
                <p className="font-semibold text-slate-800 dark:text-white truncate">
                  #{idx + 1} {art.articleTitle}
                </p>
                <p className="text-xs text-slate-400">
                  {art.articleId}
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                {art.reads}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>

  </div>
</div>
  );
}
