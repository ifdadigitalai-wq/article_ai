"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Bookmark,
  Sparkles,
  MessageSquare,
  BookOpen,
  Share2,
  CornerDownRight,
  Send,
  Loader2,
  Brain,
  ThumbsUp,
} from "lucide-react";
import { Article, Comment } from "../types";
import AISidebar from "./AISidebar";
import QuizModal from "./QuizModal";

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onRecordCompleted: (articleId: string) => void;
  user: { name: string; email: string; role: string; department: string } | null;
}

export default function ArticleView({
  article,
  onBack,
  isSaved,
  onToggleSave,
  onRecordCompleted,
  user,
}: ArticleViewProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showAiCompanion, setShowAiCompanion] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const commentsSectionRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState<{ bulletPoints: string[]; keyTakeaway: string } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [articleContent, setArticleContent] = useState<string>(article.content);
  const [isExpanding, setIsExpanding] = useState<boolean>(false);

  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Time tracking effect
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const endTime = Date.now();
      const timeSpentSeconds = Math.round((endTime - startTime) / 1000);
      if (timeSpentSeconds >= 5) {
        fetch("/api/reading-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId: article.id,
            articleTitle: article.title,
            timeSpentSeconds,
          }),
          keepalive: true,
        }).catch((err) => console.error("Error saving reading history:", err));
      }
    };
  }, [article.id, article.title]);

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
              content: article.content,
            }),
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
              articleContent: articleContent,
            }),
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

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      const element = articleRef.current;
      const totalHeight = element.scrollHeight - element.clientHeight;
      if (totalHeight <= 0) return;

      const scrolled = (element.scrollTop / totalHeight) * 100;
      setScrollProgress(scrolled);

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
    setNewContent("");
    setReplyingToId(null);
    setReplyContent("");
  }, [article.id]);

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const bodyContent = parentId ? replyContent : newContent;

    if (!bodyContent.trim()) return;

    try {
      const res = await fetch(`/api/articles/${article.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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

  const handleLikeComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/articles/${article.id}/comments/${commentId}/like`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, likes: data.likes } : c))
        );
      }
    } catch (err) {
      console.error("Error liking comment:", err);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}?article=${article.id}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2200);
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
      });
  };

  const scrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    if (!text) return "";
    const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const parts = text.split(tokenRegex);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="italic text-slate-705 dark:text-slate-350">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-sm text-indigo-600 dark:text-indigo-400">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const parseMarkdown = (rawText: string) => {
    if (!rawText) return null;
    const normalizedText = rawText.replace(/\r\n/g, "\n");
    const blocks = normalizedText.split("\n\n");

    return blocks.map((block, blockIndex) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return null;

      // 1. Headings
      if (trimmedBlock.startsWith("#### ")) {
        return (
          <h5 key={blockIndex} className="font-serif text-base font-bold text-slate-800 dark:text-white mt-4 mb-2">
            {renderInlineMarkdown(trimmedBlock.substring(5).trim())}
          </h5>
        );
      }
      if (trimmedBlock.startsWith("### ")) {
        return (
          <h4 key={blockIndex} className="font-serif text-lg font-bold text-slate-800 dark:text-white mt-6 mb-2.5">
            {renderInlineMarkdown(trimmedBlock.substring(4).trim())}
          </h4>
        );
      }
      if (trimmedBlock.startsWith("## ")) {
        return (
          <h3 key={blockIndex} className="font-serif text-xl font-extrabold text-slate-850 dark:text-white mt-8 mb-3">
            {renderInlineMarkdown(trimmedBlock.substring(3).trim())}
          </h3>
        );
      }
      if (trimmedBlock.startsWith("# ")) {
        return (
          <h2 key={blockIndex} className="font-serif text-2xl font-black text-slate-900 dark:text-white mt-10 mb-4">
            {renderInlineMarkdown(trimmedBlock.substring(2).trim())}
          </h2>
        );
      }

      // Fallback for older ###Header syntax without space
      if (trimmedBlock.startsWith("###")) {
        return (
          <h4 key={blockIndex} className="font-serif text-lg font-bold text-slate-800 dark:text-white mt-6 mb-2.5">
            {renderInlineMarkdown(trimmedBlock.substring(3).trim())}
          </h4>
        );
      }
      if (trimmedBlock.startsWith("##")) {
        return (
          <h3 key={blockIndex} className="font-serif text-xl font-extrabold text-slate-850 dark:text-white mt-8 mb-3">
            {renderInlineMarkdown(trimmedBlock.substring(2).trim())}
          </h3>
        );
      }

      // 2. Blockquotes
      if (trimmedBlock.startsWith(">")) {
        const quoteLines = trimmedBlock.split("\n").map(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith(">")) {
            return trimmedLine.substring(1).trim();
          }
          return trimmedLine;
        });
        return (
          <blockquote key={blockIndex} className="border-l-4 border-indigo-500 pl-4 py-1 my-6 font-serif italic font-normal text-slate-700 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-900/30 rounded-r-xl pr-4">
            {renderInlineMarkdown(quoteLines.join("\n"))}
          </blockquote>
        );
      }

      // 3. Bullet Lists
      const lines = trimmedBlock.split("\n");
      const isBulletList = lines.every(line => {
        const t = line.trim();
        return t.startsWith("* ") || t.startsWith("- ") || t === "*" || t === "-";
      });
      if (isBulletList && lines.length > 0) {
        return (
          <ul key={blockIndex} className="list-disc pl-6 mb-6 space-y-2 text-slate-650 dark:text-slate-300 font-sans font-normal text-base sm:text-lg">
            {lines.map((line, lineIndex) => {
              const t = line.trim();
              const contentText = (t.startsWith("* ") || t.startsWith("- ")) ? t.substring(2).trim() : "";
              return (
                <li key={lineIndex} className="leading-relaxed">
                  {renderInlineMarkdown(contentText)}
                </li>
              );
            })}
          </ul>
        );
      }

      // 4. Numbered Lists
      const isNumberedList = lines.every(line => {
        const t = line.trim();
        return /^\d+\.\s+/.test(t);
      });
      if (isNumberedList && lines.length > 0) {
        return (
          <ol key={blockIndex} className="list-decimal pl-6 mb-6 space-y-2 text-slate-655 dark:text-slate-300 font-sans font-normal text-base sm:text-lg">
            {lines.map((line, lineIndex) => {
              const t = line.trim();
              const match = t.match(/^\d+\.\s+(.*)/);
              const contentText = match ? match[1].trim() : t;
              return (
                <li key={lineIndex} className="leading-relaxed">
                  {renderInlineMarkdown(contentText)}
                </li>
              );
            })}
          </ol>
        );
      }

      // 5. Standard Paragraph
      return (
        <p key={blockIndex} className="font-sans font-normal text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {renderInlineMarkdown(trimmedBlock)}
        </p>
      );
    });
  };

  const renderCommentTree = (parentId: string | null = null, depth = 0) => {
    const filtered = comments.filter((c) => c.parentId === parentId);
    if (filtered.length === 0) return null;

    const sorted = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return (
      <div className={`space-y-4 ${depth > 0 ? "mt-4 pl-4 sm:pl-6 border-l-2 border-indigo-200 dark:border-indigo-950" : ""}`}>
        {sorted.map((comment) => {
          const isReplying = replyingToId === comment.id;

          return (
            <div
              key={comment.id}
              className="group/comment rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 transition-all"
              id={`comment-card-${comment.id}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-serif text-[10px] font-black uppercase">
                    {comment.author.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-xs font-black text-slate-800 dark:text-slate-200">
                      {comment.author}
                    </span>
                    {comment.authorRole && (
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        {comment.authorRole} • {comment.authorDept}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-sans text-[10px] text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="font-sans text-sm text-slate-700 dark:text-slate-350 leading-relaxed mb-3 whitespace-pre-wrap">
                {comment.content}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setReplyingToId(isReplying ? null : comment.id);
                    setReplyContent("");
                  }}
                  className="flex items-center gap-1 font-sans text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-widest cursor-pointer"
                >
                  <CornerDownRight className="h-3 w-3" />
                  <span>{isReplying ? "Cancel" : "Reply"}</span>
                </button>
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className="flex items-center gap-1 font-sans text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest cursor-pointer"
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>{comment.likes || 0} Likes</span>
                </button>
              </div>

              {isReplying && (
                <form
                  onSubmit={(e) => handleAddComment(e, comment.id)}
                  className="mt-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
                >
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Replying as: <span className="text-slate-700 dark:text-slate-300 font-extrabold">{user?.name}</span>
                  </div>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.author}...`}
                    className="w-full font-sans text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 h-20 resize-none"
                    required
                    maxLength={550}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!replyContent.trim()}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-[10px] font-sans font-bold uppercase tracking-wider disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Post Reply
                    </button>
                  </div>
                </form>
              )}

              {renderCommentTree(comment.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-white dark:bg-slate-950" id={`article-view-${article.id}`}>
      <div className="absolute top-0 left-0 z-50 h-[4px] w-full bg-slate-100 dark:bg-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-[0_1px_6px_rgba(99,102,241,0.5)] transition-all duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reading Action Bar */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200/50 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 px-4 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          id="back-to-feed-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={handleShare}
              className="rounded-full p-2 text-slate-550 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors cursor-pointer"
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
                  className="absolute right-0 top-full mt-2 z-50 rounded-xl bg-slate-900 text-white text-[10px] px-3 py-1.5 whitespace-nowrap font-sans font-bold uppercase tracking-wider shadow-md"
                >
                  Copied to Clipboard!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={scrollToComments}
            className="rounded-full p-2 text-slate-550 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
            id="comments-shortcut-btn"
            title="Jump to Discourse"
          >
            <MessageSquare className="h-4 w-4" />
            {comments.length > 0 && (
              <span className="text-[9px] font-sans font-black bg-indigo-600 text-white rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {comments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowAiCompanion(!showAiCompanion)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              showAiCompanion
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
            }`}
            id="ai-companion-toggle"
          >
            <Sparkles className="h-3 w-3" />
            <span>Ai Summary</span>
          </button>

          <button
            onClick={onToggleSave}
            className={`rounded-full p-2 transition-colors cursor-pointer ${
              isSaved
                ? "text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
            }`}
            id="bookmark-btn"
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Split Reading Container */}
      <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        <div ref={articleRef} className="h-full flex-1 overflow-y-auto px-4 py-8 sm:px-8 md:px-12 lg:px-16">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {article.category}
              </span>
              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-slate-850 dark:text-white sm:text-4xl md:text-5xl">
                {article.title}
              </h1>
              <p className="mt-3 text-base text-slate-500 dark:text-slate-400 sm:text-lg italic">
                {article.subtitle}
              </p>
            </div>

            <div className="my-6 flex items-center gap-3 border-y border-slate-200/50 dark:border-slate-800/80 py-4">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full object-cover grayscale"
              />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-250">
                  {article.author.name}
                </p>
                <p className="text-xs text-slate-450 dark:text-slate-500">
                  {article.author.role} • {article.date} • {article.readTime}
                </p>
              </div>
            </div>

            <div className="mb-8 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 shadow-sm">
              <img
                src={article.imageUrl}
                alt={article.imageAlt}
                referrerPolicy="no-referrer"
                className="w-full object-cover max-h-[350px]"
              />
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              {isExpanding ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                  <p className="text-sm font-semibold text-slate-550">Receiving full dispatch...</p>
                </div>
              ) : (
                parseMarkdown(articleContent)
              )}
            </div>

            <div className="my-12 flex flex-col items-center justify-center border-t border-slate-200/60 dark:border-slate-850 pt-8 text-center">
              <BookOpen className="h-6 w-6 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-semibold tracking-wider text-slate-450 uppercase">
                End of Reading
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Article</span>
                </button>
                <button
                  onClick={() => setShowAiCompanion(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-5 py-2.5 text-xs font-bold hover:bg-indigo-100/50 transition-all cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Discuss Article</span>
                </button>
                <button
                  onClick={() => setShowQuizModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
                >
                  <Brain className="h-4 w-4" />
                  <span>Take Quiz</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div ref={commentsSectionRef} className="mt-16 border-t border-slate-200/60 dark:border-slate-850 pt-12 pb-24" id="comments-section">
              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-black text-indigo-600 dark:text-indigo-400">
                    Community Discourse
                  </span>
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-850 dark:text-white sm:text-3xl mt-1">
                    Discussion & Letters
                  </h2>
                </div>
                <div className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-indigo-755 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/30">
                  {comments.length} Letters
                </div>
              </div>

              <form onSubmit={(e) => handleAddComment(e, null)} className="mb-10 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 backdrop-blur-md space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-450">
                  Signing Letter as: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{user?.name}</span>
                </div>
                <div>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Share your thoughts, analysis, or critique on this thesis..."
                    className="w-full font-sans text-sm border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 h-28 resize-none transition-all placeholder:text-slate-400"
                    required
                    maxLength={1000}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newContent.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-widest hover:bg-indigo-750 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Post Letter</span>
                  </button>
                </div>
              </form>

              {isLoadingComments ? (
                <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
                  <span className="animate-pulse font-sans font-bold tracking-widest uppercase text-[10px] text-indigo-500">Loading Discourse...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800">
                  <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="font-serif text-base italic text-slate-550 dark:text-slate-450 font-medium">No discourse has started yet.</p>
                  <p className="font-sans text-xs text-slate-400 mt-1">Be the first to submit a letter to the editor.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {renderCommentTree(null)}
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showAiCompanion && <AISidebar article={article} onClose={() => setShowAiCompanion(false)} />}
        </AnimatePresence>
      </div>

      {showQuizModal && (
        <QuizModal
          articleId={article.id}
          articleContent={articleContent}
          onClose={() => setShowQuizModal(false)}
        />
      )}
    </div>
  );
}
