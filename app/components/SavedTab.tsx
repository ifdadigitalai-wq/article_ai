import React from "react";
import { Bookmark, Sparkles, Trash2 } from "lucide-react";
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
  // Map saved IDs back to actual Article objects
  const savedArticles = savedIds
    .map((id) => articles.find((art) => art.id === id))
    .filter((art): art is Article => !!art);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24" id="saved-view">
      <div className="flex items-center justify-between border-b border-border-outline/10 pb-4 mb-6">
        <h2 className="font-serif text-2xl font-bold text-charcoal">Bookmarks</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {savedArticles.length} Saved
        </span>
      </div>

      {savedArticles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-outline/40 py-20 text-center bg-white">
          <Bookmark className="h-10 w-10 text-border-outline/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-charcoal">No bookmarked articles</p>
          <p className="text-xs text-secondary-gray mt-1 px-8 leading-normal">
            Bookmark analytical columns or featured stories during reading to review them here later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {savedArticles.map((art) => (
            <div key={art.id} className="relative">
              {/* Override unbookmark button overlay */}
              <button
                onClick={(e) => onToggleSave(art, e)}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/80 p-2 text-red-500 hover:bg-white hover:scale-105 shadow-sm transition-all"
                title="Remove Bookmark"
                id={`remove-saved-${art.id}`}
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
