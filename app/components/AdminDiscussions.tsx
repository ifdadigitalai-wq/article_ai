"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, RefreshCw, Send, AlertTriangle, Search, Filter, ShieldCheck, CornerDownRight, BookOpen, ExternalLink } from "lucide-react";

interface CommentItem {
  id: string;
  articleId: string;
  articleTitle: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  likes: number;
  author: string;
  authorRole: string;
  authorDept: string;
  authorAvatar: string;
}

interface ThreadItem extends CommentItem {
  replies: CommentItem[];
}

interface AdminDiscussionsProps {
  onSelectArticle?: (articleId: string) => void;
}

export default function AdminDiscussions({ onSelectArticle }: AdminDiscussionsProps) {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All Topics");

  // In-place reply inputs
  const [replyText, setReplyText] = useState<{ [commentId: string]: string }>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/comments");
      if (!res.ok) {
        throw new Error("Failed to fetch student discussions.");
      }
      const rawComments: CommentItem[] = await res.json();

      // Separate top-level comments and replies
      const parentComments = rawComments.filter((c) => !c.parentId);
      const replies = rawComments.filter((c) => c.parentId);

      // Assemble threads
      const assembledThreads = parentComments.map((parent) => {
        const parentReplies = replies
          .filter((r) => r.parentId === parent.id)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // oldest replies first
        return {
          ...parent,
          replies: parentReplies,
        };
      });

      setThreads(assembledThreads);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostReply = async (parentComment: CommentItem) => {
    const content = replyText[parentComment.id];
    if (!content || !content.trim()) return;

    setSubmittingReplyId(parentComment.id);
    try {
      const res = await fetch(`/api/articles/${parentComment.articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentComment.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to post reply.");
      }

      const newReply: CommentItem = await res.json();

      // Update local state
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id === parentComment.id) {
            return {
              ...thread,
              replies: [...thread.replies, newReply],
            };
          }
          return thread;
        })
      );

      // Clear input
      setReplyText((prev) => ({ ...prev, [parentComment.id]: "" }));
    } catch (err: any) {
      alert(err.message || "Could not post your reply.");
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const getAvatarEmoji = (avatar: string) => {
    const match = [
      { id: "scholar", emoji: "🎓" },
      { id: "creator", emoji: "💡" },
      { id: "artist", emoji: "🎨" },
      { id: "explorer", emoji: "🚀" },
      { id: "researcher", emoji: "🔬" },
    ].find((a) => a.id === avatar);
    return match ? match.emoji : "🎓";
  };

  // Get list of unique topic titles for filter dropdown
  const uniqueTopics = ["All Topics", ...Array.from(new Set(threads.map((t) => t.articleTitle)))];

  // Filter threads based on search query and topic filter
  const filteredThreads = threads.filter((thread) => {
    const matchesTopic = selectedTopic === "All Topics" || thread.articleTitle === selectedTopic;
    const matchesSearch =
      thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.articleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.replies.some((r) => r.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 justify-center md:justify-start">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Student Discussions & Complaints</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Moderate, review, and reply to student thoughts and feedback posted on syllabus contents.
          </p>
        </div>

        <button
          onClick={fetchComments}
          disabled={isLoading}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-350 disabled:opacity-50"
          title="Refresh discussions"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-455 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions by comment text, student name, or topic..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer appearance-none"
          >
            {uniqueTopics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discussions Thread List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Loading discussions...</span>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 text-slate-400 dark:text-slate-550">
          <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="font-bold text-sm">No discussions found</p>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">
            Students haven't commented on any resources matching your search.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredThreads.map((thread) => (
            <div
              key={thread.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs hover:border-slate-350 dark:hover:border-slate-750 transition-all space-y-4"
            >
              {/* Context bar (Topic/Article Name) */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-850">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Discussion on Article</span>
                </span>
                <a
                  href={`/?article=${thread.articleId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (onSelectArticle && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                      e.preventDefault();
                      onSelectArticle(thread.articleId);
                    }
                  }}
                  className="text-xs font-bold text-indigo-650 hover:text-indigo-750 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline flex items-center gap-1.5 truncate max-w-[80%]"
                >
                  <span>{thread.articleTitle}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>

              {/* Student Post */}
              <div className="flex gap-3 items-start">
                <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/40 text-xl flex shrink-0 items-center justify-center rounded-xl border border-indigo-100/30">
                  {getAvatarEmoji(thread.authorAvatar)}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                        {thread.author}
                      </span>
                      <span className="text-[10px] text-slate-450">
                        ({thread.authorRole} • {thread.authorDept})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {new Date(thread.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans pr-2">
                    {thread.content}
                  </p>
                </div>
              </div>

              {/* Nested Replies */}
              {thread.replies.length > 0 && (
                <div className="pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-3 pt-2">
                  {thread.replies.map((reply) => {
                    const isOfficialReply = reply.authorRole === "admin" || reply.authorRole === "faculty";
                    return (
                      <div key={reply.id} className="flex gap-2.5 items-start">
                        <CornerDownRight className="w-4 h-4 text-slate-350 dark:text-slate-600 mt-1 shrink-0" />
                        <div className="h-7 w-7 bg-slate-50 dark:bg-slate-950 text-base flex shrink-0 items-center justify-center rounded-lg border border-slate-200/40">
                          {getAvatarEmoji(reply.authorAvatar)}
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {reply.author}
                              </span>
                              {isOfficialReply ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-md uppercase">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  <span>Official</span>
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400">
                                  ({reply.authorRole})
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {new Date(reply.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-sans pr-2">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Admin Quick Reply Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePostReply(thread);
                }}
                className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={replyText[thread.id] || ""}
                  onChange={(e) =>
                    setReplyText((prev) => ({ ...prev, [thread.id]: e.target.value }))
                  }
                  placeholder="Post an official reply to this student..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  disabled={submittingReplyId === thread.id}
                />
                <button
                  type="submit"
                  disabled={submittingReplyId === thread.id || !(replyText[thread.id] || "").trim()}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
