import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function SupplierPaymentReversalDialog({ open, paymentNumber, busy = false, onConfirm, onCancel }: { open: boolean; paymentNumber: string; busy?: boolean; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open, paymentNumber]);
  if (!open) return null;
  const valid = reason.trim().length > 0;
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" role="alertdialog" aria-modal="true" aria-labelledby="supplier-reversal-title">
    <div className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl">
      <AlertTriangle className="text-red-700"/>
      <h2 id="supplier-reversal-title" className="mt-3 text-xl font-bold text-slate-950">Reverse {paymentNumber}?</h2>
      <p className="mt-2 text-[15px] text-slate-600">This keeps the original payment, restores the payable, and posts an opposite ledger entry.</p>
      <label className="mt-4 block text-sm font-semibold text-slate-800">Reversal reason
        <textarea autoFocus required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-base" placeholder="Explain why this payment is being reversed"/>
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <button disabled={busy} onClick={onCancel} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold disabled:opacity-60">Cancel</button>
        <button disabled={!valid||busy} onClick={()=>onConfirm(reason.trim())} className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60">{busy?"Reversing...":"Reverse Payment"}</button>
      </div>
    </div>
  </div>;
}
