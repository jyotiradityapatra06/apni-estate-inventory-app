import { useEffect, useState } from "react";
import { financialApi } from "../../api/financial.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { LedgerTable } from "../../features/financials/LedgerTable";
import { fmt } from "../../utils/currency";
import { ArrowDownLeft, ArrowUpRight, BookOpen } from "lucide-react";

export default function LedgerPage() {
  const [data, setData] = useState<any[]>([]);
  const [party, setParty] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    financialApi
      .ledger(party ? `partyType=${party}` : "")
      .then((r) => setData(r.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [party]);

  const totalCredit = data.reduce((sum, x) => sum + Number(x.creditAmount || 0), 0);
  const totalDebit = data.reduce((sum, x) => sum + Number(x.debitAmount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Financial General Ledger"
        description="Complete audit trail of customer payments, supplier bills, and business expenses."
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Credit (Cash In)</span>
            <ArrowDownLeft size={18} className="text-green-600" />
          </div>
          <strong className="text-xl sm:text-2xl font-black text-green-700 block">{fmt(totalCredit)}</strong>
          <span className="text-[10px] font-semibold text-slate-400 block">Customer collections & receipts</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Debit (Cash Out)</span>
            <ArrowUpRight size={18} className="text-red-600" />
          </div>
          <strong className="text-xl sm:text-2xl font-black text-red-600 block">{fmt(totalDebit)}</strong>
          <span className="text-[10px] font-semibold text-slate-400 block">Vendor payments & expenses</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Logged Entries</span>
            <BookOpen size={18} className="text-orange-500" />
          </div>
          <strong className="text-xl sm:text-2xl font-black text-slate-900 block">{data.length} Transactions</strong>
          <span className="text-[10px] font-semibold text-slate-400 block">Audited general ledger logs</span>
        </div>
      </div>

      {/* Party Filter Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
          Filter Ledger Party Type:
        </label>
        <select
          aria-label="Party type"
          className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none cursor-pointer"
          value={party}
          onChange={(e) => setParty(e.target.value)}
        >
          <option value="">All Ledger Entries (Customers, Suppliers & Expenses)</option>
          <option value="CUSTOMER">Customer Transactions Only</option>
          <option value="SUPPLIER">Supplier Vendor Transactions Only</option>
          <option value="BUSINESS">Business Expense Transactions Only</option>
        </select>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <LedgerTable rows={data} />
      )}
    </div>
  );
}
