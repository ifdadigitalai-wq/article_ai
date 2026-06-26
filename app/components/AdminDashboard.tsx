"use client";

import React, { useEffect, useState } from "react";
import { Users, BarChart3, TrendingUp, RefreshCw, AlertTriangle, Upload, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

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

  // Form State for Manual Article Upload
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formCategory, setFormCategory] = useState("Technology");
  const [customCategory, setCustomCategory] = useState("");
  const [formSnippet, setFormSnippet] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImageAlt, setFormImageAlt] = useState("");
  const [formReadTime, setFormReadTime] = useState("");
  const [formAuthorName, setFormAuthorName] = useState("");
  const [formAuthorRole, setFormAuthorRole] = useState("");
  const [formAuthorAvatar, setFormAuthorAvatar] = useState("scholar");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // AI Generator Form State
  const [aiTopicContext, setAiTopicContext] = useState("");
  const [aiLineCount, setAiLineCount] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const handleAiGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!aiTopicContext.trim()) {
      setGenerationError("Please enter a topic context for the AI.");
      return;
    }
    if (aiLineCount <= 0) {
      setGenerationError("Please enter a valid line count greater than 0.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);

    try {
      const res = await fetch("/api/admin/generate-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topicContext: aiTopicContext.trim(),
          lineCount: aiLineCount
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate article fields using AI.");
      }

      const generated = await res.json();
      
      setFormTitle(generated.title || "");
      setFormSubtitle(generated.subtitle || "");
      setFormCategory(generated.category || "Technology");
      if (generated.category && !["Technology", "Science", "Environment", "Architecture", "Management"].includes(generated.category)) {
        setFormCategory("Other");
        setCustomCategory(generated.category);
      }
      setFormSnippet(generated.snippet || "");
      setFormContent(generated.content || "");
      setFormImageAlt(generated.imageAlt || "");
      setFormReadTime(generated.readTime || "");

      setGenerationSuccess(true);
      setAiTopicContext("");
    } catch (err: any) {
      setGenerationError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Prefill author details when user loads
  useEffect(() => {
    if (user) {
      setFormAuthorName(user.name);
      setFormAuthorRole(user.role === "admin" ? "Administrator" : "Faculty Member");
      setFormAuthorAvatar(user.avatar || "scholar");
    }
  }, [user]);

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSubtitle.trim() || !formSnippet.trim() || !formContent.trim()) {
      setSubmitError("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const categoryToSend = formCategory === "Other" ? customCategory.trim() : formCategory;
    if (!categoryToSend) {
      setSubmitError("Please specify a category.");
      setIsSubmitting(false);
      return;
    }

    let readTimeToSend = formReadTime.trim();
    if (!readTimeToSend) {
      const wordsCount = formContent.trim().split(/\s+/).length;
      const estimatedMinutes = Math.max(1, Math.ceil(wordsCount / 200));
      readTimeToSend = `${estimatedMinutes} min read`;
    }

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          category: categoryToSend,
          snippet: formSnippet.trim(),
          content: formContent.trim(),
          imageUrl: formImageUrl.trim() || undefined,
          imageAlt: formImageAlt.trim() || undefined,
          readTime: readTimeToSend,
          authorName: formAuthorName.trim() || user?.name || "Faculty Member",
          authorRole: formAuthorRole.trim() || "Staff Correspondent",
          authorAvatar: formAuthorAvatar || undefined,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload manual article.");
      }

      setSubmitSuccess(true);
      setFormTitle("");
      setFormSubtitle("");
      setFormSnippet("");
      setFormContent("");
      setFormImageUrl("");
      setFormImageAlt("");
      setFormReadTime("");
      if (formCategory === "Other") {
        setFormCategory("Technology");
        setCustomCategory("");
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center md:text-left space-y-1 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <h2 className="text-2xl font-bold text-slate-850 dark:text-slate-150 tracking-tight flex items-center gap-2 justify-center md:justify-start">
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
            <p className="text-xs text-slate-450">
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
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
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
              <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
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

      {/* Upload Manual Article Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Upload Manual Syllabus Content
          </h3>
        </div>

        {/* AI Generator Section */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/30 rounded-2xl p-5 space-y-4">
          <button
            type="button"
            onClick={() => setShowAiGenerator(!showAiGenerator)}
            className="flex items-center justify-between w-full font-bold text-sm text-indigo-700 dark:text-indigo-400 cursor-pointer focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Article Assistant: Generate Fields Automatically</span>
            </span>
            <span className="text-xs px-2.5 py-1 bg-indigo-100/60 dark:bg-indigo-950/60 rounded-lg">
              {showAiGenerator ? "Hide Assistant" : "Use AI Assistant"}
            </span>
          </button>

          {showAiGenerator && (
            <div className="space-y-4 pt-2 border-t border-indigo-100/30 dark:border-indigo-900/20 animate-fadeIn">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explain your topic context and the desired length. The AI will write the entire article content in Markdown and generate matching titles, subtitles, summaries, categories, and image alt text for you.
              </p>

              {generationSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/20 rounded-xl flex items-start gap-2 text-emerald-600 dark:text-emerald-450 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>AI filled all article inputs successfully! Review the content below and manually add the Cover Image URL.</span>
                </div>
              )}

              {generationError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/30 dark:border-rose-900/20 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-455 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{generationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1.5">
                    Topic Context / Explanation
                  </label>
                  <input
                    type="text"
                    value={aiTopicContext}
                    onChange={(e) => setAiTopicContext(e.target.value)}
                    placeholder="e.g. Advanced cryptography and lattice-based algorithms in quantum computing"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1.5">
                    Target Length (Lines)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={150}
                    value={aiLineCount}
                    onChange={(e) => setAiLineCount(parseInt(e.target.value) || 30)}
                    placeholder="30"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Article...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Draft Fields with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {submitSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold">
              Content uploaded successfully! Students can now view this article in their library, search, and faculty can select it for reading lists.
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm font-semibold">{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitArticle} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Introduction to Neural Networks"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Subtitle / Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="e.g. Core concepts, architectures, and backpropagation foundations"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer"
              >
                <option value="Technology">Technology</option>
                <option value="Science">Science</option>
                <option value="Environment">Environment</option>
                <option value="Architecture">Architecture</option>
                <option value="Management">Management</option>
                <option value="Other">Other (Specify below)</option>
              </select>
            </div>

            {formCategory === "Other" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Specify Category <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Philosophy"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Read Time (Optional)
              </label>
              <input
                type="text"
                value={formReadTime}
                onChange={(e) => setFormReadTime(e.target.value)}
                placeholder="e.g. 5 min read (calculated if empty)"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Cover Image URL (Optional)
              </label>
              <input
                type="text"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Cover Image Description (Optional)
              </label>
              <input
                type="text"
                value={formImageAlt}
                onChange={(e) => setFormImageAlt(e.target.value)}
                placeholder="e.g. Neural network diagram"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Snippet / Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={formSnippet}
              onChange={(e) => setFormSnippet(e.target.value)}
              placeholder="Provide a very brief summary of the article to show in cards..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Article Content (Markdown Supported) <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400 lowercase italic">Supports standard markdown headers (##), bold (**), blockquotes (&gt;)</span>
            </label>
            <textarea
              required
              rows={8}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="## Core Concept...&#10;&#10;Here you can write the full article content in markdown format..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-3">
              Author Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  Author Name
                </label>
                <input
                  type="text"
                  required
                  value={formAuthorName}
                  onChange={(e) => setFormAuthorName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  Author Role
                </label>
                <input
                  type="text"
                  required
                  value={formAuthorRole}
                  onChange={(e) => setFormAuthorRole(e.target.value)}
                  placeholder="e.g. Professor of Computer Science"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  Avatar Theme
                </label>
                <select
                  value={formAuthorAvatar}
                  onChange={(e) => setFormAuthorAvatar(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer"
                >
                  <option value="scholar">Scholar</option>
                  <option value="mentor">Mentor</option>
                  <option value="tech">Tech</option>
                  <option value="creative">Creative</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-md cursor-pointer flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading Content...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Publish to Syllabus Feed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
