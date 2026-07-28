import { useState } from "react";
import { Plus, X, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import { getVisibleQuickActions } from "../../../constants/quickActions";

export function MobileQuickActionFab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;
  if (location.pathname.endsWith("/new") || location.pathname.endsWith("/edit")) return null;
  if (/^\/invoices\/[^/]+$/.test(location.pathname)) return null;

  const actions = getVisibleQuickActions(user);
  if (!actions.length) return null;

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[55] bg-slate-950/60 backdrop-blur-xs md:hidden animate-fade-in"
        />
      )}

      {/* Slide-up Action Sheet */}
      {open && (
        <div className="fixed bottom-[96px] right-3 left-3 z-[60] max-w-[400px] mx-auto rounded-3xl border border-border/80 dark:border-slate-800 bg-card dark:bg-slate-900 p-4 shadow-2xl md:hidden animate-in slide-in-from-bottom-4 duration-200 space-y-3">
          <div className="flex items-center justify-between border-b border-border dark:border-slate-800 pb-2 px-1">
            <div>
              <h3 className="text-sm font-black text-foreground dark:text-white tracking-tight">Supplier Quick Actions</h3>
              <p className="text-[10px] font-semibold text-muted-foreground dark:text-muted-foreground">Create records in 1-tap</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted dark:bg-slate-800 text-muted-foreground dark:text-muted-foreground cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[50dvh] overflow-y-auto">
            {actions.map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                onClick={() => go(path)}
                className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50 px-3.5 py-2 text-left transition-all duration-150 hover:bg-muted dark:hover:bg-slate-800 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#F97316] border border-orange-100 dark:border-orange-900/50 shrink-0">
                    <Icon size={18} />
                  </span>
                  <span className="text-xs font-bold text-foreground dark:text-slate-100 leading-tight">
                    {label}
                  </span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Floating Action Button */}
      <button
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        onClick={() => setOpen(!open)}
        className={`fixed bottom-[80px] right-4 z-[65] flex h-14 w-14 items-center justify-center rounded-full bg-[#0F172A] dark:bg-orange-600 text-white shadow-xl ring-4 ring-white dark:ring-slate-950 md:hidden press-active cursor-pointer transition-transform duration-200 ${
          open ? "rotate-45 bg-orange-600 dark:bg-orange-700" : ""
        }`}
      >
        <Plus size={26} className="text-white stroke-[2.5]" />
      </button>
    </>
  );
}

export default MobileQuickActionFab;
