"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X, Sparkles, Send, Loader2, MessageSquare, Quote } from "lucide-react";
import { ChatMessage, Summary, Article } from "../types";

interface AISidebarProps {
  article: Article;
  onClose: () => void;
}

export default function AISidebar({ article, onClose }: AISidebarProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "discuss">("summary");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [followUpInput, setFollowUpInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when article changes
  useEffect(() => {
    setSummary(null);
    setChatMessages([]);
    setSummaryError(null);
    setFollowUpInput("");
  }, [article.id]);

  // 1. Fetch AI Summary on tab click/mount
  useEffect(() => {
    if (activeTab === "summary" && !summary) {
      fetchSummary();
    }
  }, [activeTab, article.id, summary]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim() || chatLoading) return;

    const query = followUpInput.trim();
    setFollowUpInput("");
    setActiveTab("discuss");

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...chatMessages, newMsg];
    setChatMessages(updatedHistory);
    setChatLoading(true);

    try {
      const res = await fetch("/api/discuss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.id,
          articleContent: article.content,
          messages: updatedHistory,
        }),
      });

      if (!res.ok) throw new Error("Connection to AI Editorial board failed");
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: "model",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: "model",
        text: "My apologies. I lost connection to the press wires. Could you repeat that?",
        timestamp: Math.random().toString(36).substr(2, 9),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.id,
          articleContent: article.content
        }),
      });
      if (!res.ok) throw new Error("Failed to reach summarizer engine");
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setSummaryError("Could not compile summary. Our editors are briefly offline.");
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsgText = chatInput.trim();
    setChatInput("");

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...chatMessages, newMsg];
    setChatMessages(updatedHistory);
    setChatLoading(true);

    try {
      const res = await fetch("/api/discuss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.id,
          articleContent: article.content,
          messages: updatedHistory,
        }),
      });

      if (!res.ok) throw new Error("Connection to AI Editorial board failed");
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: "model",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: "model",
        text: "My apologies. I lost connection to the press wires. Could you repeat that?",
        timestamp: Math.random().toString(36).substr(2, 9),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .minimal-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .minimal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .minimal-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(26, 26, 26, 0.15);
          border-radius: 4px;
        }
      `}</style>

      {/* Backdrop overlay for mobile only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-20 bg-charcoal/40 backdrop-blur-xs md:hidden"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="fixed md:relative right-0 top-0 z-30 h-full w-full border-l border-charcoal/10 bg-[#f4f7fb] shadow-xl md:w-96 flex flex-col backdrop-blur-sm"
        id="ai-sidebar"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-charcoal/10 p-4 bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#1d4ed8]" />
            <h2 className="font-serif text-base tracking-tight font-bold text-charcoal">
              AI Editorial Companion
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-secondary-gray hover:bg-black/5 hover:text-charcoal transition-all cursor-pointer"
            id="close-sidebar-btn"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-charcoal/10 p-2 bg-white/20">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 rounded-lg py-2 font-sans text-[10px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "summary"
                ? "bg-[#1d4ed8] text-[#f4f7fb] shadow-sm"
                : "text-secondary-gray/80 hover:text-charcoal hover:bg-black/5"
            }`}
            id="sidebar-summary-tab"
          >
            <Quote className="h-3 w-3" />
            <span>Quick Summary</span>
          </button>
          <button
            onClick={() => setActiveTab("discuss")}
            className={`flex-1 rounded-lg py-2 font-sans text-[10px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "discuss"
                ? "bg-[#1d4ed8] text-[#f4f7fb] shadow-sm"
                : "text-secondary-gray/80 hover:text-charcoal hover:bg-black/5"
            }`}
            id="sidebar-discuss-tab"
          >
            <MessageSquare className="h-3 w-3" />
            <span>Discuss with Editor</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div ref={contentContainerRef} className="flex-1 overflow-y-auto p-4 minimal-scrollbar">
          {activeTab === "summary" ? (
            /* SUMMARY PANEL */
            <div className="space-y-6">
              {summaryLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1d4ed8]" />
                  <p className="mt-4 text-xs font-semibold text-secondary-gray/80 font-sans">
                    Synthesizing article context...
                  </p>
                  <p className="mt-1 text-[10px] text-secondary-gray/60 italic font-sans">
                    Drawing deep editorial lessons
                  </p>
                </div>
              )}

              {summaryError && (
                <div className="rounded-xl bg-red-50/50 border border-red-200/50 p-4 text-center">
                  <p className="text-xs font-semibold text-red-600 font-sans">{summaryError}</p>
                  <button
                    onClick={fetchSummary}
                    className="mt-2 text-xs font-bold text-[#1d4ed8] hover:underline font-sans cursor-pointer"
                  >
                    Retry Analysis
                  </button>
                </div>
              )}

               {summary && !summaryLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  {/* Bullet Points */}
                  <div>
                    <h3 className="mb-3 font-serif tracking-tight font-bold text-[#1d4ed8] text-sm">
                      Core Arguments
                    </h3>
                    <ul className="space-y-3">
                      {summary.bulletPoints.map((point, i) => (
                        <motion.li
                          initial={{ opacity: 0, x: 5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i}
                          className="flex items-start gap-2.5 text-xs text-charcoal font-semibold leading-relaxed font-sans"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" />
                          <span>{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Takeaway */}
                  <div className="rounded-xl border border-charcoal/10 bg-[#e2e8f0]/30 backdrop-blur-sm p-4">
                    <h3 className="mb-2 font-serif tracking-tight font-bold text-[#1d4ed8] text-sm">
                      Editorial Takeaway
                    </h3>
                    <p className="font-serif text-sm italic leading-relaxed text-charcoal font-bold">
                      "{summary.keyTakeaway}"
                    </p>
                  </div>

                  {/* Follow-up Question Input Box in Quick Summary */}
                  <form onSubmit={handleFollowUpSubmit} className="mt-6 flex gap-2 border-t border-charcoal/10 pt-4 bg-white/20">
                    <input
                      type="text"
                      placeholder="Ask a follow-up question..."
                      value={followUpInput}
                      onChange={(e) => setFollowUpInput(e.target.value)}
                      disabled={chatLoading}
                      className="flex-1 rounded-xl border border-charcoal/20 bg-[#f4f7fb] px-4 py-2 text-xs text-charcoal font-semibold placeholder:text-secondary-gray/60 focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]/20 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !followUpInput.trim()}
                      className="rounded-xl bg-[#1d4ed8] p-2 text-[#f4f7fb] hover:bg-[#1d4ed8]/90 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              )}
            </div>
          ) : (
            /* DISCUSS PANEL (CHAT FEED) */
            <div className="flex h-full flex-col">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                  <MessageSquare className="h-8 w-8 text-[#1d4ed8]/30 mb-3" />
                  <p className="font-serif tracking-tight font-bold text-charcoal text-sm">
                    Consult the Chief Editor
                  </p>
                  <p className="mt-1 px-4 font-sans text-[10px] text-charcoal font-semibold leading-normal">
                    Ask deep, analytical questions about this piece or explore counter-perspectives directly with our AI editor.
                  </p>
                </div>
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto pb-4 minimal-scrollbar">
                  {chatMessages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-xs font-semibold leading-relaxed shadow-sm ${
                            isUser
                              ? "bg-[#1d4ed8] text-[#f4f7fb]"
                              : "bg-[#e2e8f0]/40 text-charcoal border border-charcoal/10 backdrop-blur-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="mt-1 font-sans text-[9px] text-charcoal font-bold px-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })}

                  {chatLoading && (
                    <div className="flex items-center gap-2 text-charcoal font-semibold font-sans">
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-[#1d4ed8]" />
                      <span className="text-[10px] italic">Editor is formulating a response...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              )}

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="mt-auto flex gap-2 border-t border-charcoal/10 pt-3 bg-white/20">
                <input
                  type="text"
                  placeholder="Ask the Editor..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  className="flex-1 rounded-xl border border-charcoal/20 bg-[#f4f7fb] px-4 py-2 text-xs text-charcoal font-semibold placeholder:text-secondary-gray/60 focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]/20 font-sans"
                  id="chat-input"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="rounded-xl bg-[#1d4ed8] p-2 text-[#f4f7fb] hover:bg-[#1d4ed8]/90 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center"
                  id="send-chat-btn"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
