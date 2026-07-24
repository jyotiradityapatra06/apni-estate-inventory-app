import { fmt } from "../../utils/currency";

export function AgeingReport({ rows }: { rows: any[] }) {
  const buckets = [
    { key: "0-30", label: "0-30 Days", color: "bg-emerald-50 border-emerald-200 text-emerald-950", badge: "bg-emerald-100 text-emerald-800" },
    { key: "31-60", label: "31-60 Days", color: "bg-amber-50 border-amber-200 text-amber-950", badge: "bg-amber-100 text-amber-800" },
    { key: "61-90", label: "61-90 Days", color: "bg-orange-50 border-orange-200 text-orange-950", badge: "bg-orange-100 text-orange-800" },
    { key: "90+", label: "90+ Days (Overdue)", color: "bg-red-50 border-red-200 text-red-950", badge: "bg-red-100 text-red-800" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-black text-slate-900 tracking-tight">Payment Ageing Breakdown</h2>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">Categorized breakdown of outstanding balances by aging period.</p>
      </div>

      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4 pt-1">
        {buckets.map((b) => {
          const total = (rows || [])
            .filter((r) => r.bucket === b.key || (b.key === "90+" && (r.bucket === "90+" || r.bucket === "90+ days")))
            .reduce((a, r) => a + Number(r.amountDue || r.amount || 0), 0);

          return (
            <div key={b.key} className={`rounded-xl border p-4 space-y-1.5 shadow-xs ${b.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{b.label}</span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${b.badge}`}>
                  {b.key}
                </span>
              </div>
              <strong className="text-lg sm:text-xl font-black block mt-1">{fmt(total)}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
