"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe. Try again shortly.");
      }

      setSuccessMsg(data.message);
      setEmail("");
    } catch (err: any) {
      setErrorMsg(err.message || "Press connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg border-y border-border-outline/20 py-12 px-4 sm:px-6 lg:max-w-3xl" id="newsletter-signup">
      <div className="text-center max-w-md mx-auto">
        <h3 className="font-serif text-2xl font-bold text-charcoal">Weekly Read</h3>
        <p className="mt-2 text-sm text-secondary-gray">
          The most important stories, curated and delivered every Sunday morning.
        </p>

        <AnimatePresence mode="wait">
          {!successMsg ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubscribe}
              className="mt-6 space-y-4"
            >
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-transparent border-0 border-b border-border-outline/50 focus:ring-0 focus:border-primary px-0 py-3 text-sm text-charcoal transition-all placeholder:text-secondary-gray/50 focus:outline-none"
                  id="newsletter-email"
                />
              </div>

              {errorMsg && (
                <p className="text-left text-xs font-semibold text-red-600 mt-1">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 bg-secondary-gray text-white py-4 rounded-xl text-xs font-bold hover:bg-primary transition-colors disabled:opacity-40"
                id="newsletter-submit-btn"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl bg-primary/5 border border-primary/15 p-6 text-center"
            >
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-sm font-bold text-charcoal">Successfully Subscribed</p>
              <p className="mt-1 text-xs text-secondary-gray leading-normal">{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
