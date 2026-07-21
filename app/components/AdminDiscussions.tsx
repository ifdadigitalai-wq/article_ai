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
  authorBranch: string;
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

  const renderAvatar = (
    avatar: string,
    authorName: string,
    authorRole: string,
    sizeClass = "h-10 w-10 text-lg",
    imgSizeClass = "rounded-xl"
  ) => {
    const isStaff =
      authorRole === "admin" ||
      authorRole === "faculty" ||
      authorRole === "Official" ||
      authorRole?.toLowerCase().includes("professor") ||
      authorRole?.toLowerCase().includes("staff") ||
      authorRole?.toLowerCase().includes("admin") ||
      authorRole?.toLowerCase().includes("faculty") ||
      authorRole?.toLowerCase().includes("administrator");

    if (avatar && (avatar.startsWith("/") || avatar.startsWith("http") || avatar.startsWith("data:"))) {
      return (
        <img
          src={avatar}
          alt="Avatar"
          className={`${sizeClass} object-cover ${imgSizeClass} shadow`}
        />
      );
    }

    if (isStaff) {
      return (
        <div className={`${sizeClass} flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold uppercase shadow overflow-hidden ` + (imgSizeClass === "rounded-xl" ? " rounded-xl text-sm" : " rounded-lg text-xs")}>
          {authorName ? authorName.slice(0, 2).toUpperCase() : "ST"}
        </div>
      );
    }

    return (
      <div className={`${sizeClass} flex items-center justify-center bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow ` + (imgSizeClass === "rounded-xl" ? " rounded-xl" : " rounded-lg")}>
        {getAvatarEmoji(avatar)}
      </div>
    );
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
  <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">

    {/* 🔥 Header */}
    <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 text-white shadow-lg">
      <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">

        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Student Discussions CRM
          </h2>
          <p className="text-sm text-white/80 mt-1">
            Manage complaints, feedback & discussions in a premium dashboard
          </p>
        </div>

        <button
          onClick={fetchComments}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>

      </div>

      {/* Glow Effect */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
    </div>

    {/* 🔍 Search + Filter */}
    <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search student, complaint, topic..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
        />
      </div>

      <select
        value={selectedTopic}
        onChange={(e) => setSelectedTopic(e.target.value)}
        className="px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm cursor-pointer"
      >
        {uniqueTopics.map((topic) => (
          <option key={topic} value={topic} className="dark:bg-slate-950 dark:text-slate-200">{topic}</option>
        ))}
      </select>

    </div>

    {/* ⚠️ Error */}
    {error && (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
        {error}
      </div>
    )}

    {/* ⏳ Loading */}
    {isLoading ? (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    ) : filteredThreads.length === 0 ? (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60">
        <MessageSquare className="mx-auto mb-3 text-slate-300" />
        <p className="text-sm font-semibold">No discussions found</p>
      </div>
    ) : (

      <div className="space-y-6">

        {filteredThreads.map((thread) => (
          <div
            key={thread.id}
            className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 hover:shadow-xl transition"
          >

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-5">

              {/* Top */}
              <div className="flex justify-between items-start">

                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">
                    Article
                  </p>

                  <a
                    href={`/?article=${thread.articleId}`}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    {thread.articleTitle}
                  </a>
                </div>

                <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-600">
                  Active
                </span>

              </div>

              {/* Student */}
              <div className="flex gap-3">

                {renderAvatar(thread.authorAvatar, thread.author, thread.authorRole)}

                <div className="flex-1">
                  <div className="flex justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {thread.author}
                      </p>
                      <p className="text-xs text-slate-400">
                        {thread.authorRole} • {thread.authorBranch}
                      </p>
                    </div>

                    <p className="text-xs text-slate-400">
                      {new Date(thread.createdAt).toLocaleString()}
                    </p>

                  </div>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {thread.content}
                  </p>
                </div>

              </div>

              {/* Replies */}
              {thread.replies.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 space-y-3 border border-slate-200/40">

                  {thread.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3">

                      {renderAvatar(reply.authorAvatar, reply.author, reply.authorRole, "h-8 w-8 text-sm", "rounded-lg")}

                      <div className="flex-1">
                        <div className="flex justify-between">

                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold">
                              {reply.author}
                            </p>

                            {(reply.authorRole === "admin" || reply.authorRole === "faculty") && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-600">
                                Official
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>

                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {reply.content}
                        </p>
                      </div>

                    </div>
                  ))}

                </div>
              )}

              {/* Reply */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handlePostReply(thread)
                }}
                className="flex gap-2 pt-2"
              >

                <input
                  value={replyText[thread.id] || ""}
                  onChange={(e) =>
                    setReplyText(prev => ({
                      ...prev,
                      [thread.id]: e.target.value
                    }))
                  }
                  placeholder="Write official reply..."
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-205 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />

                <button
                  type="submit"
                  disabled={!(replyText[thread.id] || "").trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:opacity-90 transition shadow"
                >
                  Reply
                </button>

              </form>

            </div>
          </div>
        ))}

      </div>
    )}
  </div>
)
}
