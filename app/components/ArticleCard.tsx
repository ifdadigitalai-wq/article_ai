import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { Article } from "../types";

interface ArticleCardProps {
  key?: any;
  article: Article;
  onRead: (article: Article) => void;
  onQuickSummary: (article: Article, e: React.MouseEvent<any>) => void;
  isAssigned?: boolean;
}

export default function ArticleCard({ article, onRead, onQuickSummary, isAssigned = false }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [article.id]);

  const getAvatarUrl = (avatar: string): string => {
    if (!avatar) return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80";
    if (avatar.startsWith("/") || avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("data:")) {
      return avatar;
    }
    
    const avatarMap: Record<string, string> = {
      scholar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&q=80",
      mentor: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&q=80",
      tech: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&q=80",
      creative: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80"
    };
    
    return avatarMap[avatar] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80";
  };

  if (article.featured) {
    return (
      <motion.div
        onClick={() => onRead(article)}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-charcoal/10 bg-[#e2e8f0] dark:bg-slate-900 text-charcoal shadow-xs flex flex-col"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        id={`featured-card-${article.id}`}
      >
        <div className="aspect-[3/4] w-full sm:aspect-video relative overflow-hidden bg-[#e2e8f0] dark:bg-slate-900 flex items-center justify-center">
          {imgError || !article.imageUrl ? (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-slate-500/5 flex flex-col items-center justify-center p-6 text-center">
              <BookOpen className="h-10 w-10 text-indigo-500/60 mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-650 dark:text-indigo-400">{article.category}</span>
            </div>
          ) : (
            <img
              src={article.imageUrl}
              alt={article.imageAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs border-t border-charcoal/10 dark:border-slate-805">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-block bg-primary px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-wider text-white">
                The Long Read
              </span>

            </div>
            <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl text-charcoal dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">
              {article.title}
            </h2>
            <p className="mt-3 font-sans text-sm text-charcoal/85 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {article.subtitle}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-charcoal/10 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-primary dark:text-indigo-400">
              <span>Read Publication</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
            <span className="font-sans text-[10px] uppercase font-bold text-secondary-gray/70 dark:text-slate-400">
              {article.readTime}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      onClick={() => onRead(article)}
      className="group flex flex-col cursor-pointer overflow-hidden border-b border-border-outline dark:border-slate-800/80 pb-8 transition-opacity duration-300"
      whileHover={{ y: -2 }}
      id={`article-card-${article.id}`}
    >
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-[#e2e8f0] dark:bg-slate-900 border border-charcoal/5 dark:border-slate-800/40 relative flex items-center justify-center">
        {imgError || !article.imageUrl ? (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-slate-500/5 flex flex-col items-center justify-center p-4 text-center">
            <BookOpen className="h-8 w-8 text-indigo-500/60 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-650 dark:text-indigo-400">{article.category}</span>
          </div>
        ) : (
          <img
            src={article.imageUrl}
            alt={article.imageAlt}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-750 ease-out group-hover:scale-103"
          />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-sans font-black uppercase tracking-widest text-primary dark:text-indigo-400">
            {article.category}
          </span>

        </div>

        <button
          onClick={(e) => onQuickSummary(article, e)}
          className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-[11px] font-sans font-bold uppercase tracking-wider text-primary dark:text-indigo-400 transition-all hover:bg-primary hover:text-white dark:hover:bg-indigo-550"
          id={`quick-summary-btn-${article.id}`}
        >
          <Sparkles className="h-3 w-3" />
          <span>Quick Summary</span>
        </button>
      </div>

      <h3 className="mt-2.5 font-serif text-xl font-bold leading-snug text-charcoal dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors tracking-tight">
        {article.title}
      </h3>

      <p className="mt-2 text-sm text-secondary-gray dark:text-slate-400 leading-relaxed line-clamp-3">
        {article.snippet}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <img
          src={getAvatarUrl(article.author.avatar)}
          alt={article.author.name}
          referrerPolicy="no-referrer"
          className="h-9 w-9 rounded-full object-cover border border-charcoal/10 dark:border-slate-800"
        />
        <div>
          <p className="text-xs font-bold text-charcoal dark:text-slate-200">
            {article.author.name}
          </p>
          <p className="text-[11px] text-secondary-gray/80 dark:text-slate-450">
            {article.author.role} • {article.date}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
