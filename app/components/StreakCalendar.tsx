"use client";

import React from "react";

interface StreakCalendarProps {
  heatmap: Record<string, number>;
}

export default function StreakCalendar({ heatmap }: StreakCalendarProps) {
  const dates: { dateStr: string; count: number; dateLabel: string }[] = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = heatmap[dateStr] || 0;
    const dateLabel = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    dates.push({ dateStr, count, dateLabel });
  }

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-slate-100 dark:bg-slate-800/80";
    if (count === 1) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (count === 2) return "bg-emerald-300 dark:bg-emerald-800/60";
    if (count === 3) return "bg-emerald-500 dark:bg-emerald-600";
    return "bg-emerald-700 dark:bg-emerald-500";
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Reading Streak Heatmap (Last 90 Days)
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Less</span>
          <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800/80"></span>
          <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30"></span>
          <span className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-800/60"></span>
          <span className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-600"></span>
          <span className="w-3 h-3 rounded bg-emerald-700 dark:bg-emerald-500"></span>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <div className="min-w-[620px] flex justify-between">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-full">
            {dates.map((day) => (
              <div
                key={day.dateStr}
                title={`${day.count} articles read on ${day.dateLabel}`}
                className={`w-[13px] h-[13px] rounded-sm transition-colors hover:ring-1 hover:ring-indigo-500/50 cursor-pointer ${getColorClass(
                  day.count
                )}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
