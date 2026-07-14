"use client";

import React, { useEffect, useState } from "react";
import { Award, Trophy, Medal, RefreshCw, Crown } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  branch: string;
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
    if (rank === 1)
      return <Crown className="w-6 h-6 text-yellow-400 drop-shadow" />;
    if (rank === 2)
      return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3)
      return <Medal className="w-5 h-5 text-amber-600" />;
    return (
      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
        #{rank}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/20">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
        <p className="text-sm text-slate-500">Loading leaderboard...</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2 text-slate-800 dark:text-white">
          <Award className="w-7 h-7 text-indigo-500" />
          Weekly Leaderboard
        </h2>
        <p className="text-sm text-slate-500">
          Top performers of this week 🚀
        </p>
      </div>

      {/* 🏆 Top 3 Section */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((user, i) => (
            <div
              key={user.rank}
              className={`relative rounded-2xl p-5 text-center border backdrop-blur-lg shadow-md
              ${
                user.rank === 1
                  ? "bg-gradient-to-br from-yellow-100/60 to-amber-200/40 border-yellow-300"
                  : user.rank === 2
                  ? "bg-slate-100/60 dark:bg-slate-800/40 border-slate-300"
                  : "bg-amber-100/60 border-amber-300"
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                {getRankBadge(user.rank)}
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {user.branch} • {user.batch}
                </p>

                <div className="mt-3 text-xl font-bold text-indigo-600">
                  {user.articlesRead}
                </div>
                <p className="text-xs text-slate-400">Articles</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📊 Table */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {entries.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No data yet. Start reading to appear here 🚀
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4 text-center">Rank</th>
                <th className="p-4 text-left">Student</th>
                <th className="p-4">Branch</th>
                <th className="p-4">Batch</th>
                <th className="p-4 text-right">Reads</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rest.map((entry) => (
                <tr
                  key={entry.rank}
                  className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="p-4 text-center">
                    {getRankBadge(entry.rank)}
                  </td>

                  <td className="p-4 font-semibold text-slate-800 dark:text-white">
                    {entry.name}
                  </td>

                  <td className="p-4">{entry.branch}</td>

                  <td className="p-4 font-mono text-xs">
                    {entry.batch}
                  </td>

                  <td className="p-4 text-right font-bold text-indigo-600">
                    {entry.articlesRead}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}