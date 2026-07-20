import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <div className="h-4 w-1/3 rounded bg-slate-200 mb-3" />
        <div className="h-8 w-1/2 rounded bg-slate-200" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-xl border border-slate-100 bg-white p-4 flex items-center justify-between">
            <div className="space-y-2 w-2/3">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-3 w-1/3 rounded bg-slate-200" />
            </div>
            <div className="h-8 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center max-w-xl mx-auto my-4 shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 shadow-sm">
        <Icon size={28} />
      </span>
      <h3 className="mt-5 text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center max-w-xl mx-auto my-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle size={24} />
      </div>
      <p className="mt-4 text-sm font-semibold text-red-900">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center justify-center min-h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
