"use client";

import React, { useEffect, useState } from "react";
import { Award, Trophy, Medal, RefreshCw } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  department: string;
  batch: string;
  rollNumber: string;
  articlesRead: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-slate-400 w-5 text-center">{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading leaderboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-1 text-center md:text-left">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 justify-center md:justify-start">
          <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span>Weekly Leaderboard</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Top 10 students with the most articles completed in the last 7 days.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden transition-all duration-300">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No readings recorded this week yet. Be the first to start reading!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Batch</th>
                  <th className="py-4 px-6 text-right">Articles Read</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((entry) => (
                  <tr
                    key={entry.rank}
                    className="hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-colors text-sm text-slate-700 dark:text-slate-250"
                  >
                    <td className="py-4 px-6 text-center flex items-center justify-center h-14">
                      {getRankBadge(entry.rank)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {entry.name}
                    </td>
                    <td className="py-4 px-6">{entry.department}</td>
                    <td className="py-4 px-6 font-mono text-xs">{entry.batch}</td>
                    <td className="py-4 px-6 text-right font-bold text-indigo-600 dark:text-indigo-400 pr-10">
                      {entry.articlesRead}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
