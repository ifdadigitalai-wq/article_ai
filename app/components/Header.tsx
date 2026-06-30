import { Menu } from "lucide-react";
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

  return (
    <header className="
  sticky top-0 z-40 w-full
  border-b border-slate-200/40 dark:border-slate-800/60
  bg-white/70 dark:bg-slate-950/70
  backdrop-blur-xl
  shadow-sm
">
      <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:px-8">

        {/* Top Bar */}
        <div className="md:hidden flex h-20 items-center justify-between relative">

          {/* Left - Menu */}
          <button
            onClick={onOpenSidebar}
            id="menu-btn"
            className="
          rounded-xl p-2.5
          text-slate-600 dark:text-slate-300
          hover:bg-slate-200/50 dark:hover:bg-slate-800/50
          transition-all duration-200
        "
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Center - Branding */}
          <div className="flex flex-col items-center text-center leading-tight">
            {isAdmin ? (
              <h1 className="
            text-2xl sm:text-3xl font-black tracking-tight
            bg-gradient-to-r from-indigo-600 to-purple-600
            bg-clip-text text-transparent
          ">
                Admin Console
              </h1>
            ) : (
              <>
                <span className="
              text-[10px] uppercase tracking-[0.3em]
              text-slate-500/70 dark:text-slate-400/70
              font-semibold
            ">
                  Volume 04 // Issue 12
                </span>

                <h1 className="
              text-3xl sm:text-4xl font-black tracking-tight
              text-slate-900 dark:text-white
            ">
                  THE EDITORIAL
                </h1>
              </>
            )}
          </div>

          {/* Right - Toggle */}
          <div className="flex items-center">
            <div className="
          p-1.5 rounded-lg
          bg-slate-200/40 dark:bg-slate-800/40
          backdrop-blur-md
        ">
              <DarkModeToggle />
            </div>
          </div>

          {/* Subtle top glow */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
        </div>

        {/* Category Navigation */}
        {!isAdmin && (
          <nav className="
        flex space-x-6 overflow-x-auto scrollbar-none scroll-smooth
        pb-3 pt-2
        md:justify-center
      ">
            {categories.map((category) => {
              const isActive =
                selectedCategory.toLowerCase() === category.toLowerCase();

              return (
                <button
                  key={category}
                  onClick={() => onSelectCategory(category)}
                  className={`
                relative whitespace-nowrap
                px-3 py-1.5 rounded-full
                text-xs font-semibold uppercase tracking-wider
                transition-all duration-200

                ${isActive
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                    }
              `}
                >
                  {category}

                  {/* Active glow */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md -z-10" />
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
