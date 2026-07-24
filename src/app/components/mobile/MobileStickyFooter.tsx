import React, { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../ui/utils";

export interface MobileFooterAction {
  label: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: "primary" | "accent" | "destructive" | "outline" | "ghost";
}

export interface MobileStickyFooterProps {
  primaryAction?: MobileFooterAction;
  secondaryAction?: MobileFooterAction;
  extraActions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export const MobileStickyFooter: React.FC<MobileStickyFooterProps> = ({
  primaryAction,
  secondaryAction,
  extraActions,
  className,
  children,
}) => {
  const getPrimaryClass = (variant?: string) => {
    switch (variant) {
      case "accent":
        return "bg-[#F97316] text-white hover:bg-orange-600 shadow-md shadow-orange-500/20";
      case "destructive":
        return "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20";
      default:
        return "bg-[#0F172A] text-white hover:bg-slate-800 shadow-md shadow-slate-900/20";
    }
  };

  const getSecondaryClass = (variant?: string) => {
    switch (variant) {
      case "ghost":
        return "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent";
      default:
        return "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50";
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.08)] transition-all",
        className
      )}
    >
      <div className="flex items-center gap-2.5 max-w-[500px] mx-auto">
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled || secondaryAction.loading}
            className={cn(
              "flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-bold transition-all press-active cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              getSecondaryClass(secondaryAction.variant)
            )}
          >
            {secondaryAction.loading ? (
              <Loader2 size={16} className="animate-spin text-slate-500" />
            ) : (
              secondaryAction.icon
            )}
            <span>{secondaryAction.label}</span>
          </button>
        )}

        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
            className={cn(
              "flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-2xl px-4 text-xs font-extrabold transition-all press-active cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              getPrimaryClass(primaryAction.variant)
            )}
          >
            {primaryAction.loading ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              primaryAction.icon
            )}
            <span>{primaryAction.label}</span>
          </button>
        )}

        {extraActions}
        {children}
      </div>
    </div>
  );
};

export default MobileStickyFooter;
