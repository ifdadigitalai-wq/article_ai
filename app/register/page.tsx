"use client";

import Link from "next/link";
import { BookOpen, ShieldAlert, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center 
bg-gradient-to-br from-slate-100 via-indigo-100 to-sky-100 
dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 
p-4">
  
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xl p-8 transition-all duration-300">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-amber-500/10 dark:bg-amber-400/10 rounded-xl mb-3 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Registration Disabled</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center leading-relaxed max-w-sm">
            Public registration is not available. Student accounts are provisioned by administrators. Faculty and admin credentials are provided during onboarding.
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <p className="font-semibold mb-1">Need an account?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Contact your institute administrator to get your login credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-50 dark:hover:bg-slate-100 dark:text-slate-950 text-white font-medium rounded-xl transition-colors cursor-pointer group text-sm shadow-md shadow-indigo-500/10 dark:shadow-none"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Login</span>
        </Link>
      </div>
    </div>
  );
}
