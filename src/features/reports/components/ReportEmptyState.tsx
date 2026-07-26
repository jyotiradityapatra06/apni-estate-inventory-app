import React from "react";
import { AlertTriangle, FileSpreadsheet, RefreshCw, Layers } from "lucide-react";

interface ReportEmptyStateProps {
  title?: string;
  description?: string;
  backendInfo?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export const ReportEmptyState: React.FC<ReportEmptyStateProps> = ({
  title = "No Data Found",
  description = "There are no report records available for the selected filters and date range.",
  backendInfo,
  actionText = "Reset Filters",
  onAction,
  icon: Icon = FileSpreadsheet,
}) => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center sm:p-12 dark:border-slate-800 dark:bg-slate-900/40 space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100/80 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
        <Icon size={28} />
      </div>

      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide dark:text-slate-100">
          {title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400 font-medium">
          {description}
        </p>
      </div>

      {backendInfo && (
        <div className="max-w-lg mx-auto rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-left text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-[11px] uppercase tracking-wider block">
              Backend Integration Notice
            </span>
            <p className="text-[11px] font-semibold leading-relaxed">
              {backendInfo}
            </p>
          </div>
        </div>
      )}

      {onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw size={14} />
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportEmptyState;
