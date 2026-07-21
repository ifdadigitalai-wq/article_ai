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
  Trash2,
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
  user: { id: string; name: string; email: string; role: string; branch: string } | null;
  onDeleteSuccess?: (articleId: string) => void;
  triggerScrollToComments?: boolean;
}

export default function ArticleView({
  article,
  onBack,
  isSaved,
  onToggleSave,
  onRecordCompleted,
  user,
  onDeleteSuccess,
  triggerScrollToComments = false,
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

  // Reader Customization States
  const [readerFont, setReaderFont] = useState<"serif" | "sans">("serif");
  const [readerSize, setReaderSize] = useState<"sm" | "base" | "lg" | "xl">("lg");
  const [readerTheme, setReaderTheme] = useState<"light" | "sepia" | "charcoal" | "dark">("light");
  const [showReaderSettings, setShowReaderSettings] = useState(false);

  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [article.id]);

  // Persistent settings loading
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFont = localStorage.getItem("reader-font") as any;
      const savedSize = localStorage.getItem("reader-size") as any;
      const savedTheme = localStorage.getItem("reader-theme") as any;
      if (savedFont) setReaderFont(savedFont);
      if (savedSize) setReaderSize(savedSize);
      if (savedTheme) setReaderTheme(savedTheme);
    }
  }, []);

  const changeReaderFont = (font: "serif" | "sans") => {
    setReaderFont(font);
    localStorage.setItem("reader-font", font);
  };

  const changeReaderSize = (size: "sm" | "base" | "lg" | "xl") => {
    setReaderSize(size);
    localStorage.setItem("reader-size", size);
  };

  const changeReaderTheme = (theme: "light" | "sepia" | "charcoal" | "dark") => {
    setReaderTheme(theme);
    localStorage.setItem("reader-theme", theme);
  };

  // Close reader settings on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (settingsPanelRef.current && !settingsPanelRef.current.contains(e.target as Node)) {
        setShowReaderSettings(false);
      }
    };
    if (showReaderSettings) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showReaderSettings]);

  // Dynamic Theme Definitions
  const themeClasses = {
    light: {
      bg: "bg-white",
      pageBg: "bg-slate-50/50",
      text: "text-slate-800",
      title: "text-slate-950",
      subtitle: "text-slate-500",
      border: "border-slate-200/60",
      meta: "text-slate-500",
      commentBg: "bg-slate-50",
      commentCard: "bg-slate-50 border-slate-200/60",
    },
    sepia: {
      bg: "bg-[#faf6ee]",
      pageBg: "bg-[#f5ebd3]",
      text: "text-[#3c3022]",
      title: "text-[#2a2014]",
      subtitle: "text-[#5c4a36]",
      border: "border-[#e6d8ba]",
      meta: "text-[#705c47]",
      commentBg: "bg-[#f5efe2]",
      commentCard: "bg-[#f5efe2] border-[#ebdcb9]",
    },
    charcoal: {
      bg: "bg-slate-900",
      pageBg: "bg-slate-950",
      text: "text-slate-350",
      title: "text-slate-100",
      subtitle: "text-slate-400",
      border: "border-slate-800",
      meta: "text-slate-500",
      commentBg: "bg-slate-900/50",
      commentCard: "bg-slate-900/50 border-slate-800/80",
    },
    dark: {
      bg: "bg-black",
      pageBg: "bg-black",
      text: "text-slate-300",
      title: "text-white",
      subtitle: "text-slate-400",
      border: "border-zinc-900",
      meta: "text-slate-500",
      commentBg: "bg-zinc-950",
      commentCard: "bg-zinc-950 border-zinc-900",
    },
  }[readerTheme];

  const sizeClasses = {
    sm: "text-sm sm:text-base leading-[1.65]",
    base: "text-base sm:text-lg leading-[1.7]",
    lg: "text-lg sm:text-xl leading-[1.75]",
    xl: "text-xl sm:text-2xl leading-[1.8]",
  }[readerSize];

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

  useEffect(() => {
    if (triggerScrollToComments && !isLoadingComments && commentsSectionRef.current) {
      const timer = setTimeout(() => {
        commentsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [triggerScrollToComments, isLoadingComments]);

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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this custom article? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (onDeleteSuccess) {
          onDeleteSuccess(article.id);
        } else {
          onBack();
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete article");
      }
    } catch (err) {
      console.error("Error deleting article:", err);
      alert("An error occurred while deleting the article");
    } finally {
      setIsDeleting(false);
    }
  };

  const scrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getAvatarUrl = (avatar: string): string => {
    if (!avatar) return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80";
    if (avatar.startsWith("/") || avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("data:")) {
      return avatar;
    }
    
    const avatarMap: Record<string, string> = {
      scholar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&q=80",
      mentor: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&q=80",
      tech: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&q=80",
      creative: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80"
    };
    
    return avatarMap[avatar] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80";
  };

  const preProcessMarkdown = (text: string): string => {
    if (!text) return "";
    return text
      // Fix inline blockquotes (e.g., "text. > quote")
      .replace(/([^\n])\s*>\s+/g, "$1\n> ")
      // Fix inline list items (e.g., "text. * item" or "text. - item")
      .replace(/([^\n])\s+[\*\-]\s+/g, "$1\n* ")
      // Fix inline headings (e.g., "text. ## Heading")
      .replace(/([^\n#])\s*(#{1,6})\s+/g, "$1\n$2 ")
      // Normalize multiple newlines
      .replace(/\n{3,}/g, "\n\n");
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    if (!text) return "";
    // Extended regex: links, bold, italic, inline code
    const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const parts = text.split(tokenRegex);
    const elements: React.ReactNode[] = [];
    // Use matchAll to properly handle link groups
    let lastIndex = 0;
    const matches = Array.from(text.matchAll(tokenRegex));
    
    if (matches.length === 0) return text;
    
    matches.forEach((match, idx) => {
      // Add text before this match
      if (match.index !== undefined && match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index));
      }
      const fullMatch = match[0];
      
      // Markdown link: [text](url)
      if (match[2] && match[3]) {
        elements.push(
          <a key={`link-${idx}`} href={match[3]} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500/30 hover:decoration-indigo-500 transition-colors">
            {match[2]}
          </a>
        );
      } else if (fullMatch.startsWith("**") && fullMatch.endsWith("**")) {
        elements.push(
          <strong key={`b-${idx}`} className="font-extrabold text-slate-950 dark:text-white transition-colors duration-300">
            {fullMatch.slice(2, -2)}
          </strong>
        );
      } else if (fullMatch.startsWith("*") && fullMatch.endsWith("*")) {
        elements.push(
          <em key={`i-${idx}`} className="italic text-slate-800 dark:text-slate-200 transition-colors duration-300">
            {fullMatch.slice(1, -1)}
          </em>
        );
      } else if (fullMatch.startsWith("`") && fullMatch.endsWith("`")) {
        elements.push(
          <code key={`c-${idx}`} className="px-1.5 py-0.5 rounded bg-slate-100/80 dark:bg-slate-800/80 font-mono text-sm text-indigo-600 dark:text-indigo-400">
            {fullMatch.slice(1, -1)}
          </code>
        );
      } else {
        elements.push(fullMatch);
      }
      
      lastIndex = (match.index || 0) + fullMatch.length;
    });
    
    // Add remaining text after last match
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }
    
    return elements;
  };
  
  // Render text with line breaks preserved (splits on \n and inserts <br/>)
  const renderWithLineBreaks = (text: string): React.ReactNode => {
    if (!text) return "";
    const lines = text.split("\n");
    if (lines.length === 1) return renderInlineMarkdown(text);
    return lines.map((line, i) => (
      <React.Fragment key={i}>
        {renderInlineMarkdown(line)}
        {i < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Line-by-line streaming block parser to prevent single-newline heading errors
  const parseMarkdown = (rawText: string) => {
    if (!rawText) return null;
    const cleanMarkdown = preProcessMarkdown(rawText);
    const lines = cleanMarkdown.split("\n");

    interface Block {
      type: "h1" | "h2" | "h3" | "h4" | "h5" | "blockquote" | "ul" | "ol" | "p" | "hr";
      lines: string[];
    }

    const blocks: Block[] = [];
    let currentBlock: Block | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed === "") {
        currentBlock = null;
        continue;
      }

      // Check for horizontal rule
      if (trimmed === "***" || trimmed === "---" || trimmed === "___") {
        blocks.push({ type: "hr", lines: [] });
        currentBlock = null;
        continue;
      }

      // Check for headings
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/) || trimmed.match(/^(#{1,6})([^#\s].*)$/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        const type = `h${Math.min(level, 5)}` as any;
        blocks.push({ type, lines: [text] });
        currentBlock = null;
        continue;
      }

      // Check for blockquote
      if (trimmed.startsWith(">")) {
        const text = trimmed.substring(1).trim();
        if (currentBlock && currentBlock.type === "blockquote") {
          currentBlock.lines.push(text);
        } else {
          currentBlock = { type: "blockquote", lines: [text] };
          blocks.push(currentBlock);
        }
        continue;
      }

      // Check for list item (unordered)
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed === "*" || trimmed === "-") {
        const text = (trimmed === "*" || trimmed === "-") ? "" : trimmed.substring(2).trim();
        if (currentBlock && currentBlock.type === "ul") {
          currentBlock.lines.push(text);
        } else {
          currentBlock = { type: "ul", lines: [text] };
          blocks.push(currentBlock);
        }
        continue;
      }

      // Check for list item (ordered)
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        const text = olMatch[2].trim();
        if (currentBlock && currentBlock.type === "ol") {
          currentBlock.lines.push(text);
        } else {
          currentBlock = { type: "ol", lines: [text] };
          blocks.push(currentBlock);
        }
        continue;
      }

      // Standard paragraph line
      if (currentBlock && currentBlock.type === "p") {
        currentBlock.lines.push(line);
      } else {
        currentBlock = { type: "p", lines: [line] };
        blocks.push(currentBlock);
      }
    }

    return blocks.map((block, blockIndex) => {
      const textContent = block.lines.join("\n");
      let headingFont = "font-display";
      let bodyFont = "font-serif";

      if (readerFont === "sans") {
        headingFont = "font-sans";
        bodyFont = "font-sans";
      } else {
        if (article.headingFont) {
          headingFont = `font-heading-${article.headingFont}`;
        }
        if (article.paragraphFont) {
          bodyFont = `font-body-${article.paragraphFont}`;
        }
      }

      switch (block.type) {
        case "h1":
          return (
            <h2
              key={blockIndex}
              className={`${headingFont} text-2xl sm:text-3xl font-black ${themeClasses.title} mt-10 mb-4.5 leading-tight tracking-tight text-balance transition-colors duration-300`}
            >
              {renderInlineMarkdown(textContent)}
            </h2>
          );
        case "h2":
          return (
            <h3
              key={blockIndex}
              className={`${headingFont} text-xl sm:text-2xl font-extrabold ${themeClasses.title} mt-8 mb-4 leading-tight tracking-tight text-balance transition-colors duration-300`}
            >
              {renderInlineMarkdown(textContent)}
            </h3>
          );
        case "h3":
          return (
            <h4
              key={blockIndex}
              className={`${headingFont} text-lg sm:text-xl font-bold ${themeClasses.title} mt-7 mb-3.5 leading-snug tracking-tight text-balance transition-colors duration-300`}
            >
              {renderInlineMarkdown(textContent)}
            </h4>
          );
        case "h4":
          return (
            <h5
              key={blockIndex}
              className={`${headingFont} text-base sm:text-lg font-bold ${themeClasses.title} mt-6 mb-3 leading-snug tracking-tight text-balance transition-colors duration-300`}
            >
              {renderInlineMarkdown(textContent)}
            </h5>
          );
        case "h5":
          return (
            <h6
              key={blockIndex}
              className={`${headingFont} text-sm sm:text-base font-bold ${themeClasses.title} mt-5 mb-2.5 leading-snug tracking-tight text-balance transition-colors duration-300`}
            >
              {renderInlineMarkdown(textContent)}
            </h6>
          );
        case "blockquote":
          return (
            <blockquote
              key={blockIndex}
              className={`border-l-4 border-indigo-500 pl-5 py-2 my-8 ${bodyFont} italic ${themeClasses.text} bg-indigo-500/5 dark:bg-indigo-950/20 rounded-r-xl pr-5 leading-relaxed transition-colors duration-300`}
            >
              {renderWithLineBreaks(textContent)}
            </blockquote>
          );
        case "ul":
          return (
            <ul
              key={blockIndex}
              className={`list-disc pl-6 mb-6 space-y-2.5 ${bodyFont} ${sizeClasses} ${themeClasses.text} transition-colors duration-300`}
            >
              {block.lines.map((li, liIndex) => (
                <li key={liIndex} className="leading-relaxed">
                  {renderInlineMarkdown(li)}
                </li>
              ))}
            </ul>
          );
        case "ol":
          return (
            <ol
              key={blockIndex}
              className={`list-decimal pl-6 mb-6 space-y-2.5 ${bodyFont} ${sizeClasses} ${themeClasses.text} transition-colors duration-300`}
            >
              {block.lines.map((li, liIndex) => (
                <li key={liIndex} className="leading-relaxed">
                  {renderInlineMarkdown(li)}
                </li>
              ))}
            </ol>
          );
        case "hr":
          return <hr key={blockIndex} className={`my-10 border-t ${themeClasses.border} transition-colors duration-300`} />;
        case "p":
        default:
          return (
            <p
              key={blockIndex}
              className={`${bodyFont} ${sizeClasses} ${themeClasses.text} font-normal mb-6 tracking-normal transition-colors duration-300`}
            >
              {renderWithLineBreaks(textContent)}
            </p>
          );
      }
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
              className={`group/comment rounded-2xl p-4 border transition-all duration-300 ${themeClasses.commentCard}`}
              id={`comment-card-${comment.id}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-serif text-[10px] font-black uppercase">
                    {comment.author.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-sans text-xs font-black ${themeClasses.title}`}>
                      {comment.author}
                    </span>
                    {comment.authorRole && (
                      <span className={`text-[8px] ${themeClasses.meta} font-bold uppercase tracking-wider`}>
                        {comment.authorRole} • {comment.authorBranch}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`font-sans text-[10px] ${themeClasses.meta}`}>
                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className={`font-sans text-sm ${themeClasses.text} leading-relaxed mb-3 whitespace-pre-wrap`}>
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
                  className={`flex items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-widest cursor-pointer ${themeClasses.meta} hover:text-indigo-600 dark:hover:text-indigo-400`}
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>{comment.likes || 0} Likes</span>
                </button>
              </div>

              {isReplying && (
                <form
                  onSubmit={(e) => handleAddComment(e, comment.id)}
                  className={`mt-4 p-4 border rounded-xl space-y-3 transition-colors duration-300 ${themeClasses.bg} ${themeClasses.border}`}
                >
                  <div className={`text-[10px] uppercase tracking-wider font-bold ${themeClasses.meta}`}>
                    Replying as: <span className={`${themeClasses.title} font-extrabold`}>{user?.name}</span>
                  </div>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.author}...`}
                    className={`w-full font-sans text-xs border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20 resize-none transition-colors duration-300 ${themeClasses.commentBg} ${themeClasses.border} ${themeClasses.text}`}
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

  let headingFontClass = "font-display";
  let bodyFontClass = "font-serif";

  if (readerFont === "sans") {
    headingFontClass = "font-sans";
    bodyFontClass = "font-sans";
  } else {
    if (article.headingFont) {
      headingFontClass = `font-heading-${article.headingFont}`;
    }
    if (article.paragraphFont) {
      bodyFontClass = `font-body-${article.paragraphFont}`;
    }
  }

  return (
    <div className={`relative flex h-screen w-full flex-col transition-colors duration-300 ${themeClasses.bg}`} id={`article-view-${article.id}`}>
      <div className="absolute top-0 left-0 z-50 h-[4px] w-full bg-slate-100 dark:bg-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-[0_1px_6px_rgba(99,102,241,0.5)] transition-all duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reading Action Bar */}
      <div className={`flex h-14 items-center justify-between border-b transition-colors duration-300 px-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md ${themeClasses.border}`}>
        <button
          onClick={onBack}
          className={`flex items-center gap-1 text-sm font-semibold hover:text-indigo-600 transition-colors cursor-pointer ${themeClasses.meta}`}
          id="back-to-feed-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={handleShare}
              className={`rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer ${themeClasses.meta}`}
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
            className={`rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-1 cursor-pointer ${themeClasses.meta}`}
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

          {/* Reader Settings Toggle */}
          <div className="relative" ref={settingsPanelRef}>
            <button
              onClick={() => setShowReaderSettings(!showReaderSettings)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold font-sans transition-colors cursor-pointer border ${
                showReaderSettings
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : `border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 ${themeClasses.meta}`
              }`}
              id="reader-settings-toggle"
              title="Typography & Theme Settings"
            >
              Aa
            </button>
            
            {showReaderSettings && (
              <div className={`absolute right-0 top-full mt-2.5 z-50 w-72 rounded-2xl border p-4 shadow-xl flex flex-col gap-4 animate-fadeIn transition-colors duration-300 ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`}>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Font Style</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => changeReaderFont("serif")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold border transition-all cursor-pointer ${
                        readerFont === "serif"
                          ? "border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-serif"
                          : `${themeClasses.border} hover:bg-slate-500/5`
                      }`}
                    >
                      <span className="font-serif font-black text-sm">A</span>
                      <span className="font-serif">Serif</span>
                    </button>
                    <button
                      onClick={() => changeReaderFont("sans")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold border transition-all cursor-pointer ${
                        readerFont === "sans"
                          ? "border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-sans"
                          : `${themeClasses.border} hover:bg-slate-500/5`
                      }`}
                    >
                      <span className="font-sans font-black text-sm">A</span>
                      <span className="font-sans">Sans</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Text Size</span>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (readerSize === "xl") changeReaderSize("lg");
                        else if (readerSize === "lg") changeReaderSize("base");
                        else if (readerSize === "base") changeReaderSize("sm");
                      }}
                      disabled={readerSize === "sm"}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-30 ${themeClasses.border} hover:bg-slate-500/5`}
                      title="Decrease font size"
                    >
                      A-
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-500/5 px-3 py-1 rounded-lg">
                      {readerSize === "sm" && "Small"}
                      {readerSize === "base" && "Medium"}
                      {readerSize === "lg" && "Large"}
                      {readerSize === "xl" && "Extra Large"}
                    </span>
                    <button
                      onClick={() => {
                        if (readerSize === "sm") changeReaderSize("base");
                        else if (readerSize === "base") changeReaderSize("lg");
                        else if (readerSize === "lg") changeReaderSize("xl");
                      }}
                      disabled={readerSize === "xl"}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border text-base font-bold transition-all cursor-pointer disabled:opacity-30 ${themeClasses.border} hover:bg-slate-500/5`}
                      title="Increase font size"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Reading Mode</span>
                  <div className="grid grid-cols-4 gap-2">
                    {/* Light */}
                    <button
                      onClick={() => changeReaderTheme("light")}
                      className={`flex h-10 w-full items-center justify-center rounded-xl border transition-all cursor-pointer bg-white text-slate-800 ${
                        readerTheme === "light" ? "ring-2 ring-indigo-500 border-transparent scale-103" : "border-slate-200"
                      }`}
                      title="Light Theme"
                    >
                      <span className="text-[10px] font-extrabold font-sans">Aa</span>
                    </button>
                    {/* Sepia */}
                    <button
                      onClick={() => changeReaderTheme("sepia")}
                      className={`flex h-10 w-full items-center justify-center rounded-xl border transition-all cursor-pointer bg-[#faf6ee] text-[#3c3022] ${
                        readerTheme === "sepia" ? "ring-2 ring-indigo-500 border-transparent scale-103" : "border-[#ebdcb9]"
                      }`}
                      title="Sepia Theme"
                    >
                      <span className="text-[10px] font-extrabold font-serif">Aa</span>
                    </button>
                    {/* Charcoal */}
                    <button
                      onClick={() => changeReaderTheme("charcoal")}
                      className={`flex h-10 w-full items-center justify-center rounded-xl border transition-all cursor-pointer bg-slate-800 text-slate-200 ${
                        readerTheme === "charcoal" ? "ring-2 ring-indigo-500 border-transparent scale-103" : "border-slate-700"
                      }`}
                      title="Charcoal Theme"
                    >
                      <span className="text-[10px] font-extrabold font-sans">Aa</span>
                    </button>
                    {/* Dark */}
                    <button
                      onClick={() => changeReaderTheme("dark")}
                      className={`flex h-10 w-full items-center justify-center rounded-xl border transition-all cursor-pointer bg-black text-slate-200 ${
                        readerTheme === "dark" ? "ring-2 ring-indigo-500 border-transparent scale-103" : "border-zinc-800"
                      }`}
                      title="Midnight Theme"
                    >
                      <span className="text-[10px] font-extrabold font-sans">Aa</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Button (only for creator or admin) */}
          {article.isCustom && user && (user.id === article.createdBy || user.role === "admin") && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`rounded-full p-2 transition-colors cursor-pointer text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50`}
              id="delete-article-btn"
              title="Delete Article"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}

          <button
            onClick={onToggleSave}
            className={`rounded-full p-2 transition-colors cursor-pointer ${
              isSaved
                ? "text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20"
                : `hover:bg-slate-100 dark:hover:bg-slate-900 ${themeClasses.meta}`
            }`}
            id="bookmark-btn"
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Split Reading Container */}
      <div className={`flex h-[calc(100vh-3.5rem)] w-full overflow-hidden transition-colors duration-300 ${themeClasses.pageBg}`}>
        <div 
          ref={articleRef} 
          className={`h-full flex-1 overflow-y-auto px-4 py-8 sm:px-8 md:px-12 lg:px-16 transition-colors duration-300 ${themeClasses.bg} ${themeClasses.text}`}
        >
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {article.category}
              </span>
              <h1 className={`mt-2 ${headingFontClass} text-3xl font-extrabold leading-tight ${themeClasses.title} sm:text-4xl md:text-5xl tracking-tight text-balance transition-colors duration-300`}>
                {article.title}
              </h1>
              <p className={`mt-3 ${bodyFontClass} text-base sm:text-lg italic ${themeClasses.subtitle} transition-colors duration-300`}>
                {article.subtitle}
              </p>
            </div>

            <div className={`my-6 flex items-center gap-3 border-y py-4 transition-colors duration-300 ${themeClasses.border}`}>
              <img
                src={getAvatarUrl(article.author.avatar)}
                alt={article.author.name}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className={`text-sm font-bold ${themeClasses.title} transition-colors duration-300`}>
                  {article.author.name}
                </p>
                <p className={`text-xs ${themeClasses.meta} transition-colors duration-300`}>
                  {article.author.role} • {article.date} • {article.readTime}
                </p>
              </div>
            </div>

            <div className={`mb-8 overflow-hidden rounded-2xl shadow-sm transition-all duration-300 border flex items-center justify-center relative aspect-video ${themeClasses.border} ${themeClasses.commentBg}`}>
              {imgError || !article.imageUrl ? (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-slate-500/5 flex flex-col items-center justify-center p-6 text-center select-none">
                  <BookOpen className="w-12 h-12 text-indigo-500/60 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">{article.category}</span>
                  <span className="text-sm font-serif italic mt-1 opacity-70">{article.title}</span>
                </div>
              ) : (
                <img
                  src={article.imageUrl}
                  alt={article.imageAlt}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover max-h-[400px] hover:scale-[1.01] transition-transform duration-500"
                />
              )}
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              {isExpanding ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                  <p className="text-sm font-semibold text-slate-500">Receiving full dispatch...</p>
                </div>
              ) : (
                parseMarkdown(articleContent)
              )}
            </div>

            <div className={`my-12 flex flex-col items-center justify-center border-t pt-8 text-center transition-colors duration-300 ${themeClasses.border}`}>
              <BookOpen className={`h-6 w-6 mb-2 ${themeClasses.meta} transition-colors duration-300`} />
              <p className={`text-xs font-semibold tracking-wider uppercase ${themeClasses.meta} transition-colors duration-300`}>
                End of Reading
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleShare}
                  className={`flex items-center gap-1.5 rounded-xl border px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${themeClasses.bg} ${themeClasses.border} ${themeClasses.title} hover:bg-slate-500/5`}
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
            <div ref={commentsSectionRef} className={`mt-16 border-t pt-12 pb-24 transition-colors duration-300 ${themeClasses.border}`} id="comments-section">
              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-black text-indigo-600 dark:text-indigo-400">
                    Community Discourse
                  </span>
                  <h2 className={`font-serif text-2xl font-bold tracking-tight ${themeClasses.title} sm:text-3xl mt-1`}>
                    Discussion & Letters
                  </h2>
                </div>
                <div className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-indigo-755 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/30">
                  {comments.length} Letters
                </div>
              </div>

              <form onSubmit={(e) => handleAddComment(e, null)} className={`mb-10 p-5 rounded-2xl border backdrop-blur-md space-y-4 transition-colors duration-300 ${themeClasses.commentCard}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${themeClasses.meta}`}>
                  Signing Letter as: <span className={`${themeClasses.title} font-extrabold`}>{user?.name}</span>
                </div>
                <div>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Share your thoughts, analysis, or critique on this thesis..."
                    className={`w-full font-sans text-sm border rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-28 resize-none transition-colors placeholder:text-slate-400 ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`}
                    required
                    maxLength={1000}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newContent.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
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
                <div className={`text-center py-12 rounded-2xl border border-dashed transition-colors duration-300 ${themeClasses.border}`}>
                  <MessageSquare className={`h-8 w-8 mx-auto mb-3 ${themeClasses.meta}`} />
                  <p className="font-serif text-base italic font-medium">No discourse has started yet.</p>
                  <p className={`font-sans text-xs mt-1 ${themeClasses.meta}`}>Be the first to submit a letter to the editor.</p>
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
