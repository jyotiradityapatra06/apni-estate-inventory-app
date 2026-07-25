import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:items-center sm:p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full rounded-t-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl sm:max-w-md sm:rounded-2xl text-slate-900 dark:text-slate-100">
        <AlertTriangle className={destructive ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"} />
        <h2 id="confirm-title" className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-[15px] text-slate-600 dark:text-slate-300">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="min-h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-[14px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`min-h-11 rounded-lg px-4 text-[14px] font-semibold text-white cursor-pointer ${
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-[#F97316] hover:bg-orange-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
