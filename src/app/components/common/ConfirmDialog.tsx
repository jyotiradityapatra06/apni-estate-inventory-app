import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", destructive = false, onConfirm, onCancel }: { open: boolean; title: string; description: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
    <div className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl"><AlertTriangle className={destructive ? "text-red-700" : "text-amber-700"}/><h2 id="confirm-title" className="mt-3 text-xl font-bold text-slate-950">{title}</h2><p className="mt-2 text-[15px] text-slate-600">{description}</p><div className="mt-6 flex justify-end gap-2"><button onClick={onCancel} className="min-h-11 rounded-lg border border-slate-300 px-4 text-[14px] font-semibold text-slate-700">Cancel</button><button onClick={onConfirm} className={`min-h-11 rounded-lg px-4 text-[14px] font-semibold text-white ${destructive ? "bg-red-700" : "bg-blue-700"}`}>{confirmLabel}</button></div></div>
  </div>;
}
