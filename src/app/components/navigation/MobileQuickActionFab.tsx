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
          className="fixed inset-0 z-[55] bg-slate-950/45 backdrop-blur-xs md:hidden animate-fade-in"
        />
      )}

      {/* Slide-up Action Sheet */}
      {open && (
        <div className="fixed bottom-[96px] right-3 left-3 z-[60] max-w-[400px] mx-auto rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xl md:hidden animate-in slide-in-from-bottom-4 duration-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Supplier Quick Actions</h3>
              <p className="text-[10px] font-semibold text-slate-400">Create records in 1-tap</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[50dvh] overflow-y-auto">
            {actions.map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                onClick={() => go(path)}
                className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-3.5 py-2 text-left transition-all duration-150 hover:bg-slate-100 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#F97316] border border-orange-100 shrink-0">
                    <Icon size={18} />
                  </span>
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {label}
                  </span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Floating Action Button */}
      <button
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        onClick={() => setOpen(!open)}
        className={`fixed bottom-[80px] right-4 z-[65] flex h-14 w-14 items-center justify-center rounded-full bg-[#0F172A] text-white shadow-xl ring-4 ring-white md:hidden press-active cursor-pointer transition-transform duration-200 ${
          open ? "rotate-45 bg-orange-600" : ""
        }`}
      >
        <Plus size={26} className="text-white stroke-[2.5]" />
      </button>
    </>
  );
}

export default MobileQuickActionFab;
