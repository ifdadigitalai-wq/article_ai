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
} from "lucide-react";
import { TabId } from "./BottomNav";
import DarkModeToggle from "./DarkModeToggle";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
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
      { id: "uploaded" as TabId, label: "Uploaded", icon: Layers },
      { id: "discussions" as TabId, label: "Discussions", icon: MessageSquare },
      { id: "create-article" as TabId, label: "Create Article", icon: PlusCircle },
      { id: "students" as TabId, label: "Manage Students", icon: Users },
    ];
  } else if (isFaculty) {
    navItems = [
      { id: "dashboard" as TabId, label: "Dashboard", icon: BarChart3 },
      { id: "uploaded" as TabId, label: "Uploaded", icon: Layers },
      { id: "discussions" as TabId, label: "Discussions", icon: MessageSquare },
      { id: "create-article" as TabId, label: "Create Article", icon: PlusCircle },
    ];
  } else {
    navItems = [
      { id: "home" as TabId, label: "Home Edition", icon: Home },
      { id: "discover" as TabId, label: "Discover Feed", icon: Compass },
      { id: "reading-lists" as TabId, label: "Reading Lists", icon: Layers },
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
      .minimal-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(99,102,241,0.25);
        border-radius: 10px;
      }
    `}</style>

    {/* Close Button */}
    {!isPersistent && onClose && (
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/70 dark:bg-slate-800/60 backdrop-blur hover:scale-105 transition"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>
    )}

    {/* Header */}
    <div className="mb-6">
      <p className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
        Institute Hub
      </p>

      <div className="flex items-center justify-between mt-1">
        <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          ArticleAI
        </h2>
        <DarkModeToggle />
      </div>

      <p className="text-[11px] text-slate-500 mt-1">
        Digital Library Navigator
      </p>
    </div>

    {/* Scroll Area */}
    <div className="flex-1 overflow-y-auto pr-1 space-y-6 minimal-scrollbar">

      {/* Profile Card */}
      {user && (
        <div
          onClick={
            user.role === "faculty" || user.role === "admin"
              ? undefined
              : () => handleTabClick("profile")
          }
          className="p-4 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 dark:from-slate-900/60 dark:to-slate-900/30 backdrop-blur border border-white/30 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-xl shadow-inner">
              {activeAvatar.emoji}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {user.role.toUpperCase()} • {user.department}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">
          Navigation
        </p>

        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      {!isAdmin && !isFaculty && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">
            Categories
          </p>

          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => {
              const isActive =
                selectedCategory.toLowerCase() === category.toLowerCase();

              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-2 py-2 text-xs rounded-lg font-semibold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      {!isAdmin && !isFaculty && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">
            Progress
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Clock, value: stats.minutesRead, label: "Mins" },
              { icon: Award, value: stats.articlesCompleted, label: "Done" },
              { icon: Flame, value: stats.streakDays, label: "Streak" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 backdrop-blur border border-white/20 dark:border-slate-800 text-center hover:shadow-md transition"
                >
                  <Icon className="h-4 w-4 mx-auto text-indigo-500 mb-1" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    {item.value}
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {!isAdmin && !isFaculty && (
          <button
            onClick={() => {
              if (confirm("Clear history?")) {
                onClearHistory();
                onClose?.();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        )}

      </div>
    </div>

    {/* Footer */}
    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
      <div className="flex justify-between">
      <button
          onClick={handleLogout}
          className="w-[100px] mx-auto  cursor-pointer flex bg-red-500 text-white items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  </>
);


if (isPersistent) {
  return (
    <aside
      id="nav-sidebar-persistent"
      className="
        hidden md:flex relative h-full w-72 flex-col shrink-0
        border-r border-slate-200/40 dark:border-slate-800/60
        bg-white/70 dark:bg-slate-950/70
        backdrop-blur-xl
        p-5
        text-slate-700 dark:text-slate-300

        shadow-[0_0_30px_rgba(0,0,0,0.05)]
        dark:shadow-[0_0_40px_rgba(0,0,0,0.6)]

        transition-all duration-300 ease-in-out
      "
    >
      {/* Top Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

      {/* Sidebar Content */}
      <div className="relative flex flex-col h-full overflow-y-auto minimal-scrollbar">
        {sidebarContent}
      </div>

      {/* Bottom subtle line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300/40 dark:via-slate-700/40 to-transparent" />
    </aside>
  );
}

return (
  <div className="fixed inset-0 z-50 flex overflow-hidden md:hidden">
    
    {/* Backdrop */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="
        fixed inset-0 
        bg-slate-950/50 
        backdrop-blur-sm
        transition-opacity duration-300
      "
      id="sidebar-backdrop"
    />

    {/* Sidebar Drawer */}
    <motion.div
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="
        relative flex h-full w-full max-w-[280px] flex-col
        
        border-r border-slate-200/40 dark:border-slate-800/60
        
        bg-white/80 dark:bg-slate-950/80
        backdrop-blur-xl
        
        p-5
        
        text-slate-700 dark:text-slate-300
        
        shadow-[0_10px_40px_rgba(0,0,0,0.15)]
        dark:shadow-[0_10px_50px_rgba(0,0,0,0.8)]
        
        transition-all duration-300 ease-in-out
      "
      id="nav-sidebar"
    >
      {/* Top Glow */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/15 to-transparent pointer-events-none" />

      {/* Sidebar Content */}
      <div className="relative flex flex-col h-full overflow-y-auto minimal-scrollbar">
        {sidebarContent}
      </div>

      {/* Bottom Divider Glow */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300/40 dark:via-slate-700/40 to-transparent" />
    </motion.div>
  </div>
);
}
