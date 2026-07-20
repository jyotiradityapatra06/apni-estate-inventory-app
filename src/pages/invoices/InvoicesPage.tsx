import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FileText, Search, Landmark, CheckCircle, Clock, Receipt } from "lucide-react";
import invoiceApi from "../../api/invoice.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { StatCard } from "../../app/components/common/Card";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { fmt } from "../../utils/currency";
import type { Invoice } from "../../features/invoices/invoice.types";

export default function InvoicesPage() {
  const [data, setData] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [kind, setKind] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => invoiceApi.getAll().then(r => setData(r.data || [])).catch(e => setError(e.message)).finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    return data.filter(x => {
      const q = search.toLowerCase();
      const d = x.invoiceDate.slice(0, 10);
      return (
        (!q || [x.invoiceNumber, x.customerName, x.customerPhone, x.salesOrder?.orderNumber].some(v => v?.toLowerCase().includes(q))) &&
        (status === "ALL" || x.status === status) &&
        (kind === "ALL" || x.invoiceType === kind) &&
        (!from || d >= from) &&
        (!to || d <= to)
      );
    });
  }, [data, search, status, kind, from, to]);

  const active = data.filter(x => x.status !== "CANCELLED");

  // Calculations for summary tiles
  const unpaidCount = active.filter(x => x.status === "ISSUED").length;
  const partialCount = active.filter(x => x.status === "PARTIALLY_PAID").length;
  const paidCount = active.filter(x => x.status === "PAID").length;
  const amountToReceive = active.reduce((n, x) => n + Number(x.balanceDue), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader title="Invoices" description="Create, view and print customer bills." />

      {/* Summary StatCards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Invoices" value={data.length} helper="All bills created" icon={FileText} />
        <StatCard label="Unpaid Invoices" value={unpaidCount} helper="Payment pending" icon={Clock} className={unpaidCount > 0 ? "border-red-200 bg-red-50/20" : ""} />
        <StatCard label="Partially Paid" value={partialCount} helper="Partial receipts" icon={Clock} className={partialCount > 0 ? "border-amber-200 bg-amber-50/20" : ""} />
        <StatCard label="Paid Bills" value={paidCount} helper="Fully settled bills" icon={CheckCircle} />
        <StatCard label="Outstanding Amount" value={fmt(amountToReceive)} helper="Receivables pending" icon={Landmark} />
      </div>

      {/* Search & Filters */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_180px_170px_150px_150px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
          <input 
            aria-label="Search invoices" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Invoice, Sale, customer or phone" 
            className="h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </label>
        <select 
          aria-label="Invoice status" 
          value={status} 
          onChange={(e) => setStatus(e.target.value)} 
          className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="ALL">All statuses</option>
          {["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "CANCELLED"].map((x) => (
            <option key={x} value={x}>{x.replaceAll("_", " ")}</option>
          ))}
        </select>
        <select 
          aria-label="Bill type" 
          value={kind} 
          onChange={(e) => setKind(e.target.value)} 
          className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="ALL">All bill types</option>
          <option value="GST">GST Invoice</option>
          <option value="NON_GST">Non-GST Bill</option>
        </select>
        <input 
          aria-label="From date" 
          type="date" 
          value={from} 
          onChange={(e) => setFrom(e.target.value)} 
          className="h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        <input 
          aria-label="To date" 
          type="date" 
          value={to} 
          onChange={(e) => setTo(e.target.value)} 
          className="h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        {(search || status !== "ALL" || kind !== "ALL" || from || to) && (
          <button 
            onClick={() => { setSearch(""); setStatus("ALL"); setKind("ALL"); setFrom(""); setTo(""); }} 
            className="font-bold text-xs text-slate-700 hover:bg-slate-50 px-4 h-10 border rounded-lg cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4}/>
      ) : error ? (
        <EmptyState title="Could not load invoices" description={error} action={<button onClick={load} className="rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold">Retry</button>} />
      ) : !visible.length ? (
        <EmptyState 
          title="No Invoices Generated" 
          description={data.length ? "Try adjusting filters or search keywords." : "Generate invoices after confirming sales."} 
          icon={Receipt} 
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  {["Invoice Number", "Date", "Customer", "Bill Type", "Sales Order", "Total", "Paid", "Balance Due", "Status"].map((x) => (
                    <th key={x} className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((x) => (
                  <tr key={x.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <Link to={`/invoices/${x.id}`} className="font-bold text-orange-600 hover:text-orange-700 hover:underline">
                        {x.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {new Date(x.invoiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block font-bold text-slate-900">{x.customerName}</span>
                      <span className="text-xs text-slate-500">{x.customerPhone}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        x.invoiceType === "GST" 
                          ? "bg-blue-50 text-blue-700 border border-blue-100" 
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {x.invoiceType === "GST" ? "GST Invoice" : "Non-GST Bill"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                      {x.salesOrder?.orderNumber ? (
                        <Link to={`/sales-orders/${x.salesOrderId}`} className="hover:underline">
                          {x.salesOrder.orderNumber}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{fmt(x.totalAmount)}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{fmt(x.amountPaid)}</td>
                    <td className="px-4 py-3.5 font-bold text-red-600">{fmt(x.balanceDue)}</td>
                    <td className="px-4 py-3.5">
                      <BusinessStatusBadge status={x.status}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid gap-4 md:hidden">
            {visible.map((x) => (
              <div 
                key={x.id} 
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <Link to={`/invoices/${x.id}`} className="font-bold text-sm text-orange-600 hover:underline">
                      {x.invoiceNumber}
                    </Link>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      x.invoiceType === "GST" 
                        ? "bg-blue-50 text-blue-700 border border-blue-100" 
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {x.invoiceType === "GST" ? "GST" : "Non-GST"}
                    </span>
                  </div>
                  <BusinessStatusBadge status={x.status}/>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{x.customerName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Date: {new Date(x.invoiceDate).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3 border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Total</span>
                    <strong className="text-slate-900 mt-0.5 block">{fmt(x.totalAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Paid</span>
                    <span className="text-slate-700 mt-0.5 block">{fmt(x.amountPaid)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Balance</span>
                    <strong className="text-red-600 mt-0.5 block">{fmt(x.balanceDue)}</strong>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Link to={`/invoices/${x.id}`} className="flex-1 flex min-h-9 items-center justify-center rounded-xl border text-xs font-bold text-slate-700 hover:bg-slate-50">
                    View Bill
                  </Link>
                  <Link to={`/invoices/${x.id}?print=1`} className="flex-1 flex min-h-9 items-center justify-center rounded-xl bg-orange-50 text-xs font-bold text-orange-600 hover:bg-orange-100">
                    Print
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
