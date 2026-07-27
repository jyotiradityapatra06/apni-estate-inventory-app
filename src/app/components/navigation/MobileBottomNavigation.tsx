import { useLocation, useNavigate } from "react-router";
import { Menu } from "lucide-react";
import { getMobileNavigation, isNavigationItemActive, type NavigationItem } from "../../../constants/navigation";
import { useAuth } from "../../../hooks/useAuth";

export function MobileBottomNavigation({ onOpenMore }: { isDark?: boolean; onOpenMore: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const baseItems: NavigationItem[] = isLoading ? [] : getMobileNavigation(user);
  
  // Ensure the 5 supplier app tabs: Home, Inventory, Sales, Finance, More
  const tabs = [
    ...baseItems,
    { id: "more", label: "More", path: "#more", icon: Menu, group: "Account" as const }
  ];

  return (
    <nav
      aria-label="Primary mobile bottom navigation"
      className="border-t border-border/80 dark:border-slate-800 bg-card/95 dark:bg-slate-900/95 backdrop-blur-md pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] transition-colors duration-200"
    >
      <div className="grid h-[54px] grid-cols-5 items-center px-1">
        {tabs.map((item) => {
          const Icon = item.icon;
          const isMore = item.id === "more";
          const active = isMore ? false : isNavigationItemActive(item, location.pathname);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (isMore ? onOpenMore() : navigate(item.path))}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-all duration-200 press-active cursor-pointer ${
                active
                  ? "text-[#F97316] font-black"
                  : "text-muted-foreground dark:text-muted-foreground font-semibold hover:text-muted-foreground dark:hover:text-slate-200"
              }`}
            >
              {active && (
                <span className="absolute top-0 h-[3px] w-7 rounded-full bg-[#F97316] shadow-sm animate-fade-in" />
              )}
              <span className={`p-1 rounded-full transition-colors ${active ? "bg-orange-50 dark:bg-orange-950/60 text-[#F97316]" : ""}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </span>
              <span className="w-full truncate text-center text-[10px] leading-none tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNavigation;
