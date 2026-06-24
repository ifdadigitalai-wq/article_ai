"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Send, Loader2, MessageSquare, Quote } from "lucide-react";
import { Article, ChatMessage } from "../types";

interface SummaryModalProps {
  article: Article;
  onClose: () => void;
  summary?: { bulletPoints: string[]; keyTakeaway: string } | null;
  loading?: boolean;
  error?: string | null;
}

export default function SummaryModal({
  article,
  onClose,
  summary = null,
  loading = false,
  error = null
}: SummaryModalProps) {
  const [localSummary, setLocalSummary] = useState<{ bulletPoints: string[]; keyTakeaway: string } | null>(summary);
  const [localLoading, setLocalLoading] = useState<boolean>(loading);
  const [localError, setLocalError] = useState<string | null>(error);

  const [displayedBullets, setDisplayedBullets] = useState<string[]>(["", "", ""]);
  const [displayedTakeaway, setDisplayedTakeaway] = useState<string>("");
  const [isTypingCompleted, setIsTypingCompleted] = useState<boolean>(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync prop changes if they are provided from outside (e.g. pre-fetched summary in ArticleView)
  useEffect(() => {
    if (summary !== null) {
      setLocalSummary(summary);
      setLocalLoading(loading);
      setLocalError(error);
    }
  }, [summary, loading, error]);

  // Fetch summary locally if it wasn't pre-fetched (e.g. when opened straight from the home/saved feed cards)
  useEffect(() => {
    if (summary !== null) return;

    const fetchSummaryLocally = async () => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId: article.id,
            articleContent: article.content
          })
        });
        if (!res.ok) throw new Error("Failed to summarize");
        const data = await res.json();
        if (data && (data.bulletPoints || data.keyTakeaway)) {
          setLocalSummary(data);
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        console.error("Local summary fetch error:", err);
        setLocalError("Could not compile summary. Our editors are briefly offline.");
      } finally {
        setLocalLoading(false);
      }
    };

    setLocalSummary(null);
    fetchSummaryLocally();
  }, [article.id, summary]);

  // 1. Sequential streaming/typing animation for summary text
  useEffect(() => {
    if (!localSummary) return;

    let active = true;
    let currentBulletIndex = 0;
    let currentCharIndex = 0;
    let currentBulletText = "";

    const bullets = localSummary.bulletPoints;
    const takeaway = localSummary.keyTakeaway;

    // Reset states
    setDisplayedBullets(["", "", ""]);
    setDisplayedTakeaway("");
    setIsTypingCompleted(false);

    const typeNext = () => {
      if (!active) return;

      // Type bullets one by one
      if (currentBulletIndex < bullets.length) {
        const targetText = bullets[currentBulletIndex];
        if (currentCharIndex < targetText.length) {
          currentBulletText += targetText.charAt(currentCharIndex);
          setDisplayedBullets((prev) => {
            const copy = [...prev];
            copy[currentBulletIndex] = currentBulletText;
            return copy;
          });
          currentCharIndex++;
          setTimeout(typeNext, 10); // Streaming speed
        } else {
          // Pause slightly and advance to the next bullet point
          currentBulletIndex++;
          currentCharIndex = 0;
          currentBulletText = "";
          setTimeout(typeNext, 120);
        }
      }
      // Type takeaway
      else if (currentCharIndex < takeaway.length) {
        setDisplayedTakeaway((prev) => prev + takeaway.charAt(currentCharIndex));
        currentCharIndex++;
        setTimeout(typeNext, 10);
      } else {
        // Typing finished
        setIsTypingCompleted(true);
      }
      
      // Auto scroll container down slightly during typing
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };

    typeNext();

    return () => {
      active = false;
    };
  }, [localSummary]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput("");

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setChatLoading(true);

    try {
      const res = await fetch("/api/discuss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.id,
          articleContent: article.content,
          messages: updatedHistory
        })
      });

      if (!res.ok) throw new Error("Discuss API failed");
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_reply`,
        role: "model",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: "model",
        text: "My apologies. I lost connection to the press wires. Could you repeat that?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to skip animation and show full summary immediately
  const handleSkipAnimation = () => {
    if (!localSummary || isTypingCompleted) return;
    setDisplayedBullets(localSummary.bulletPoints);
    setDisplayedTakeaway(localSummary.keyTakeaway);
    setIsTypingCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-md"
        id="modal-backdrop"
      />

      {/* Modal panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="relative flex flex-col w-full max-w-2xl bg-paper border border-border-outline/25 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] text-charcoal z-10"
        id="summary-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-secondary-gray hover:bg-black/5 hover:text-charcoal transition-all z-20 cursor-pointer"
          id="close-modal-btn"
          aria-label="Close summary modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-border-outline/10 bg-white/40 p-6 flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-[0.25em] font-sans font-bold opacity-45 block">
              Editorial Companion
            </span>
            <h2 className="font-serif text-lg font-black text-charcoal">
              AI Summary & Analysis
            </h2>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none"
        >
          {/* Summary Box */}
          <div className="space-y-6">
            {localLoading && !localSummary && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-xs font-semibold text-secondary-gray">
                  Synthesizing article context...
                </p>
                <p className="mt-1 text-[10px] text-secondary-gray/50 italic">
                  Compiling news dispatches
                </p>
              </div>
            )}

            {localError && (
              <div className="rounded-2xl bg-red-50 p-6 text-center border border-red-100">
                <p className="text-xs font-bold text-red-600">{localError}</p>
                <p className="text-[10px] text-secondary-gray mt-1">Please try again later.</p>
              </div>
            )}

            {localSummary && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Core Arguments
                  </h3>
                  <ul className="space-y-3">
                    {displayedBullets.map((bullet, idx) => {
                      if (!bullet && idx >= localSummary.bulletPoints.length) return null;
                      const isCurrentTyping = !isTypingCompleted && 
                        displayedBullets[idx] && 
                        (idx === localSummary.bulletPoints.length - 1 || !displayedBullets[idx + 1]);
                      return (
                        <li key={idx} className="flex items-start gap-3 text-xs text-charcoal/90 font-medium leading-relaxed font-sans">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>
                            {bullet}
                            {isCurrentTyping && (
                              <span className="inline-block w-1.5 h-3 ml-0.5 bg-primary/70 animate-pulse" />
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Key Takeaway */}
                {(displayedTakeaway || isTypingCompleted) && (
                  <div className="rounded-2xl border border-primary/10 bg-primary/2 p-5">
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Editorial Takeaway
                    </h3>
                    <p className="font-serif text-[15px] font-semibold leading-relaxed text-charcoal">
                      "{displayedTakeaway}"
                      {!isTypingCompleted && (
                        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-primary/70 animate-pulse" />
                      )}
                    </p>
                  </div>
                )}

                {/* Skip Animation Button */}
                {!isTypingCompleted && (
                  <button
                    onClick={handleSkipAnimation}
                    className="text-[10px] text-secondary-gray/60 hover:text-charcoal font-semibold underline block cursor-pointer transition-colors"
                  >
                    Skip to full summary
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Chat / Discourse Section (Only shown when summary typing is complete) */}
          {localSummary && isTypingCompleted && (
            <div className="pt-6 border-t border-border-outline/10 space-y-6">
              <div className="flex items-center gap-2 text-secondary-gray/50 mb-4 justify-center">
                <span className="h-[1px] w-8 bg-border-outline/10" />
                <span className="text-[9px] font-bold uppercase tracking-widest font-mono">
                  Editorial Discourse
                </span>
                <span className="h-[1px] w-8 bg-border-outline/10" />
              </div>

              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <MessageSquare className="h-6 w-6 text-primary/30 mb-2" />
                  <p className="text-xs font-bold text-charcoal">
                    Consult the Editorial Board
                  </p>
                  <p className="text-[10px] text-secondary-gray mt-1 px-8 leading-normal max-w-sm">
                    Ask questions about this report or explore counter-arguments directly with the Editor in chief.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                            isUser
                              ? "bg-primary text-white"
                              : "bg-white text-charcoal border border-border-outline/15"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="mt-1 text-[8px] text-secondary-gray/50 px-1 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })}

                  {chatLoading && (
                    <div className="flex items-center gap-2 text-secondary-gray">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-[10px] italic">Editor is formulating a reply...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Chat Input Form */}
        {localSummary && isTypingCompleted && (
          <div className="border-t border-border-outline/10 bg-white/40 p-4 shrink-0">
            <form onSubmit={handleSendQuestion} className="flex gap-2">
              <input
                type="text"
                placeholder="Submit your query to the Editor..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                className="flex-1 rounded-xl border border-border-outline/30 bg-white px-4 py-2.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                id="chat-input"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="rounded-xl bg-primary px-4 py-2.5 text-white hover:bg-primary-container disabled:opacity-40 transition-all font-bold text-xs flex items-center gap-1 cursor-pointer"
                id="send-chat-btn"
              >
                <Send className="h-3 w-3" />
                <span>Submit</span>
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
