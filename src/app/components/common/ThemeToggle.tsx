import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../../hooks/useTheme";

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "", showLabel = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full p-2 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 active:scale-95 cursor-pointer ${
        showLabel ? "px-3 py-2 bg-muted dark:bg-slate-800/80 rounded-xl" : "h-10 w-10 bg-muted/80 dark:bg-slate-800/80"
      } ${className}`}
    >
      <span className="relative flex items-center justify-center transition-transform duration-300 transform rotate-0 dark:rotate-[360deg]">
        {isDark ? (
          <Sun size={18} className="text-amber-400 transition-all duration-200" />
        ) : (
          <Moon size={18} className="text-muted-foreground transition-all duration-200" />
        )}
      </span>
      {showLabel && (
        <span className="text-xs font-bold text-foreground dark:text-slate-200">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
