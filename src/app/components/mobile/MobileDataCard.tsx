import React, { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../ui/utils";

export interface SecondaryMetric {
  label: string;
  value: ReactNode;
  className?: string;
}

export interface MetadataItem {
  label: string;
  value: ReactNode;
}

export interface MobileDataCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  avatar?: ReactNode;
  primaryMetric?: {
    label?: string;
    value: ReactNode;
    helper?: string;
    trend?: string;
  };
  secondaryMetrics?: SecondaryMetric[];
  metadata?: MetadataItem[];
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export const MobileDataCard: React.FC<MobileDataCardProps> = ({
  title,
  subtitle,
  badge,
  avatar,
  primaryMetric,
  secondaryMetrics,
  metadata,
  actions,
  onClick,
  className,
  children,
}) => {
  const isClickable = typeof onClick === "function";

  return (
    <article
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] transition-all duration-150 space-y-3",
        isClickable && "cursor-pointer active:scale-[0.985] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md",
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {avatar && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs">
              {avatar}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug truncate">
                {title}
              </h3>
              {isClickable && !actions && (
                <ChevronRight size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 mt-0.5 truncate uppercase tracking-wider">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Primary Metric Banner */}
      {primaryMetric && (
        <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-2.5 flex items-baseline justify-between">
          <div>
            {primaryMetric.label && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                {primaryMetric.label}
              </span>
            )}
            <strong className="text-base font-black text-slate-900 dark:text-white mt-0.5 block leading-tight">
              {primaryMetric.value}
            </strong>
          </div>
          {primaryMetric.helper && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {primaryMetric.helper}
            </span>
          )}
        </div>
      )}

      {/* Secondary Metrics Grid */}
      {secondaryMetrics && secondaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          {secondaryMetrics.map((metric, idx) => (
            <div key={idx} className="min-w-0">
              <span className="text-slate-400 dark:text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                {metric.label}
              </span>
              <strong
                className={cn(
                  "text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block truncate",
                  metric.className
                )}
              >
                {metric.value}
              </strong>
            </div>
          ))}
        </div>
      )}

      {/* Metadata Rows */}
      {metadata && metadata.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {metadata.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">{item.label}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom Children */}
      {children}

      {/* Bottom Action Footer Buttons */}
      {actions && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800"
        >
          {actions}
        </div>
      )}
    </article>
  );
};

export default MobileDataCard;
