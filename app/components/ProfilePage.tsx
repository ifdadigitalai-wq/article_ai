"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, Award, Flame, Brain, Clock, Check, RefreshCw, Phone, Mail, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import StatsCard from "./StatsCard";
import StreakCalendar from "./StreakCalendar";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
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

interface ProfilePageProps {
  onProfileUpdate?: () => void;
}

export default function ProfilePage({ onProfileUpdate }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("");
  const [branch, setBranch] = useState("");
  const [batch, setBatch] = useState("");
  const [avatar, setAvatar] = useState("");
  
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    try {
      // Fetch profile
      const resProf = await fetch(`/api/user/profile?t=${Date.now()}`);
      if (resProf.ok) {
        const profData = await resProf.json();
        setProfile(profData);
        setName(profData.name || "");
        setEmail(profData.email || "");
        setPhoneNumber(profData.phoneNumber || "");
        setRole(profData.role || "");
        setBranch(profData.branch || "");
        setBatch(profData.batch || "");
        setAvatar(profData.avatar || "scholar");

        // Check if current avatar is custom
        const isCustom = !AVATAR_OPTIONS.some((a) => a.id === profData.avatar);
        if (isCustom && profData.avatar) {
          setCustomAvatarUrl(profData.avatar);
          setAvatar("custom");
        }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage({ type: "error", text: "Image size must be less than 5MB." });
      return;
    }

    setUploadingImage(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCustomAvatarUrl(data.url);
        setAvatar("custom");
        setUploadMessage({ type: "success", text: "Profile image uploaded!" });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }
    } catch (err: any) {
      setUploadMessage({ type: "error", text: err.message });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      let finalAvatar = avatar;
      if (avatar === "custom" && customAvatarUrl) {
        finalAvatar = customAvatarUrl;
      }

      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phoneNumber,
          role,
          branch,
          batch,
          avatar: finalAvatar,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIsEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        if (onProfileUpdate) onProfileUpdate();
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

  const isAvatarUrl =
    profile.avatar &&
    (profile.avatar.startsWith("http") ||
      profile.avatar.startsWith("data:") ||
      profile.avatar.startsWith("/uploads/"));

  const activeAvatarObj = AVATAR_OPTIONS.find((a) => a.id === profile.avatar);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center md:items-start justify-between gap-6 transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full">
          <div className="w-24 h-24 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-5xl shadow-inner select-none shrink-0 overflow-hidden">
            {isAvatarUrl ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{activeAvatarObj ? activeAvatarObj.emoji : "🎓"}</span>
            )}
          </div>
          <div className="text-center md:text-left space-y-2 w-full min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 justify-center md:justify-start">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white truncate">{profile.name}</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100/40 dark:border-indigo-900/30">
                {profile.role}
              </span>
            </div>

            <div className="flex flex-col gap-1 items-center md:items-start text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium truncate max-w-full">
                <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                {profile.email}
              </span>
              {profile.phoneNumber && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                  {profile.phoneNumber}
                </span>
              )}
            </div>

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

        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-250 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
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
          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-6 transition-all duration-300"
        >
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Edit Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Administrator</option>
              </select>
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

          {/* Avatar Settings */}
          <div className="space-y-4 border-t border-slate-200/60 dark:border-slate-800/80 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                Profile Avatar
              </label>
              <div className="flex flex-wrap gap-3">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => {
                      setAvatar(opt.id);
                      setUploadMessage(null);
                    }}
                    className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                      avatar === opt.id
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500/10"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-xs font-semibold">{opt.label}</span>
                    {avatar === opt.id && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setAvatar("custom")}
                  className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                    avatar === "custom"
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500/10"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="text-xl">🖼️</span>
                  <span className="text-xs font-semibold">Custom Image</span>
                  {avatar === "custom" && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              </div>
            </div>

            {avatar === "custom" && (
              <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/60 animate-fadeIn space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {customAvatarUrl && (
                    <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 bg-white dark:bg-slate-900 flex items-center justify-center">
                      <img src={customAvatarUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="space-y-3 flex-1 w-full max-w-md">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Upload image file
                    </label>
                    <label className="w-full h-10 border border-dashed border-indigo-200 dark:border-indigo-900 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 cursor-pointer transition">
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {uploadingImage ? "Uploading..." : "Choose Image File"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>

                {uploadMessage && (
                  <div className={`col-span-full p-3 rounded-lg flex items-center gap-2 text-xs border ${
                    uploadMessage.type === "success"
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-600"
                      : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-600"
                  }`}>
                    {uploadMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="font-semibold">{uploadMessage.text}</span>
                  </div>
                )}
              </div>
            )}
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

      {/* Stats Section - ONLY for Students */}
      {profile.role === "student" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
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
      )}

      {/* Streak Calendar - ONLY for Students */}
      {profile.role === "student" && <StreakCalendar heatmap={heatmap} />}
    </div>
  );
}
