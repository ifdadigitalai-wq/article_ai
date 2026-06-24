"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Bookmark, Sparkles, MessageSquare, BookOpen, Share2, CornerDownRight, Send, Loader2 } from "lucide-react";
import { Article, Comment } from "../types";
import AISidebar from "./AISidebar";

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onRecordCompleted: (articleId: string) => void;
}

const PSEUDONYMS = [
  "Curious Scholar",
  "Thoughtful Reader",
  "Philosophical Eye",
  "Literary Critic",
  "Analytical Mind",
  "Aesthetic Observer",
  "Silent Thinker",
  "Inquisitive Soul",
  "Modern Humanist"
];

export default function ArticleView({
  article,
  onBack,
  isSaved,
  onToggleSave,
  onRecordCompleted,
}: ArticleViewProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showAiCompanion, setShowAiCompanion] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const commentsSectionRef = useRef<HTMLDivElement>(null);

  // Auto-summarization state & pre-fetching on load
  const [summary, setSummary] = useState<{ bulletPoints: string[]; keyTakeaway: string } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Dynamic expansion states
  const [articleContent, setArticleContent] = useState<string>(article.content);
  const [isExpanding, setIsExpanding] = useState<boolean>(false);

  // Trigger article expansion for dynamic news feeds
  useEffect(() => {
    if (article.id.startsWith("news-")) {
      const expandArticle = async () => {
        setIsExpanding(true);
        try {
          const res = await fetch("/api/articles/expand", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: article.title,
              subtitle: article.subtitle,
              snippet: article.snippet,
              content: article.content
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.content) {
              setArticleContent(data.content);
            }
          }
        } catch (err) {
          console.error("Error expanding article:", err);
        } finally {
          setIsExpanding(false);
        }
      };

      setArticleContent(article.content);
      expandArticle();
    } else {
      setArticleContent(article.content);
      setIsExpanding(false);
    }
  }, [article.id]);

  useEffect(() => {
    if (article && !isExpanding) {
      const autoFetchSummary = async () => {
        setSummaryLoading(true);
        setSummaryError(null);
        try {
          const res = await fetch("/api/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              articleId: article.id,
              articleContent: articleContent
            })
          });
          if (!res.ok) throw new Error("Failed to auto-summarize");
          const data = await res.json();
          if (data && (data.bulletPoints || data.keyTakeaway)) {
            setSummary(data);
          } else {
            throw new Error("Invalid summary format");
          }
        } catch (err) {
          console.error("Auto-summarization background error:", err);
          setSummaryError("Could not compile summary. Our editors are briefly offline.");
        } finally {
          setSummaryLoading(false);
        }
      };

      setSummary(null);
      autoFetchSummary();
    }
  }, [article.id, isExpanding, articleContent]);

  // Comments and Share states
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyAuthor, setReplyAuthor] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Monitor scroll for the progress bar and completion tracker
  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      const element = articleRef.current;
      const totalHeight = element.scrollHeight - element.clientHeight;
      if (totalHeight <= 0) return;

      const scrolled = (element.scrollTop / totalHeight) * 100;
      setScrollProgress(scrolled);

      // Trigger completed state when user scrolls past 85% of the article
      if (scrolled >= 85 && !hasCompleted) {
        setHasCompleted(true);
        onRecordCompleted(article.id);
      }
    };

    const container = articleRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [article.id, hasCompleted, onRecordCompleted]);

  // Fetch comments for this article from the server
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/articles/${article.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
    
    // Assign a beautiful default editorial pseudonym
    const randomName = PSEUDONYMS[Math.floor(Math.random() * PSEUDONYMS.length)];
    setNewAuthor(randomName);
    setReplyAuthor(randomName);
    
    // Reset commenting UI
    setNewContent("");
    setReplyingToId(null);
    setReplyContent("");
  }, [article.id]);

  // Handle adding a comment or a reply
  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const authorName = parentId ? replyAuthor : newAuthor;
    const bodyContent = parentId ? replyContent : newContent;

    if (!bodyContent.trim()) return;

    try {
      const res = await fetch(`/api/articles/${article.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: authorName.trim() || "Anonymous Scholar",
          content: bodyContent.trim(),
          parentId,
        }),
      });

      if (res.ok) {
        const createdComment = await res.json();
        setComments((prev) => [...prev, createdComment]);

        if (parentId) {
          setReplyContent("");
          setReplyingToId(null);
        } else {
          setNewContent("");
        }
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  // Copy current article URL to clipboard to share
  const handleShare = () => {
    const shareUrl = `${window.location.origin}?article=${article.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2200);
    }).catch(err => {
      console.error("Failed to copy link:", err);
    });
  };

  // Scroll smoothly to comments section
  const scrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Recursive renderer for nested comments and replies
  const renderCommentTree = (parentId: string | null = null, depth = 0) => {
    const filtered = comments.filter((c) => c.parentId === parentId);
    if (filtered.length === 0) return null;

    // Sort comments by date so they read in correct sequential order
    const sorted = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return (
      <div className={`space-y-4 ${depth > 0 ? "mt-4 pl-4 sm:pl-6 border-l-2 border-primary/20" : ""}`}>
        {sorted.map((comment) => {
          const isReplying = replyingToId === comment.id;

          return (
            <div 
              key={comment.id} 
              className="group/comment rounded-lg bg-[#fcfaf7] p-4 border border-charcoal/5 transition-all hover:border-charcoal/10 hover:shadow-sm"
              id={`comment-card-${comment.id}`}
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-[10px] font-black uppercase">
                    {comment.author.charAt(0)}
                  </div>
                  <span className="font-sans text-xs font-black text-charcoal tracking-wide uppercase">
                    {comment.author}
                  </span>
                </div>
                <span className="font-sans text-[10px] text-secondary-gray/60 font-bold">
                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Comment Body */}
              <p className="font-sans text-sm text-charcoal/90 leading-relaxed mb-3 whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setReplyingToId(isReplying ? null : comment.id);
                    setReplyContent("");
                  }}
                  className="flex items-center gap-1 font-sans text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                >
                  <CornerDownRight className="h-3 w-3" />
                  <span>{isReplying ? "Cancel Reply" : "Reply"}</span>
                </button>
              </div>

              {/* Inline Reply Form */}
              {isReplying && (
                <form
                  onSubmit={(e) => handleAddComment(e, comment.id)}
                  className="mt-4 p-4 bg-paper border border-charcoal/10 rounded-md space-y-3"
                >
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                    <span className="font-sans text-[10px] uppercase tracking-wider font-bold text-secondary-gray/80">
                      Replying as:
                    </span>
                    <input
                      type="text"
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      placeholder="Your name"
                      className="font-sans text-xs font-bold border border-charcoal/10 rounded px-2.5 py-1.5 bg-white w-full sm:w-48 focus:outline-none focus:border-primary text-charcoal"
                      maxLength={30}
                      required
                    />
                  </div>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.author}...`}
                    className="w-full font-sans text-xs border border-charcoal/10 rounded p-2.5 bg-white focus:outline-none focus:border-primary text-charcoal h-20 resize-none"
                    required
                    maxLength={500}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!replyContent.trim()}
                      className="rounded bg-primary px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider text-white hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Post Reply
                    </button>
                  </div>
                </form>
              )}

              {/* Nested Children Tree */}
              {renderCommentTree(comment.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  // Clean, lightweight Markdown parser to render styled typography
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={index} className="h-4" />;
      }

      // Headers
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={index} className="mt-8 mb-4 font-serif text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            {trimmed.slice(2)}
          </h1>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={index} className="mt-8 mb-4 font-serif text-2xl font-bold text-charcoal">
            {trimmed.slice(3)}
          </h2>
        );
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        const quoteText = trimmed.slice(2).replace(/—/g, "— ");
        return (
          <blockquote key={index} className="my-6 border-l-4 border-primary pl-4 font-serif text-lg italic text-secondary-gray leading-relaxed bg-black/2 p-3 rounded-r-lg">
            {quoteText}
          </blockquote>
        );
      }

      // Bullet items
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        return (
          <li key={index} className="ml-6 list-disc text-sm sm:text-base text-secondary-gray leading-relaxed mb-2">
            {trimmed.slice(2)}
          </li>
        );
      }

      // Bold / Italic highlights
      let content: React.ReactNode = trimmed;
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(trimmed)) {
        const parts = trimmed.split(boldRegex);
        content = parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold text-charcoal">{part}</strong> : part));
      }

      return (
        <p key={index} className="font-sans text-base sm:text-lg text-secondary-gray leading-relaxed mb-6">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-paper" id={`article-view-${article.id}`}>
      {/* 1. Elegant Reading Progress Bar with glow effect */}
      <div className="absolute top-0 left-0 z-50 h-[4px] w-full bg-charcoal/5">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_1px_6px_rgba(212,77,46,0.5)] transition-all duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Reading Top Action Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border-outline/20 bg-paper/95 px-4 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-semibold text-secondary-gray hover:text-primary transition-colors cursor-pointer"
          id="back-to-feed-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Feed</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share Article Link */}
          <div className="relative">
            <button
              onClick={handleShare}
              className="rounded-full p-2 text-secondary-gray hover:bg-black/5 hover:text-primary transition-colors cursor-pointer"
              id="share-article-btn"
              title="Share Link"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {showShareTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 top-full mt-2 z-50 rounded bg-charcoal text-white text-[10px] px-2.5 py-1.5 whitespace-nowrap font-sans font-bold uppercase tracking-wider shadow-md"
                >
                  Copied to Clipboard!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shortcut to comments section */}
          <button
            onClick={scrollToComments}
            className="rounded-full p-2 text-secondary-gray hover:bg-black/5 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            id="comments-shortcut-btn"
            title="Jump to Discourse"
          >
            <MessageSquare className="h-4 w-4" />
            {comments.length > 0 && (
              <span className="text-[9px] font-sans font-black bg-primary text-white rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {comments.length}
              </span>
            )}
          </button>

          {/* AI companion launcher */}
          <button
            onClick={() => setShowAiCompanion(!showAiCompanion)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              showAiCompanion
                ? "bg-primary text-white shadow-sm"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
            id="ai-companion-toggle"
          >
            <Sparkles className="h-3 w-3" />
            <span>Ai Summary</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onToggleSave}
            className={`rounded-full p-2 transition-colors cursor-pointer ${
              isSaved
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-secondary-gray hover:bg-black/5 hover:text-primary"
            }`}
            id="bookmark-btn"
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* 3. Main Split Reading Interface */}
      <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        {/* Left Side: Editorial Body Scroll Container */}
        <div
          ref={articleRef}
          className="h-full flex-1 overflow-y-auto px-4 py-8 sm:px-8 md:px-12 lg:px-16"
        >
          <div className="mx-auto max-w-2xl">
            {/* Header Metadata */}
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {article.category}
              </span>
              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-charcoal sm:text-4xl md:text-5xl">
                {article.title}
              </h1>
              <p className="mt-3 text-base text-secondary-gray sm:text-lg italic">
                {article.subtitle}
              </p>
            </div>

            {/* Author Byline */}
            <div className="my-6 flex items-center gap-3 border-y border-border-outline/20 py-4">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full object-cover grayscale"
              />
              <div>
                <p className="text-sm font-bold text-charcoal">
                  {article.author.name}
                </p>
                <p className="text-xs text-secondary-gray">
                  {article.author.role} • {article.date} • {article.readTime}
                </p>
              </div>
            </div>

            {/* Main Header Image */}
            <div className="mb-8 overflow-hidden rounded-xl bg-charcoal/5 shadow-sm">
              <img
                src={article.imageUrl}
                alt={article.imageAlt}
                referrerPolicy="no-referrer"
                className="w-full object-cover max-h-[350px]"
              />
            </div>

            {/* Document Body */}
            <div className="prose prose-slate max-w-none">
              {isExpanding ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm font-semibold text-secondary-gray">Receiving full dispatch...</p>
                  <p className="text-xs text-secondary-gray/50 italic mt-1">Expanding telegraph wires into editorial analysis</p>
                </div>
              ) : (
                parseMarkdown(articleContent)
              )}
            </div>

            {/* End of article marker */}
            <div className="my-12 flex flex-col items-center justify-center border-t border-border-outline/20 pt-8 text-center">
              <BookOpen className="h-6 w-6 text-border-outline mb-2" />
              <p className="text-xs font-semibold tracking-wider text-secondary-gray uppercase">
                End of Reading
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-xl border border-charcoal/15 bg-white px-5 py-2.5 text-xs font-bold text-charcoal hover:bg-black/5 transition-all cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Article</span>
                </button>
                <button
                  onClick={() => setShowAiCompanion(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-container hover:scale-102 transition-all active:scale-98 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Discuss with the Editor</span>
                </button>
              </div>
            </div>

            {/* 4. Community Discourse (Comments) Section */}
            <div
              ref={commentsSectionRef}
              className="mt-16 border-t border-border-outline pt-12 pb-24"
              id="comments-section"
            >
              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-black text-primary">
                    Community Discourse
                  </span>
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-charcoal sm:text-3xl mt-1">
                    Discussion & Letters
                  </h2>
                </div>
                <div className="rounded-full bg-primary/5 px-3.5 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-primary border border-primary/10">
                  {comments.length} {comments.length === 1 ? "Letter" : "Letters"}
                </div>
              </div>

              {/* Comment submission form */}
              <form onSubmit={(e) => handleAddComment(e, null)} className="mb-10 bg-[#e5e2dd]/40 p-5 rounded-xl border border-charcoal/10 backdrop-blur-sm space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <label className="font-sans text-xs font-black uppercase tracking-wider text-charcoal/70">
                    Signing Letter as:
                  </label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Your name"
                    className="font-sans text-xs font-bold border border-charcoal/15 rounded-lg px-3 py-1.5 bg-white w-full sm:w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-charcoal transition-all"
                    maxLength={30}
                    required
                  />
                </div>
                <div>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Share your thoughts, analysis, or critique on this thesis..."
                    className="w-full font-sans text-sm border border-charcoal/15 rounded-lg p-3 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-charcoal h-28 resize-none transition-all placeholder:text-secondary-gray/50"
                    required
                    maxLength={1000}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newContent.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-charcoal text-white px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Post Letter</span>
                  </button>
                </div>
              </form>

              {/* Comments list */}
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-10 text-secondary-gray text-sm">
                  <span className="animate-pulse font-sans font-bold tracking-widest uppercase text-[11px] text-primary">Loading Discourse...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 rounded-xl bg-charcoal/2 border border-dashed border-charcoal/15">
                  <MessageSquare className="h-8 w-8 text-secondary-gray/40 mx-auto mb-3" />
                  <p className="font-serif text-base italic text-secondary-gray">No discourse has started yet.</p>
                  <p className="font-sans text-xs text-secondary-gray/60 mt-1">Be the first to submit a letter to the editor.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {renderCommentTree(null)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side / Overlay: Interactive AI Sidebar Companion */}
        <AnimatePresence>
          {showAiCompanion && (
            <AISidebar
              articleId={article.id}
              onClose={() => setShowAiCompanion(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
