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
  <div className="
    max-w-6xl mx-auto 
    px-4 sm:px-6 lg:px-8 
    py-6 sm:py-8 
    space-y-6 sm:space-y-8
    animate-fadeIn
  ">

    {/* Header */}
    <div className="
      text-center md:text-left space-y-2 
      border-b border-slate-200/50 dark:border-slate-800/60 
      pb-4 sm:pb-6
    ">
      <h2 className="
        text-xl sm:text-2xl md:text-3xl 
        font-bold tracking-tight 
        flex items-center gap-2 justify-center md:justify-start
        text-slate-900 dark:text-white
      ">
        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
        <span>Faculty & Admin Dashboard</span>
      </h2>

      <p className="
        text-xs sm:text-sm 
        text-slate-500 dark:text-slate-400 
        max-w-xl mx-auto md:mx-0
      ">
        Monitor platform metrics, engagement levels, and popular resources.
      </p>
    </div>

    {/* Metrics */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

      {/* Total Users */}
      <div className="
        p-4 sm:p-5 
        bg-white dark:bg-slate-900
        border border-slate-200/60 dark:border-slate-800/80
        rounded-xl sm:rounded-2xl
        shadow-sm
        flex items-center justify-between
      ">
        <div className="space-y-1">
          <p className="text-[10px] sm:text-xs font-semibold uppercase text-slate-500">
            Total Users
          </p>

          <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {data.totalUsers}
          </h4>

          <p className="text-[10px] sm:text-xs text-slate-400">
            Registered users
          </p>
        </div>

        <div className="
          p-2.5 sm:p-3.5 
          bg-indigo-100 dark:bg-indigo-950/40
          text-indigo-600 dark:text-indigo-400
          rounded-lg sm:rounded-xl
        ">
          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Active Users */}
      <div className="
        p-4 sm:p-5 
        bg-white dark:bg-slate-900
        border border-slate-200/60 dark:border-slate-800/80
        rounded-xl sm:rounded-2xl
        shadow-sm
        flex items-center justify-between
      ">
        <div className="space-y-1">
          <p className="text-[10px] sm:text-xs font-semibold uppercase text-slate-500">
            Active Readers
          </p>

          <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {data.activeUsers}
          </h4>

          <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {data.totalUsers > 0
              ? `${Math.round((data.activeUsers / data.totalUsers) * 100)}% engagement`
              : "0% engagement"}
          </p>
        </div>

        <div className="
          p-2.5 sm:p-3.5 
          bg-emerald-100 dark:bg-emerald-950/40
          text-emerald-600 dark:text-emerald-400
          rounded-lg sm:rounded-xl
        ">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>

    {/* Charts + Articles */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

      {/* Reading Activity */}
      <div className="
        bg-white dark:bg-slate-900
        border border-slate-200/60 dark:border-slate-800/80
        rounded-xl sm:rounded-2xl
        p-4 sm:p-5
        shadow-sm
      ">
        <h3 className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 mb-4">
          Reading Activity (7 Days)
        </h3>

        <div className="space-y-3">
          {data.articlesReadPerDay.map((d) => {
            const widthPct = (d.count / maxReadCount) * 100;
            const dateObj = new Date(d.date);

            const dayLabel = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
            });

            return (
              <div key={d.date} className="space-y-1">
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    {dayLabel}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {d.count}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Articles */}
      <div className="
        bg-white dark:bg-slate-900
        border border-slate-200/60 dark:border-slate-800/80
        rounded-xl sm:rounded-2xl
        p-4 sm:p-5
        shadow-sm
      ">
        <h3 className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 mb-4">
          Top Articles
        </h3>

        {data.topArticles.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No data available
          </div>
        ) : (
          <div className="space-y-3">
            {data.topArticles.map((art, idx) => (
              <div
                key={art.articleId}
                className="
                  flex justify-between items-start gap-3
                  p-2 sm:p-3
                  rounded-lg
                  hover:bg-slate-100/50 dark:hover:bg-slate-800/50
                "
              >
                <div className="max-w-[70%]">
                  <p className="text-xs sm:text-sm font-semibold truncate">
                    {idx + 1}. {art.articleTitle}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    ID: {art.articleId}
                  </p>
                </div>

                <span className="
                  text-[10px] sm:text-xs font-bold
                  px-2 py-1 rounded-md
                  bg-indigo-100 dark:bg-indigo-950/40
                  text-indigo-600 dark:text-indigo-400
                  whitespace-nowrap
                ">
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
