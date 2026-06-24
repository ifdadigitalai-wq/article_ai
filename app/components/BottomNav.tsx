"use client";

import { motion } from "motion/react";
import { Home, Compass, BookOpen, Bookmark, Sparkles } from "lucide-react";

export type TabId = "home" | "discover" | "library" | "saved" | "digests";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navItems = [
    { id: "home" as TabId, label: "Home", icon: Home },
    { id: "discover" as TabId, label: "Discover", icon: Compass },
    { id: "library" as TabId, label: "Library", icon: BookOpen },
    { id: "saved" as TabId, label: "Saved", icon: Bookmark },
    { id: "digests" as TabId, label: "AI Digests", icon: Sparkles },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 z-40 w-full border-t border-border-outline/40 bg-paper/95 backdrop-blur-md pb-safe">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center py-2 px-3 text-secondary-gray transition-colors focus:outline-none"
              id={`nav-tab-${item.id}`}
            >
              {/* Highlight background capsule */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 -z-10 rounded-xl bg-primary/5"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon with scale effect */}
              <motion.div
                animate={{ scale: isActive ? 1.12 : 1 }}
                className={isActive ? "text-primary" : "text-secondary-gray"}
              >
                <Icon className="h-5 w-5" />
              </motion.div>

              {/* Label */}
              <span
                className={`mt-1 text-[10px] font-bold tracking-wide transition-colors ${
                  isActive ? "text-primary" : "text-secondary-gray"
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
