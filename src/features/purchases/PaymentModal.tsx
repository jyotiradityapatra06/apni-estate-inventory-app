import { useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import { fmt } from "../../utils/currency";

export function PaymentModal({
  id,
  balance,
  onClose,
  onDone,
}: {
  id: string;
  balance: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("CASH");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (Number(amount) <= 0 || Number(amount) > balance) {
      return setError(`Please enter an amount up to ${fmt(balance)}.`);
    }
    setBusy(true);
    try {
      await purchaseApi.pay(id, {
        amount: Number(amount),
        paymentMode: mode,
        paymentDate: new Date(date).toISOString(),
        idempotencyKey: crypto.randomUUID(),
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4">
      <div className="w-full rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl space-y-4 shadow-xl">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Record Supplier Payment</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Remaining Payable Balance: <strong className="text-red-600 font-black">{fmt(balance)}</strong>
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-800">
            {error}
          </p>
        )}

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Payment Amount (₹) *
          <input
            required
            type="number"
            inputMode="decimal"
            min="0.01"
            max={balance}
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base font-black text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
          />
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Payment Mode *
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
            {["CASH", "UPI", "BANK", "CHEQUE", "OTHER"].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Payment Date *
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </label>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] flex-1 rounded-xl border border-slate-200 text-xs sm:text-sm font-extrabold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={save}
            className="min-h-[48px] flex-[2] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-xs disabled:opacity-60"
          >
            {busy ? "Recording Payment…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
