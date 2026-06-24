import React from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Article } from "../types";

interface ArticleCardProps {
  key?: any;
  article: Article;
  onRead: (article: Article) => void;
  onQuickSummary: (article: Article, e: React.MouseEvent<any>) => void;
}

export default function ArticleCard({ article, onRead, onQuickSummary }: ArticleCardProps) {
  if (article.featured) {
    return (
      <motion.div
        onClick={() => onRead(article)}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-charcoal/10 bg-[#e5e2dd] text-charcoal shadow-sm flex flex-col"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        id={`featured-card-${article.id}`}
      >
        {/* Aspect ratios */}
        <div className="aspect-[3/4] w-full sm:aspect-video relative overflow-hidden bg-[#e0deda]">
          <img
            src={article.imageUrl}
            alt={article.imageAlt}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Subtle paper-like gradient cover */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Contents */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-white/40 backdrop-blur-sm border-t border-charcoal/10">
          <div>
            <span className="mb-4 inline-block rounded-none bg-primary px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-wider text-white">
              The Long Read
            </span>
            <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl text-charcoal group-hover:text-primary transition-colors">
              {article.title}
            </h2>
            <p className="mt-3 font-sans text-sm text-charcoal/85 line-clamp-2 leading-relaxed">
              {article.subtitle}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-charcoal/10 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-primary">
              <span>Read Publication</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
            <span className="font-sans text-[10px] uppercase font-bold text-secondary-gray/70">
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
      className="group flex flex-col cursor-pointer overflow-hidden border-b border-border-outline pb-8 transition-opacity duration-300"
      whileHover={{ y: -2 }}
      id={`article-card-${article.id}`}
    >
      {/* Article Image */}
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-[#e5e2dd] border border-charcoal/5 relative">
        <img
          src={article.imageUrl}
          alt={article.imageAlt}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-750 ease-out group-hover:scale-103"
        />
      </div>

      {/* Meta category & Quick Summary */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-sans font-black uppercase tracking-widest text-primary">
          {article.category}
        </span>

        {/* Quick summary trigger */}
        <button
          onClick={(e) => onQuickSummary(article, e)}
          className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-sans font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary hover:text-white"
          id={`quick-summary-btn-${article.id}`}
        >
          <Sparkles className="h-3 w-3" />
          <span>Quick Summary</span>
        </button>
      </div>

      {/* Title */}
      <h3 className="mt-2.5 font-serif text-xl font-bold leading-snug text-charcoal sm:text-2xl group-hover:text-primary transition-colors tracking-tight">
        {article.title}
      </h3>

      {/* Snippet */}
      <p className="mt-2 text-sm text-secondary-gray leading-relaxed line-clamp-3">
        {article.snippet}
      </p>

      {/* Author information */}
      <div className="mt-4 flex items-center gap-3">
        <img
          src={article.author.avatar}
          alt={article.author.name}
          referrerPolicy="no-referrer"
          className="h-9 w-9 rounded-full object-cover grayscale border border-charcoal/10"
        />
        <div>
          <p className="text-xs font-bold text-charcoal">
            {article.author.name}
          </p>
          <p className="text-[11px] text-secondary-gray/80">
            {article.author.role} • {article.date}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
