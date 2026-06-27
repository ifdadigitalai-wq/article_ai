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
  department: string;
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center md:text-left space-y-1 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <h2 className="text-2xl font-bold text-slate-855 dark:text-slate-150 tracking-tight flex items-center gap-2 justify-center md:justify-start">
          <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span>Faculty & Admin Dashboard</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Monitor platform metrics, user engagement levels, and popular syllabus resources.
        </p>
      </div>

      {/* Basic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Total Users Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              Total Registered Users
            </p>
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              {data.totalUsers}
            </h4>
            <p className="text-xs text-slate-450">Active on the DB</p>
          </div>
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Readers Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              Weekly Active Readers
            </p>
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              {data.activeUsers}
            </h4>
            <p className="text-xs text-slate-455 font-medium">
              {data.totalUsers > 0
                ? `${Math.round((data.activeUsers / data.totalUsers) * 100)}% engagement rate`
                : "0% engagement rate"}
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Daily Readings Overview (Visual Table bar) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Daily Completed Readings (Past 7 Days)
          </h3>
          <div className="space-y-3.5">
            {data.articlesReadPerDay.map((d) => {
              const widthPct = (d.count / maxReadCount) * 100;
              const dateObj = new Date(d.date);
              const dayLabel = dateObj.toLocaleDateString("en-US", {
                weekday: "short",
                month: "numeric",
                day: "numeric",
              });

              return (
                <div key={d.date} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-350">{dayLabel}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{d.count} reads</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-50 rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Syllabus Articles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Most Popular Articles (Top 5)
            </h3>
            {data.topArticles.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-550">
                No completions recorded to determine popularity.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
                {data.topArticles.map((art, idx) => (
                  <div
                    key={art.articleId}
                    className="flex items-start justify-between py-2 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {idx + 1}. {art.articleTitle}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">ID: {art.articleId}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg">
                      {art.reads} reads
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
