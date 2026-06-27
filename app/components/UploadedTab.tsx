"use client";

import React, { useEffect, useState } from "react";
import { Edit2, Trash2, Layers, Search, RefreshCw, AlertCircle, FileText, CheckCircle2, ArrowLeft, Save, HelpCircle, User } from "lucide-react";
import { Article } from "../types";

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

interface UploadedTabProps {
  user: UserProfile | null;
  onRead: (article: Article) => void;
}

export default function UploadedTab({ user, onRead }: UploadedTabProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Editing State
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUserArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data: Article[] = await res.json();
        // Filter to show only those created by the current user
        if (user) {
          const userSpecific = data.filter((a) => {
            if (!a.isCustom) return false;
            return a.createdBy === user.id || ((!a.createdBy || a.createdBy === "") && a.author?.name === user.name);
          });
          setArticles(userSpecific);
        } else {
          setArticles([]);
        }
      } else {
        setError("Failed to fetch uploaded articles.");
      }
    } catch (err) {
      console.error("Error fetching user articles:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserArticles();
  }, [user]);

  const handleEditClick = (article: Article) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormSubtitle(article.subtitle);
    setFormSnippet(article.snippet);
    setFormContent(article.content);
    setFormImageUrl(article.imageUrl || "");
    setFormImageAlt(article.imageAlt || "");
    setFormReadTime(article.readTime || "");
    setFormAuthorName(article.author?.name || "");
    setFormAuthorRole(article.author?.role || "");
    setFormAuthorAvatar(article.author?.avatar?.includes("scholar") ? "scholar" : "scholar"); // Fallback check or default

    const standardCategories = ["Technology", "Science", "Environment", "Architecture", "Management"];
    if (standardCategories.includes(article.category)) {
      setFormCategory(article.category);
      setCustomCategory("");
    } else {
      setFormCategory("Other");
      setCustomCategory(article.category);
    }
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

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
      const res = await fetch(`/api/articles/${editingArticle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update article.");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setEditingArticle(null);
        fetchUserArticles();
      }, 1000);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      return;
    }

    setDeletingId(articleId);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== articleId));
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete article.");
      }
    } catch (err) {
      console.error("Error deleting article:", err);
      alert("An error occurred while deleting the article.");
    } finally {
      setDeletingId(null);
    }
  };

  // Get dynamic categories for filter
  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];

  // Filtered list
  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || art.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (editingArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        {/* Editing Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <button
            onClick={() => setEditingArticle(null)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-850 dark:text-slate-150 tracking-tight">
              Edit Article: {editingArticle.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Update details, content, or metadata for your published syllabus article.
            </p>
          </div>
        </div>

        {submitSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold">
              Article updated successfully! Returning to list...
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm font-semibold">{submitError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateArticle} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-5">
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
                placeholder="e.g. 5 min read"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {formImageUrl.trim() && (
            <div className="rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-2 px-1">
                Cover Image Preview
              </div>
              <div className="relative aspect-video w-full max-h-48 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-955">
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

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Snippet / Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={formSnippet}
              onChange={(e) => setFormSnippet(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Article Content (Markdown Supported) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={8}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-3">
              Author Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-550 mb-1.5">
                  Author Name
                </label>
                <input
                  type="text"
                  required
                  value={formAuthorName}
                  onChange={(e) => setFormAuthorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-550 mb-1.5">
                  Author Role
                </label>
                <input
                  type="text"
                  required
                  value={formAuthorRole}
                  onChange={(e) => setFormAuthorRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-145 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingArticle(null)}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-855 dark:text-slate-145 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-650 dark:text-indigo-400" />
            <span>Manage Uploaded Content</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Search, filter, edit, modify, and delete the custom articles you've published.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your published articles..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-250 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Category Selector scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Fetching your publications...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-600 rounded-full inline-block">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No Articles Found</h3>
          <p className="text-sm text-slate-450 dark:text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== "All"
              ? "No articles matched your search query or category filters."
              : "You haven't uploaded any syllabus articles yet. Head over to the 'Create Article' tab to publish your first one!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs hover:border-slate-350 dark:hover:border-slate-750 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image block */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                  <img
                    src={art.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80"}
                    alt={art.imageAlt || art.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                    {art.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-md">
                    {art.readTime || "5 min read"}
                  </div>
                </div>

                {/* Content info */}
                <div className="p-5 space-y-2">
                  <h4
                    onClick={() => onRead(art)}
                    className="font-bold text-slate-850 dark:text-slate-150 text-base leading-tight tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors line-clamp-2"
                  >
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                    {art.subtitle}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg">
                    {art.snippet}
                  </p>
                </div>
              </div>

              {/* Footer Author & Actions */}
              <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                {/* Author detail */}
                <div className="flex items-center gap-2">
                  <div className="h-6.5 w-6.5 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-xs border border-indigo-150/40 dark:border-indigo-900/30">
                    <User className="h-3.5 w-3.5 text-indigo-650 dark:text-indigo-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-slate-750 dark:text-slate-300 truncate max-w-[120px]">
                      {art.author?.name}
                    </span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-550 leading-none">
                      {art.date}
                    </span>
                  </div>
                </div>

                {/* Edit / Delete Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(art)}
                    className="p-2 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-slate-500 dark:text-slate-400 transition-all cursor-pointer bg-white dark:bg-slate-900"
                    title="Edit/Modify Article"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(art.id)}
                    disabled={deletingId === art.id}
                    className="p-2 border border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-455 rounded-xl text-slate-500 dark:text-slate-400 transition-all cursor-pointer bg-white dark:bg-slate-900"
                    title="Delete Article"
                  >
                    {deletingId === art.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
