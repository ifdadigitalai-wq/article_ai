"use client";

import React, { useEffect, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Sparkles, Check, RefreshCw, FileText, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { isStandardCategory, CATEGORIES } from "../lib/categories";

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
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [formSnippet, setFormSnippet] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImageAlt, setFormImageAlt] = useState("");
  const [formReadTime, setFormReadTime] = useState("");
  const [formAuthorName, setFormAuthorName] = useState("");
  const [formAuthorRole, setFormAuthorRole] = useState("");
  const [headingFont, setHeadingFont] = useState("playfair");
  const [paragraphFont, setParagraphFont] = useState("lora");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Toast Feedback State
  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

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

  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [docParseError, setDocParseError] = useState<string | null>(null);
  const [docParseSuccess, setDocParseSuccess] = useState(false);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filename = file.name.toLowerCase();
    const isPdf = filename.endsWith(".pdf") || file.type === "application/pdf";
    const isDocx = filename.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isDoc = filename.endsWith(".doc") || file.type === "application/msword";

    if (!isPdf && !isDocx && !isDoc) {
      setDocParseError("Please upload a PDF or DOCX file.");
      setDocParseSuccess(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setDocParseError("Document size must be less than 10MB.");
      setDocParseSuccess(false);
      return;
    }

    setIsParsingDoc(true);
    setDocParseError(null);
    setDocParseSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-document", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to parse document.");
      }

      const data = await res.json();
      
      if (formContent.trim()) {
        setFormContent((prev) => `${prev}\n\n${data.text}`);
      } else {
        setFormContent(data.text);
      }
      setDocParseSuccess(true);
    } catch (err: any) {
      setDocParseError(err.message || "An unexpected error occurred during document parsing.");
    } finally {
      setIsParsingDoc(false);
      e.target.value = "";
    }
  };

  // Curated Reading List States
  const [readingLists, setReadingLists] = useState<any[]>([]);
  const [selectedReadingLists, setSelectedReadingLists] = useState<string[]>([]);

  // AI Generator Form State
  const [aiTopicContext, setAiTopicContext] = useState("");
  const [aiWordCount, setAiWordCount] = useState<number | "">(500);
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
    }
  }, [user]);

  const handleAiGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!aiTopicContext.trim()) {
      setGenerationError("Please enter a topic context for the AI.");
      return;
    }
    if (aiWordCount === "" || aiWordCount <= 0) {
      setGenerationError("Please enter a valid word count greater than 0.");
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
          wordCount: aiWordCount
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
          authorAvatar: user?.avatar || "scholar",
          readingListIds: selectedReadingLists,
          headingFont,
          paragraphFont,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload manual article.");
      }

      const publishedTitle = formTitle.trim();
      setSubmitSuccess(true);
      setFormTitle("");
      setFormSubtitle("");
      setFormSnippet("");
      setFormContent("");
      setFormImageUrl("");
      setFormImageAlt("");
      setFormReadTime("");
      setSelectedReadingLists([]);
      setHeadingFont("playfair");
      setParagraphFont("lora");
      if (formCategory === "Other") {
        setFormCategory(CATEGORIES[0]);
        setCustomCategory("");
      }

      setToastTitle("Article Published!");
      setToastMessage(`"${publishedTitle}" is now live in the syllabus feed.`);
      setShowToast(true);
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
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase mb-1.5">
                    Topic Context / Explanation
                  </label>
                  <input
                    type="text"
                    value={aiTopicContext}
                    onChange={(e) => setAiTopicContext(e.target.value)}
                    placeholder="e.g. Advanced cryptography and lattice-based algorithms in quantum computing"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase mb-1.5">
                    Target Length (Words)
                  </label>
                  <input
                    type="number"
                    value={aiWordCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAiWordCount(val === "" ? "" : parseInt(val, 10));
                    }}
                    placeholder="500"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Premium UI Cover Image Preview */}
          {formImageUrl.trim() && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Article Content (Markdown Supported) <span className="text-rose-500">*</span></span>
              </label>
              
              <div className="flex items-center gap-2">
                {docParseSuccess && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 animate-fadeIn border border-emerald-200/30">
                    <Check className="w-3 h-3" /> Imported!
                  </span>
                )}
                {docParseError && (
                  <span className="text-[10px] text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 animate-fadeIn border border-rose-200/30">
                    <AlertCircle className="w-3 h-3" /> {docParseError}
                  </span>
                )}
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/80 rounded-xl text-[11px] font-semibold text-indigo-650 dark:text-indigo-400 cursor-pointer shadow-xs active:scale-95 transition-all select-none whitespace-nowrap">
                  {isParsingDoc ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>{isParsingDoc ? "Importing..." : "Import PDF / DOCX"}</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleDocUpload}
                    className="hidden"
                    disabled={isParsingDoc}
                  />
                </label>
              </div>
            </div>
            <textarea
              required
              rows={8}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="## Core Concept...&#10;&#10;Here you can write the full article content in markdown format..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono"
            />
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex justify-between">
              <span>Supports standard markdown headers (##), bold (**), blockquotes (&gt;)</span>
              <span>Upload PDF/DOCX to auto-extract text</span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-3">
              Author Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Typography Customization */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>Typography Styling</span>
              <span className="text-[10px] text-indigo-500 font-bold normal-case bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md border border-indigo-100/30">Custom Fonts</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  Heading Font
                </label>
                <select
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer"
                >
                  <option value="playfair">Serif (Playfair Display)</option>
                  <option value="inter">Sans-Serif (Inter)</option>
                  <option value="arvo">Slab-Serif (Arvo)</option>
                  <option value="montserrat">Display (Montserrat)</option>
                  <option value="outfit">Modern Display (Outfit)</option>
                  <option value="cinzel">Classic Serif (Cinzel)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  Paragraph (Body) Font
                </label>
                <select
                  value={paragraphFont}
                  onChange={(e) => setParagraphFont(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer"
                >
                  <option value="lora">Serif (Lora)</option>
                  <option value="inter">Sans-Serif (Inter)</option>
                  <option value="fira">Monospace (Fira Code)</option>
                  <option value="nunito">Readable Sans (Nunito)</option>
                  <option value="opensans">Clean Sans-Serif (Open Sans)</option>
                  <option value="merriweather">Editorial Serif (Merriweather)</option>
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

      {/* Floating Confirmation Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-[100] w-full max-w-sm md:max-w-md overflow-hidden rounded-2xl border border-emerald-550/20 dark:border-emerald-550/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl flex flex-col"
          >
            <div className="flex gap-3 items-start">
              {/* Animated Check Icon Ring */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-550 text-white shadow-md shadow-emerald-500/25">
                <Check className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-0.5">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
                  {toastTitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-2">
                  {toastMessage}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowToast(false)}
                className="h-6 w-6 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-605 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress Bar Timer */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
