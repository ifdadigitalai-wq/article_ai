import { motion } from "motion/react";
import { BookOpen, Clock, Flame, RotateCcw, Award } from "lucide-react";
import { Article, LibraryStats } from "../types";

interface LibraryTabProps {
  articles: Article[];
  historyIds: string[];
  completedIds: string[];
  stats: LibraryStats;
  onRead: (article: Article) => void;
  onClearHistory: () => void;
}

export default function LibraryTab({
  articles,
  historyIds,
  completedIds,
  stats,
  onRead,
  onClearHistory,
}: LibraryTabProps) {
  // Map history IDs back to actual Article objects
  const historyArticles = historyIds
    .map((id) => articles.find((art) => art.id === id))
    .filter((art): art is Article => !!art);

  const completedCount = completedIds.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24" id="library-view">
      {/* 1. Bento Statistics Grid */}
      <h2 className="mb-6 font-serif text-2xl font-bold text-charcoal">Your Reading Profile</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Minutes Read Card */}
        <div className="rounded-2xl border border-border-outline/10 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-gray">
              Minutes Read
            </span>
            <p className="font-serif text-2xl font-extrabold text-charcoal">
              {stats.minutesRead} <span className="text-xs font-normal text-secondary-gray">min</span>
            </p>
          </div>
        </div>

        {/* Articles Completed Card */}
        <div className="rounded-2xl border border-border-outline/10 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-green-50 p-3 text-green-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-gray">
              Completed
            </span>
            <p className="font-serif text-2xl font-extrabold text-charcoal">
              {completedCount} <span className="text-xs font-normal text-secondary-gray">stories</span>
            </p>
          </div>
        </div>

        {/* Daily Streak Card */}
        <div className="rounded-2xl border border-border-outline/10 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-gray">
              Active Streak
            </span>
            <p className="font-serif text-2xl font-extrabold text-charcoal">
              {stats.streakDays} <span className="text-xs font-normal text-secondary-gray">days</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Streak milestones / Badges */}
      <div className="mb-8 rounded-2xl border border-border-outline/10 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Award className="h-7 w-7 text-primary shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-charcoal">Analytical Reader Badge</h3>
            <p className="text-xs text-secondary-gray leading-normal">
              You receive this for completing at least 2 in-depth editorial papers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="h-2 w-20 rounded-full bg-black/5 overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, (completedCount / 2) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-charcoal">{completedCount}/2</span>
        </div>
      </div>

      {/* 3. Reading History List */}
      <div className="rounded-2xl border border-border-outline/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-outline/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-secondary-gray" />
            <h3 className="font-serif text-lg font-bold text-charcoal">Recently Read</h3>
          </div>
          {historyArticles.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs font-bold text-red-500 hover:underline"
              id="clear-history-btn"
            >
              Clear History
            </button>
          )}
        </div>

        {historyArticles.length === 0 ? (
          <div className="py-12 text-center text-secondary-gray">
            <BookOpen className="h-8 w-8 text-border-outline/40 mx-auto mb-2" />
            <p className="text-xs font-semibold">Your reading queue is empty</p>
            <p className="text-[10px] text-secondary-gray/75 mt-1">
              Select any piece from the feed to begin your daily session.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-outline/10">
            {historyArticles.map((art) => {
              const isCompleted = completedIds.includes(art.id);
              return (
                <div
                  key={art.id}
                  onClick={() => onRead(art)}
                  className="flex items-center justify-between py-4 group cursor-pointer hover:bg-black/1 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {art.category}
                    </p>
                    <h4 className="font-serif text-sm font-bold text-charcoal truncate mt-0.5 group-hover:text-primary transition-colors">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-secondary-gray truncate mt-1">
                      By {art.author.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isCompleted ? (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-600">
                        Completed
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">
                        Reading
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-secondary-gray font-mono">
                      {art.readTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
