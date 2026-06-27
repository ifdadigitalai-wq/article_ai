"use client";

import { motion } from "motion/react";
import { Home, Compass, Bookmark, Layers, User, Award, ShieldAlert, MessageSquare, Users, BarChart3, PlusCircle } from "lucide-react";

export type TabId =
  | "home"
  | "discover"
  | "library"
  | "saved"
  | "digests"
  | "profile"
  | "leaderboard"
  | "reading-lists"
  | "discussions"
  | "students"
  | "admin"
  | "dashboard"
  | "uploaded"
  | "create-article";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  userRole?: string;
}

export default function BottomNav({ activeTab, onTabChange, userRole }: BottomNavProps) {
  let navItems = [];
  if (userRole === "admin") {
    navItems = [
      { id: "dashboard" as TabId, label: "Dashboard", icon: BarChart3 },
      { id: "uploaded" as TabId, label: "Uploaded", icon: Layers },
      { id: "discussions" as TabId, label: "Discussion", icon: MessageSquare },
      { id: "create-article" as TabId, label: "Create Article", icon: PlusCircle },
      { id: "students" as TabId, label: "Students", icon: Users },
    ];
  } else if (userRole === "faculty") {
    navItems = [
      { id: "dashboard" as TabId, label: "Dashboard", icon: BarChart3 },
      { id: "uploaded" as TabId, label: "Uploaded", icon: Layers },
      { id: "discussions" as TabId, label: "Discussion", icon: MessageSquare },
      { id: "create-article" as TabId, label: "Create Article", icon: PlusCircle },
    ];
  } else {
    navItems = [
      { id: "home" as TabId, label: "Home", icon: Home },
      { id: "reading-lists" as TabId, label: "Reading Lists", icon: Layers },
      { id: "saved" as TabId, label: "Saved", icon: Bookmark },
      { id: "leaderboard" as TabId, label: "Leaderboard", icon: Award },
      { id: "profile" as TabId, label: "Profile", icon: User },
    ];
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 z-40 w-full border-t border-slate-200/50 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md pb-safe">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center py-2 px-3 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none cursor-pointer"
              id={`nav-tab-${item.id}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 -z-10 rounded-xl bg-indigo-500/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}
              >
                <Icon className="h-5 w-5" />
              </motion.div>

              <span
                className={`mt-1 text-[9px] font-bold tracking-wide transition-colors ${
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
