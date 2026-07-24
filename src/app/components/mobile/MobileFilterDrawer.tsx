import React, { ReactNode } from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import { cn } from "../ui/utils";

export interface MobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  activeFilterCount?: number;
  onApply: () => void;
  onReset?: () => void;
  applyLabel?: string;
  resetLabel?: string;
  children: ReactNode;
  className?: string;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  open,
  onClose,
  title = "Filter Results",
  subtitle = "Refine records by options below",
  activeFilterCount = 0,
  onApply,
  onReset,
  applyLabel = "Apply Filters",
  resetLabel = "Clear All",
  children,
  className,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end bg-slate-950/45 backdrop-blur-xs md:hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop click area */}
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      {/* Slide-Up Drawer Container */}
      <div
        className={cn(
          "relative z-10 w-full max-h-[85dvh] flex flex-col rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-200",
          className
        )}
      >
        {/* Top Handle Pill */}
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-200 shrink-0" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
              <Filter size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight leading-none">
                  {title}
                </h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#F97316] px-2 py-0.5 text-[10px] font-black text-white">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              {subtitle && <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Children Filter Inputs */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scroll-smooth-mobile">
          {children}
        </div>

        {/* Sticky Drawer Footer Actions */}
        <div className="border-t border-slate-100 p-4 shrink-0 bg-slate-50/50 pb-[max(16px,env(safe-area-inset-bottom))] flex items-center gap-3">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>{resetLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="flex min-h-[48px] flex-[2] items-center justify-center rounded-2xl bg-[#0F172A] text-xs font-extrabold text-white shadow-md hover:bg-slate-800 active:scale-95 transition-transform cursor-pointer"
          >
            <span>{applyLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterDrawer;
