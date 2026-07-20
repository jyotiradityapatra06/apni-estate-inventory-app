import { useLocation, useNavigate } from "react-router";
import { getMobileNavigation, isNavigationItemActive } from "../../../constants/navigation";
import { useAuth } from "../../../hooks/useAuth";

export function MobileBottomNavigation({ onOpenMore }: { isDark?: boolean; onOpenMore: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const items = isLoading ? [] : getMobileNavigation(user);

  return <nav aria-label="Primary mobile navigation" className="border-t border-[var(--border-default)] bg-white pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
    <div className="grid h-[64px] grid-flow-col auto-cols-fr">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === "more" ? location.pathname === "/more" : isNavigationItemActive(item, location.pathname);
        return <button key={item.id} type="button" onClick={() => item.id === "more" ? onOpenMore() : navigate(item.path)} aria-current={active ? "page" : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-bold transition cursor-pointer ${active ? "text-[#F97316]" : "text-slate-500"}`}>
          {active && <span className="absolute inset-x-3 top-0 h-[3px] rounded-b bg-[#F97316]" />}
          <Icon size={20} strokeWidth={active ? 2.5 : 2} />
          <span className="w-full truncate text-center">{item.label}</span>
        </button>;
      })}
    </div>
  </nav>;
}

export default MobileBottomNavigation;
