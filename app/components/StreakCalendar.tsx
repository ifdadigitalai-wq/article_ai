"use client";

import React from "react";
import { Flame, TrendingUp } from "lucide-react";

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
    if (count === 0)
      return "bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50";
    if (count === 1)
      return "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300/30";
    if (count === 2)
      return "bg-emerald-300 dark:bg-emerald-800/60";
    if (count === 3)
      return "bg-emerald-500 shadow-sm shadow-emerald-500/40";
    return "bg-emerald-700 shadow-md shadow-emerald-600/50";
  };

  const totalReads = Object.values(heatmap).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(heatmap).filter((c) => c > 0).length;

  return (
    <div className="relative p-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 shadow-md space-y-6">

      {/* Glow effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-400/20 blur-3xl rounded-full"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <Flame className="w-5 h-5 text-indigo-600" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              Reading Activity
            </h3>
            <p className="text-xs text-slate-500">
              Last 90 Days Performance
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-xs">
          <div>
            <p className="text-slate-400">Total Reads</p>
            <p className="text-lg font-bold text-indigo-600">
              {totalReads}
            </p>
          </div>

          <div>
            <p className="text-slate-400">Active Days</p>
            <p className="text-lg font-bold text-emerald-500">
              {activeDays}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-1 text-emerald-500">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Consistency</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <div className="min-w-[720px]">
          <div className="grid grid-flow-col grid-rows-7 gap-2">
            {dates.map((day) => (
              <div
                key={day.dateStr}
                title={`${day.count} reads on ${day.dateLabel}`}
                className={`w-[14px] h-[14px] rounded-md cursor-pointer transition-all duration-200 hover:scale-125 hover:ring-2 hover:ring-indigo-400 ${getColorClass(
                  day.count
                )}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Less Activity</span>

        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
          <div className="w-3 h-3 rounded bg-emerald-200"></div>
          <div className="w-3 h-3 rounded bg-emerald-400"></div>
          <div className="w-3 h-3 rounded bg-emerald-600"></div>
          <div className="w-3 h-3 rounded bg-emerald-800"></div>
        </div>

        <span>High Activity</span>
      </div>
    </div>
  );
}