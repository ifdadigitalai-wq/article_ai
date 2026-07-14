import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export default function StatsCard({ title, value, icon, subtitle, className = "" }: StatsCardProps) {
  return (
    <div className={`p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs flex items-center justify-between transition-all hover:shadow-sm ${className}`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">{title}</p>
        <h4 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{value}</h4>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
      </div>
      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
        {icon}
      </div>
    </div>
  );
}
