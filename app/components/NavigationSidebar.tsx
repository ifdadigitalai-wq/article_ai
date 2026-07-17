"use client";

import React from "react";
import { motion } from "motion/react";
import {
  X,
  Home,
  Compass,
  Layers,
  Bookmark,
  Award,
  Clock,
  Flame,
  Trash2,
  User,
  ShieldAlert,
  ExternalLink,
  LogOut,
  MessageSquare,
  Users,
  BarChart3,
  PlusCircle,
  BookOpen,
} from "lucide-react";
import { TabId } from "./BottomNav";
import DarkModeToggle from "./DarkModeToggle";

interface UserProfile {
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  branch: string;
  batch: string;
  avatar: string;
}

interface LibraryStats {
  minutesRead: number;
  articlesCompleted: number;
  streakDays: number;
}

interface NavigationSidebarProps {
  onClose?: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  stats: LibraryStats;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onClearHistory: () => void;
  isPersistent?: boolean;
  user: UserProfile | null;
}

const AVATAR_OPTIONS = [
  { id: "scholar", emoji: "🎓" },
  { id: "creator", emoji: "💡" },
  { id: "artist", emoji: "🎨" },
  { id: "explorer", emoji: "🚀" },
  { id: "researcher", emoji: "🔬" },
];

export default function NavigationSidebar({
  onClose,
  activeTab,
  onTabChange,
  stats,
  categories,
  selectedCategory,
  onSelectCategory,
  onClearHistory,
  isPersistent = false,
  user,
}: NavigationSidebarProps) {
  const isFaculty = user?.role === "faculty";
  const isAdmin = user?.role === "admin";

  let navItems = [];
  if (isAdmin) {
    navItems = [
      { id: "dashboard" as TabId, label: "Dashboard", icon: BarChart3 },
      { id: "reading-lists" as TabId, label: "Reading Lists", icon: BookOpen },
      { id: "uploaded" as TabId, label: "Uploaded", icon: Layers },
      { id: "discussions" as TabId, label: "Discussions", icon: MessageSquare },
      { id: "create-article" as TabId, label: "Create Article", icon: PlusCircle },
      { id: "students" as TabId, label: "Manage Students", icon: Users },
      { id: "profile" as TabId, label: "My Profile", icon: User },
    ];
  } else if (isFaculty) {
    navItems = [
      { id: "dashboard" as TabId, label: "Dashboard", icon: BarChart3 },
      { id: "reading-lists" as TabId, label: "Reading Lists", icon: BookOpen },
      { id: "uploaded" as TabId, label: "Uploaded", icon: Layers },
      { id: "discussions" as TabId, label: "Discussions", icon: MessageSquare },
      { id: "create-article" as TabId, label: "Create Article", icon: PlusCircle },
      { id: "profile" as TabId, label: "My Profile", icon: User },
    ];
  } else {
    navItems = [
      { id: "home" as TabId, label: "Home Edition", icon: Home },
      { id: "reading-lists" as TabId, label: "Reading Lists", icon: BookOpen },
      { id: "history" as TabId, label: "Reading History", icon: Clock },
      { id: "saved" as TabId, label: "Saved Articles", icon: Bookmark },
      { id: "leaderboard" as TabId, label: "Leaderboard", icon: Award },
      { id: "profile" as TabId, label: "My Profile", icon: User },
    ];
  }

  const handleTabClick = (tabId: TabId) => {
    onTabChange(tabId);
    if (onClose) onClose();
  };

  const handleCategoryClick = (category: string) => {
    onSelectCategory(category);
    onTabChange("home");
    if (onClose) onClose();
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

  const activeAvatar = AVATAR_OPTIONS.find((a) => a.id === user?.avatar) || AVATAR_OPTIONS[0];

  const sidebarContent = (
    <>
      <style>{`
        .minimal-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .minimal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .minimal-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(99, 102, 241, 0.15);
          border-radius: 4px;
        }
      `}</style>
      
      {!isPersistent && onClose && (
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            id="close-sidebar-btn"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

{/* Drawer Header */}
<div className="mb-6 mt-2 flex flex-col">
  <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-indigo-400">
    Institute Hub // Volume 01
  </span>

  <div className="flex items-center justify-between mt-1">
    <h2 className="font-serif text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
      ARTICLEAI
    </h2>
    <DarkModeToggle />
  </div>

  <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
    Digital Library Navigator
  </span>
</div>

{/* Scroll Area */}
<div className="flex-1 overflow-y-auto space-y-6 pr-1 minimal-scrollbar">

  {/* Profile Card */}
  {user && (
    <div
      onClick={() => handleTabClick("profile")}
      className="group relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500/40 to-cyan-500/40 hover:from-indigo-500 hover:to-cyan-500 transition-all cursor-pointer"
    >
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900 text-xl shadow-inner overflow-hidden select-none">
          {user.role === "admin" || user.role === "faculty" ? (
            user.avatar && (user.avatar.startsWith("/") || user.avatar.startsWith("http") || user.avatar.startsWith("data:")) ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
            )
          ) : (
            activeAvatar.emoji
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-indigo-500 transition">
            {user.name}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {user.role.toUpperCase()} • {user.branch}
          </span>
        </div>

      </div>
    </div>
  )}

  {/* Navigation */}
  <div>
    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      Syllabus Navigation
    </h3>

    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all
              
              ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:scale-[1.01]"
              }`}
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  </div>

{/* Categories */}
{!isAdmin && !isFaculty && (
  <div className="space-y-3">
    {/* Heading */}
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
      Topic Categories
    </h3>

    {/* List */}
    <div className="flex flex-col gap-2">
      {categories.map((category) => {
        const isActive =
          selectedCategory.toLowerCase() === category.toLowerCase();

        return (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all duration-300 border
              
              ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white border-transparent shadow-md shadow-indigo-500/30"
                  : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300/40"
              }
            `}
          >
            {/* Left Text */}
            <span className="flex items-center gap-2">
              {/* Dot Indicator */}
              <span
                className={`h-2 w-2 rounded-full transition-all ${
                  isActive
                    ? "bg-white"
                    : "bg-slate-400 group-hover:bg-indigo-500"
                }`}
              ></span>

              {category}
            </span>

            {/* Right Arrow */}
            <span
              className={`text-xs transition-transform duration-300 ${
                isActive
                  ? "translate-x-0 opacity-100"
                  : "translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
              }`}
            >
              →
            </span>
          </button>
        );
      })}
    </div>
  </div>
)}

  {/* Stats */}
  {!isAdmin && !isFaculty && (
    <div>
      <h3 className="mb-2 text-[10px] text-left font-bold uppercase tracking-wider text-slate-400">
        Reading Progress
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {[ 
          { icon: Clock, value: stats.minutesRead, label: "Mins" },
          { icon: Award, value: stats.articlesCompleted, label: "Done" },
          { icon: Flame, value: stats.streakDays, label: "Streak" }
        ].map((item, i) => (
          <div key={i} className="rounded-xl p-3 text-start bg-gradient-to-br from-white/70 to-slate-100/40 dark:from-slate-900/60 dark:to-slate-800/30 backdrop-blur border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            
            <item.icon className="h-4 w-4 mx-auto mb-1 text-indigo-500" />
            
            <div className="text-sm font-extrabold text-slate-800 dark:text-white">
              {item.value}
            </div>

            <div className="text-[8px] text-slate-400 uppercase font-bold">
              {item.label}
            </div>

          </div>
        ))}
      </div>
    </div>
  )}

  {/* Actions */}
  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">

    {!isAdmin && !isFaculty && (
      <button
        onClick={() => {
          if (confirm("Clear history?")) {
            onClearHistory();
          }
        }}
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition"
      >
        <Trash2 className="h-4 w-4" />
        Clear History
      </button>
    )}

    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-white text-center bg-red-500  px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-red-500 dark:hover:bg-slate-800 rounded-xl transition"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>

  </div>
</div>

{/* Footer */}
<div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 flex flex-col gap-1">
  
  <div className="flex justify-between">
    <span>ArticleAI v2.0</span>
    <span className="hover:text-indigo-500 cursor-pointer flex items-center gap-1">
      Docs <ExternalLink className="h-2 w-2" />
    </span>
  </div>

  <span>© 2026 Institute</span>
</div>
    </>
  );

  if (isPersistent) {
    return (
      <aside
        className="hidden md:flex relative h-full w-64 flex-col border-r border-slate-200/45 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 text-slate-700 dark:text-slate-300 shrink-0"
        id="nav-sidebar-persistent"
      >
        {sidebarContent}
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden md:hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        id="sidebar-backdrop"
      />

      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative flex h-full w-full max-w-xs flex-col border-r border-slate-200/45 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl text-slate-700 dark:text-slate-350"
        id="nav-sidebar"
      >
        {sidebarContent}
      </motion.div>
    </div>
  );
}
