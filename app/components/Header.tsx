import React, { useRef, useState, useEffect } from "react";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";

interface HeaderProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenSidebar: () => void;
  userRole?: string;
}

export default function Header({
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenSidebar,
  userRole,
}: HeaderProps) {
  const isAdmin = userRole === "admin";
  const isFaculty = userRole === "faculty";
  const isStaff = isAdmin || isFaculty;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll, { passive: true });
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-outline bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="md:hidden flex h-20 items-center justify-between">
          <button
            onClick={onOpenSidebar}
            className="rounded-full p-2 text-secondary-gray hover:bg-black/5 hover:text-primary transition-colors"
            id="menu-btn"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            {isStaff ? (
              <h1 className="font-serif text-2xl font-black tracking-tighter leading-none text-charcoal dark:text-white sm:text-3xl mt-0.5 uppercase">
                {isAdmin ? "Admin Console" : "Faculty Console"}
              </h1>
            ) : (
              <>
                <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-bold opacity-45">
                  Volume 04 // Issue 12
                </span>
                <h1 className="font-serif text-3xl font-black tracking-tighter leading-none text-charcoal sm:text-4xl mt-0.5">
                  THE EDITORIAL
                </h1>
              </>
            )}
          </div>

          <DarkModeToggle />
        </div>

        {/* Category chips */}
        {!isStaff && (
          <div className="relative w-full flex items-center group/nav">
            {showLeftArrow && (
              <button
                type="button"
                onClick={() => scroll("left")}
                className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/50 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 shadow-md text-slate-600 dark:text-slate-350 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer transition-all focus:outline-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

<div
  ref={scrollRef}
  className="flex-1 flex gap-3 overflow-x-auto py-2 px-1 scrollbar-none scroll-smooth"
>
  {categories.map((category) => {
    const isActive =
      selectedCategory.toLowerCase() === category.toLowerCase();

    return (
      <button
        key={category}
        onClick={() => onSelectCategory(category)}
        className={`relative whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 border backdrop-blur-md
          
          ${
            isActive
              ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white border-transparent shadow-md scale-105"
              : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600"
          }
        `}
      >
        {category}

        {/* Glow Effect */}
        {isActive && (
          <span className="absolute inset-0 rounded-full bg-indigo-500/20 blur-lg opacity-60"></span>
        )}
      </button>
    );
  })}
</div>

            {showRightArrow && (
              <button
                type="button"
                onClick={() => scroll("right")}
                className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/50 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 shadow-md text-slate-600 dark:text-slate-350 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer transition-all focus:outline-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
