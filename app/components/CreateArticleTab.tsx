"use client";

import React, { useEffect, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Sparkles, Check, RefreshCw } from "lucide-react";
import { isStandardCategory } from "../lib/categories";

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

interface CreateArticleTabProps {
  user?: UserProfile | null;
}

export default function CreateArticleTab({ user }: CreateArticleTabProps) {
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

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Image size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload image.");
      }

      const data = await res.json();
      setFormImageUrl(data.url);
      if (!formImageAlt.trim()) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setFormImageAlt(nameWithoutExt);
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during image upload.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Curated Reading List States
  const [readingLists, setReadingLists] = useState<any[]>([]);
  const [selectedReadingLists, setSelectedReadingLists] = useState<string[]>([]);

  // AI Generator Form State
  const [aiTopicContext, setAiTopicContext] = useState("");
  const [aiLineCount, setAiLineCount] = useState<number | "">(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const fetchReadingLists = async () => {
    try {
      const res = await fetch("/api/reading-lists");
      if (res.ok) {
        const payload = await res.json();
        setReadingLists(payload);
      }
    } catch (err) {
      console.error("Failed to fetch reading lists in CreateArticleTab:", err);
    }
  };

  useEffect(() => {
    fetchReadingLists();
  }, []);

  // Prefill author details when user loads
  useEffect(() => {
    if (user) {
      setFormAuthorName(user.name);
      setFormAuthorRole(user.role === "admin" ? "Administrator" : "Faculty Member");
      setFormAuthorAvatar(user.avatar || "scholar");
    }
  }, [user]);

  const handleAiGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!aiTopicContext.trim()) {
      setGenerationError("Please enter a topic context for the AI.");
      return;
    }
    if (aiLineCount === "" || aiLineCount <= 0) {
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
      if (generated.category && !isStandardCategory(generated.category)) {
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

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSubtitle.trim() || !formContent.trim()) {
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

    let snippetToSend = formSnippet.trim();
    if (!snippetToSend) {
      const cleanContent = formContent
        .replace(/#+\s+/g, "") // remove headers
        .replace(/[*_`]/g, "") // remove formatting
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace markdown links with text
        .trim();
      snippetToSend = cleanContent.slice(0, 160);
      if (cleanContent.length > 160) {
        snippetToSend += "...";
      }
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
          snippet: snippetToSend,
          content: formContent.trim(),
          imageUrl: formImageUrl.trim() || undefined,
          imageAlt: formImageAlt.trim() || undefined,
          readTime: readTimeToSend,
          authorName: formAuthorName.trim() || user?.name || "Faculty Member",
          authorRole: formAuthorRole.trim() || "Staff Correspondent",
          authorAvatar: formAuthorAvatar || undefined,
          readingListIds: selectedReadingLists,
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
      setSelectedReadingLists([]);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
<div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 shadow-lg">
  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl px-6 py-6 md:px-8 md:py-7">
    
    {/* Top Content */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      
      {/* Left */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3 justify-center md:justify-start">
          
          {/* Icon with glow */}
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/30">
            <Upload className="w-5 h-5 text-white" />
          </div>

          <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            Create & Publish Syllabus Content
          </span>
        </h2>

        <p className="text-sm md:text-[15px] text-slate-500 dark:text-slate-400 max-w-xl">
          Create structured educational content, organize reading lists, and accelerate publishing with AI-powered assistance.
        </p>
      </div>

      {/* Right CTA (Optional but premium feel) */}
      <div className="flex justify-center md:justify-end">
        <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-sm font-semibold shadow-md hover:scale-105 transition-all duration-200">
          + New Content
        </button>
      </div>

    </div>

  </div>
</div>
      {/* Upload Manual Article Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-6">
        {/* AI Generator Section */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/30 rounded-2xl p-5 space-y-4">
          <button
            type="button"
            onClick={() => setShowAiGenerator(!showAiGenerator)}
            className="flex items-center justify-between w-full font-bold text-sm text-indigo-700 dark:text-indigo-455 cursor-pointer focus:outline-none"
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
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1.5">
                    Target Length (Lines)
                  </label>
                  <input
                    type="number"
                    value={aiLineCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAiLineCount(val === "" ? "" : parseInt(val, 10));
                    }}
                    placeholder="30"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-1.5 transition-colors"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Cover Image URL (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
                <label className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/80 rounded-xl text-xs font-semibold text-indigo-650 dark:text-indigo-400 cursor-pointer shadow-sm active:scale-95 transition-all select-none whitespace-nowrap">
                  {isUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploading ? "Uploading..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Premium UI Cover Image Preview */}
          {formImageUrl.trim() && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-2 px-1">
                Cover Image Live Preview
              </div>
              <div className="relative aspect-video w-full max-h-56 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950">
                <img
                  src={formImageUrl}
                  alt={formImageAlt || "Cover Preview"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80";
                  }}
                />
              </div>
            </div>
          )}

          {/* Summary / snippet input field removed for simplified creation experience, generated dynamically instead */}

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
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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

          {/* Reading List Selector */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Add to Curated Reading List(s) (Optional)
            </h4>
            {readingLists.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No reading lists found. Curate a list from the "Reading Lists" tab first.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-36 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                {readingLists.map((list) => {
                  const isChecked = selectedReadingLists.includes(list.id);
                  return (
                    <button
                      type="button"
                      key={list.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedReadingLists(selectedReadingLists.filter((id) => id !== list.id));
                        } else {
                          setSelectedReadingLists([...selectedReadingLists, list.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isChecked
                          ? "border-indigo-650 bg-indigo-500/5 text-indigo-650 dark:text-indigo-450 font-bold animate-pulseFast"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                      }`}
                    >
                      <span className="truncate max-w-[85%]">
                        {list.title} ({list.branch})
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                          isChecked
                            ? "border-indigo-650 bg-indigo-600 text-white animate-scaleIn"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
