import { ArrowDownLeft, ArrowUpRight, User, Calendar, FileText } from "lucide-react";
import { fmt } from "../../utils/currency";

export function LedgerTable({ rows }: { rows: any[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
        <p className="font-extrabold text-sm text-slate-900">No Ledger Transactions Logged</p>
        <p className="text-xs text-slate-400">Transactions will automatically log when invoices, payments, or purchase bills are recorded.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View (>=768px) */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              {["Date", "Party Name", "Transaction Type", "Ref #", "Credit (Cash In)", "Debit (Cash Out)", "Created By"].map((x) => (
                <th key={x} className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-slate-500">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const isCredit = Number(x.creditAmount || 0) > 0;
              const isDebit = Number(x.debitAmount || 0) > 0;

              return (
                <tr key={x.id} className="border-b last:border-0 border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-600">
                    {new Date(x.transactionDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3.5">
                    <strong className="font-black text-slate-900 block">{x.party?.name || "General Ledger"}</strong>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{x.partyType || "SYSTEM"}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                      {x.transactionType ? x.transactionType.replaceAll("_", " ") : "TRANSACTION"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-slate-500">
                    {x.referenceNumber || x.referenceType || "—"}
                  </td>
                  <td className="px-4 py-3.5 font-black text-green-700">
                    {isCredit ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">
                        <ArrowDownLeft size={14} /> +{fmt(x.creditAmount)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-black text-red-600">
                    {isDebit ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                        <ArrowUpRight size={14} /> -{fmt(x.debitAmount)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-semibold">{x.createdBy?.name || "System"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (<768px) */}
      <div className="grid gap-3.5 md:hidden">
        {rows.map((x) => {
          const isCredit = Number(x.creditAmount || 0) > 0;
          const isDebit = Number(x.debitAmount || 0) > 0;

          return (
            <article key={x.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <b className="text-sm font-black text-slate-900 block">{x.party?.name || "General Ledger"}</b>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 block">
                    {new Date(x.transactionDate).toLocaleDateString("en-IN")} · {x.transactionType?.replaceAll("_", " ")}
                  </span>
                </div>
                {isCredit && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 font-black text-xs border border-green-200">
                    <ArrowDownLeft size={14} /> +{fmt(x.creditAmount)}
                  </span>
                )}
                {isDebit && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-black text-xs border border-red-200">
                    <ArrowUpRight size={14} /> -{fmt(x.debitAmount)}
                  </span>
                )}
                {!isCredit && !isDebit && (
                  <strong className="text-sm font-black text-slate-900">{fmt(x.amount || 0)}</strong>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500 font-semibold">
                <span>Ref: {x.referenceNumber || x.referenceType || "N/A"}</span>
                <span>By: {x.createdBy?.name || "System"}</span>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
