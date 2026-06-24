"use client";

import React from "react";
import { motion } from "motion/react";
import {
  X,
  Home,
  Compass,
  BookOpen,
  Bookmark,
  Sparkles,
  Clock,
  Award,
  Flame,
  Trash2,
  User,
  ExternalLink
} from "lucide-react";
import { TabId } from "./BottomNav";
import { LibraryStats } from "../types";

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
}

export default function NavigationSidebar({
  onClose,
  activeTab,
  onTabChange,
  stats,
  categories,
  selectedCategory,
  onSelectCategory,
  onClearHistory,
  isPersistent = false
}: NavigationSidebarProps) {
  const navItems = [
    { id: "home" as TabId, label: "Home Edition", icon: Home },
    { id: "discover" as TabId, label: "Discover Feed", icon: Compass },
    { id: "library" as TabId, label: "My Library", icon: BookOpen },
    { id: "saved" as TabId, label: "Saved Articles", icon: Bookmark },
    { id: "digests" as TabId, label: "AI Digests", icon: Sparkles }
  ];

  const handleTabClick = (tabId: TabId) => {
    onTabChange(tabId);
    if (onClose) onClose();
  };

  const handleCategoryClick = (category: string) => {
    onSelectCategory(category);
    onTabChange("home"); // default to home when changing category
    if (onClose) onClose();
  };

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
          background-color: rgba(26, 26, 26, 0.15);
          border-radius: 4px;
        }
      `}</style>
      {/* Close button top right of drawer */}
      {!isPersistent && onClose && (
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="rounded-full p-2 text-secondary-gray hover:bg-black/5 hover:text-charcoal transition-colors"
            id="close-sidebar-btn"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Drawer Header (Branding) */}
      <div className="mb-8 mt-4 flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-bold opacity-45">
          Volume 04 // Issue 12
        </span>
        <h2 className="font-serif text-2xl font-black tracking-tighter leading-none mt-1 text-charcoal">
          THE EDITORIAL
        </h2>
        <span className="text-[10px] font-sans text-secondary-gray/70 mt-1 uppercase tracking-wider font-semibold">
          Press Navigation
        </span>
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2 minimal-scrollbar">
        {/* User Profile Card */}
        <div className="rounded-2xl border border-border-outline/10 bg-white/60 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-charcoal truncate">
                Arthur Pendelton
              </span>
              <span className="text-[10px] text-secondary-gray/80">
                Premium Subscriber
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border-outline/5 pt-2.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded">
              Active Member
            </span>
            <span className="text-[9px] font-medium text-secondary-gray/60 italic">
              Since Sept 2024
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-secondary-gray/60">
            Sections
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-secondary-gray hover:bg-black/5 hover:text-charcoal"
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
        <div>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-secondary-gray/60">
            Categories
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => {
              const isActive = selectedCategory.toLowerCase() === category.toLowerCase();
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold tracking-wide truncate border transition-all ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "border-border-outline/10 hover:border-border-outline bg-white/40 hover:bg-white text-secondary-gray hover:text-charcoal"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Library Stats */}
        <div>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-secondary-gray/60">
            Reading Progress
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border-outline/10 bg-white/40 p-2.5 text-center shadow-sm">
              <Clock className="h-4 w-4 text-primary mx-auto mb-1 opacity-80" />
              <div className="text-xs font-extrabold text-charcoal">
                {stats.minutesRead}
              </div>
              <div className="text-[8px] text-secondary-gray/70 font-semibold uppercase mt-0.5 leading-none">
                Mins Read
              </div>
            </div>
            <div className="rounded-xl border border-border-outline/10 bg-white/40 p-2.5 text-center shadow-sm">
              <Award className="h-4 w-4 text-primary mx-auto mb-1 opacity-80" />
              <div className="text-xs font-extrabold text-charcoal">
                {stats.articlesCompleted}
              </div>
              <div className="text-[8px] text-secondary-gray/70 font-semibold uppercase mt-0.5 leading-none">
                Finished
              </div>
            </div>
            <div className="rounded-xl border border-border-outline/10 bg-white/40 p-2.5 text-center shadow-sm">
              <Flame className="h-4 w-4 text-primary mx-auto mb-1 opacity-80" />
              <div className="text-xs font-extrabold text-charcoal">
                {stats.streakDays}
              </div>
              <div className="text-[8px] text-secondary-gray/70 font-semibold uppercase mt-0.5 leading-none">
                Day Streak
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Danger Zone */}
        <div className="pt-2 border-t border-border-outline/15">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear your reading history?")) {
                onClearHistory();
                if (onClose) onClose();
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50/50 transition-colors"
            id="sidebar-clear-history-btn"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span>Clear Reading History</span>
          </button>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="mt-auto pt-4 border-t border-border-outline/10 flex flex-col gap-1 text-[9px] text-secondary-gray/50">
        <div className="flex items-center justify-between">
          <span>The Editorial Client v1.2.0</span>
          <span className="flex items-center gap-0.5 font-bold hover:text-charcoal cursor-pointer">
            Docs <ExternalLink className="h-2 w-2" />
          </span>
        </div>
        <span>© 2026 The Editorial Board. All Rights Reserved.</span>
      </div>
    </>
  );

  if (isPersistent) {
    return (
      <aside
        className="hidden md:flex relative h-full w-64 flex-col border-r border-border-outline/25 bg-paper p-6 text-charcoal shrink-0"
        id="nav-sidebar-persistent"
      >
        {sidebarContent}
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden md:hidden">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity"
        id="sidebar-backdrop"
      />

      {/* Drawer panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative flex h-full w-full max-w-xs flex-col border-r border-border-outline/25 bg-paper p-6 shadow-2xl text-charcoal"
        id="nav-sidebar"
      >
        {sidebarContent}
      </motion.div>
    </div>
  );
}
