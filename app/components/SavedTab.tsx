import React from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { Article } from "../types";
import ArticleCard from "./ArticleCard";

interface SavedTabProps {
  articles: Article[];
  savedIds: string[];
  onRead: (article: Article) => void;
  onQuickSummary: (article: Article, e: React.MouseEvent<any>) => void;
  onToggleSave: (article: Article, e: React.MouseEvent<any>) => void;
}

export default function SavedTab({
  articles,
  savedIds,
  onRead,
  onQuickSummary,
  onToggleSave,
}: SavedTabProps) {
  const savedArticles = savedIds
    .map((id) => articles.find((art) => art.id === id))
    .filter((art): art is Article => !!art);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24" id="saved-view">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Saved Articles
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Your bookmarked content, all in one place
          </p>
        </div>

        <div className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40 backdrop-blur">
          {savedArticles.length} Saved
        </div>
      </div>

      {/* Empty State */}
      {savedArticles.length === 0 ? (
        <div className="relative rounded-3xl border border-dashed border-slate-200/70 dark:border-slate-800/80 py-20 px-6 text-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">

          {/* Glow */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div className="w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-slate-800 mb-4 shadow-inner">
              <Bookmark className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
            </div>

            <p className="text-base font-semibold text-slate-800 dark:text-white">
              No bookmarks yet
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Save articles while reading and they will appear here for quick access.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {savedArticles.map((art) => (
            <div
              key={art.id}
              className="group relative transition duration-300 hover:-translate-y-1"
            >

              {/* Hover Glow */}
              <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 rounded-2xl blur-xl transition"></div>

              {/* Remove Button */}
              <button
                onClick={(e) => onToggleSave(art, e)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur text-red-500 hover:bg-white dark:hover:bg-slate-700 hover:scale-110 shadow transition"
                title="Remove Bookmark"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <ArticleCard
                article={art}
                onRead={onRead}
                onQuickSummary={onQuickSummary}
              />
            </div>
          ))}

        </div>
      )}
    </div>
  );
}