"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Key,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-cyan-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

      {/* 🔥 Background Blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-400 opacity-30 blur-3xl rounded-full animate-pulse" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-cyan-400 opacity-30 blur-3xl rounded-full animate-pulse delay-1000" />

      {/* 🔐 Glass Card */}
      <div className="relative w-full max-w-md backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-300">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white rounded-xl shadow-lg">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold mt-3 text-slate-800 dark:text-white">
            ArticleAI
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            Smart Reading Platform by IFDA 🚀
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 bg-rose-100/70 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex gap-2 text-rose-600 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none transition-all"
              />

              {/* 👁 Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                Login
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}