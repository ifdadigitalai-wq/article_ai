import { Menu } from "lucide-react";

interface HeaderProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenSidebar: () => void;
}

export default function Header({
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenSidebar,
}: HeaderProps) {
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
            <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-bold opacity-45">
              Volume 04 // Issue 12
            </span>
            <h1 className="font-serif text-3xl font-black tracking-tighter leading-none text-charcoal sm:text-4xl mt-0.5">
              THE EDITORIAL
            </h1>
          </div>

          {/* Spacer to keep the title centered */}
          <div className="w-9 h-9" />
        </div>

        {/* Category chips */}
        <nav className="flex space-x-6 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth justify-center">
          {categories.map((category) => {
            const isActive = selectedCategory.toLowerCase() === category.toLowerCase();
            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`relative whitespace-nowrap pb-1.5 text-xs font-sans font-bold uppercase tracking-widest transition-colors ${
                  isActive
                    ? "text-primary font-bold"
                    : "text-secondary-gray/70 hover:text-primary"
                }`}
              >
                {category}
                {isActive && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
