"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, Award, Flame, Brain, Clock, Check, RefreshCw } from "lucide-react";
import StatsCard from "./StatsCard";
import StreakCalendar from "./StreakCalendar";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  branch: string;
  batch: string;
  role: string;
  avatar: string;
}

interface StatsData {
  minutesRead: number;
  articlesCompleted: number;
  streakDays: number;
  avgQuizScore: number;
  topGenres: { name: string; count: number }[];
}

const AVATAR_OPTIONS = [
  { id: "scholar", emoji: "🎓", label: "Scholar" },
  { id: "creator", emoji: "💡", label: "Creator" },
  { id: "artist", emoji: "🎨", label: "Artist" },
  { id: "explorer", emoji: "🚀", label: "Explorer" },
  { id: "researcher", emoji: "🔬", label: "Researcher" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [batch, setBatch] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    try {
      // Fetch profile
      const resProf = await fetch("/api/user/profile");
      if (resProf.ok) {
        const profData = await resProf.json();
        setProfile(profData);
        setName(profData.name);
        setBranch(profData.branch);
        setBatch(profData.batch);
        setAvatar(profData.avatar);
      }

      // Fetch stats
      const resStats = await fetch("/api/user/stats");
      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
      }

      // Fetch streak
      const resStreak = await fetch("/api/reading-streak");
      if (resStreak.ok) {
        const streakData = await resStreak.json();
        setHeatmap(streakData.heatmap || {});
      }
    } catch (err) {
      console.error("Failed to load profile data:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, branch, batch, avatar }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIsEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading profile...</span>
      </div>
    );
  }

  const activeAvatar = AVATAR_OPTIONS.find((a) => a.id === profile.avatar) || AVATAR_OPTIONS[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center md:items-start justify-between gap-6 transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-5xl shadow-inner select-none shrink-0">
            {activeAvatar.emoji}
          </div>
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center gap-2.5 justify-center md:justify-start">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{profile.name}</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100/40 dark:border-indigo-900/30">
                {profile.role}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{profile.email}</p>
            {profile.rollNumber && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Roll No: <span className="font-mono">{profile.rollNumber}</span>
              </p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {profile.branch} Branch • Batch of {profile.batch}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-250 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4 transition-all duration-300"
        >
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Edit Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer"
              >
                <option value="Kalkalji">Kalkalji</option>
                <option value="Badarpur">Badarpur</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Batch
              </label>
              <input
                type="text"
                required
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Select Avatar
            </label>
            <div className="flex flex-wrap gap-3">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setAvatar(opt.id)}
                  className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                    avatar === opt.id
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500/10"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-355"
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                  {avatar === opt.id && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Articles Completed"
          value={stats?.articlesCompleted ?? 0}
          icon={<Award className="w-5 h-5" />}
          subtitle="All-time read count"
        />
        <StatsCard
          title="Reading Streak"
          value={`${stats?.streakDays ?? 0} Days`}
          icon={<Flame className="w-5 h-5" />}
          subtitle="Consecutive days read"
        />
        <StatsCard
          title="Avg Quiz Score"
          value={stats?.avgQuizScore !== undefined ? `${stats.avgQuizScore}/5` : "0/5"}
          icon={<Brain className="w-5 h-5" />}
          subtitle="MCQ validation rate"
        />
        <StatsCard
          title="Minutes Read"
          value={`${stats?.minutesRead ?? 0}m`}
          icon={<Clock className="w-5 h-5" />}
          subtitle="Estimated time spent"
        />
      </div>

      {/* Streak Calendar */}
      <StreakCalendar heatmap={heatmap} />
    </div>
  );
}
