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
  const isFaculty = user?.role === "faculty" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  let navItems = [];
  if (isAdmin) {
    navItems = [
      { id: "admin" as TabId, label: "Admin Panel", icon: ShieldAlert },
      { id: "students" as TabId, label: "Manage Students", icon: Users },
      { id: "discussions" as TabId, label: "Discussions", icon: MessageSquare },
      { id: "profile" as TabId, label: "My Profile", icon: User },
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
    if (isFaculty) {
      navItems.push({ id: "admin" as TabId, label: "Admin Panel", icon: ShieldAlert });
    }
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

      {/* Drawer Header (Branding) */}
      <div className="mb-6 mt-2 flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-bold text-slate-400 dark:text-slate-500">
          Institute Hub // Volume 01
        </span>
        <div className="flex items-center justify-between mt-1">
          <h2 className="font-serif text-2xl font-black tracking-tighter leading-none text-slate-850 dark:text-white">
            ARTICLEAI
          </h2>
          <DarkModeToggle />
        </div>
        <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
          Digital Library Navigator
        </span>
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 minimal-scrollbar">
        
        {/* Dynamic User Profile Card */}
        {user && (
          <button
            onClick={() => handleTabClick("profile")}
            className="w-full text-left rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 shadow-xs backdrop-blur-md hover:border-slate-350 dark:hover:border-slate-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-2xl shadow-inner border border-indigo-100/30 dark:border-indigo-900/20">
                {activeAvatar.emoji}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {user.role.toUpperCase()} • {user.department}
                </span>
              </div>
            </div>
          </button>
        )}

        {/* Navigation Links */}
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
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
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 shadow-sm shadow-indigo-500/10"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-850 dark:hover:text-slate-200"
                  }`}
                  id={`sidebar-link-${item.id}`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Categories Shortcut */}
        {!isAdmin && (
          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
              Topic Categories
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => {
                const isActive = selectedCategory.toLowerCase() === category.toLowerCase();
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`rounded-xl px-2.5 py-2 text-left text-[10px] font-sans font-bold uppercase tracking-wider truncate border transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-700 border-indigo-700 text-white dark:bg-indigo-600 dark:border-indigo-600 dark:text-white shadow-xs"
                        : "border-slate-200/50 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Library Stats Heatmap overview */}
        {!isAdmin && (
          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
              Reading Progress
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 p-2 text-center shadow-xs">
                <Clock className="h-4 w-4 text-indigo-500 mx-auto mb-1 opacity-80" />
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {stats.minutesRead}
                </div>
                <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5 leading-none">
                  Mins Read
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 p-2 text-center shadow-xs">
                <Award className="h-4 w-4 text-indigo-500 mx-auto mb-1 opacity-80" />
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {stats.articlesCompleted}
                </div>
                <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5 leading-none">
                  Finished
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 p-2 text-center shadow-xs">
                <Flame className="h-4 w-4 text-indigo-500 mx-auto mb-1 opacity-80" />
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {stats.streakDays}
                </div>
                <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5 leading-none">
                  Streak
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-1">
          {!isAdmin && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear your reading history?")) {
                  onClearHistory();
                  if (onClose) onClose();
                }
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              id="sidebar-clear-history-btn"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>Clear History</span>
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-105/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="mt-auto pt-4 border-t border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-1 text-[9px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center justify-between">
          <span>ArticleAI Client v2.0.0</span>
          <span className="flex items-center gap-0.5 font-bold hover:text-indigo-600 cursor-pointer">
            Library Docs <ExternalLink className="h-2 w-2" />
          </span>
        </div>
        <span>© 2026 Institute Editorial Board. All Rights Reserved.</span>
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
