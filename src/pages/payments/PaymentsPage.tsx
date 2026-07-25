import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Filter, Printer, Eye, Calendar, DollarSign, CreditCard, RotateCcw } from "lucide-react";
import { useNavigate, Link } from "react-router";
import paymentApi from "../../api/payment.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { fmt } from "../../utils/currency";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { PageHeader } from "../../app/components/common/PageHeader";

export default function PaymentsPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    setLoading(true);
    paymentApi
      .getAll()
      .then((r) => {
        setData(r.data || []);
        setLoading(false);
      })
      .catch((e: any) => {
        setError(e.message || "Failed to load customer payments");
        setLoading(false);
      });
  }, []);

  const filteredPayments = useMemo(() => {
    return data.filter((p) => {
      // Search term
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        [p.paymentNumber, p.customer?.name, p.customer?.customerCode, p.invoice?.invoiceNumber, p.referenceNumber]
          .some((v) => v?.toLowerCase().includes(q));

      // Method filter
      const matchesMethod = methodFilter === "ALL" || p.paymentMethod?.toUpperCase() === methodFilter.toUpperCase();

      // Status filter
      const matchesStatus = statusFilter === "ALL" || p.status?.toUpperCase() === statusFilter.toUpperCase();

      // Date range filter
      let matchesDate = true;
      if (fromDate) {
        matchesDate = matchesDate && new Date(p.paymentDate) >= new Date(fromDate);
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(p.paymentDate) <= end;
      }

      return matchesSearch && matchesMethod && matchesStatus && matchesDate;
    });
  }, [data, search, methodFilter, statusFilter, fromDate, toDate]);

  const summary = useMemo(() => {
    const totalAmount = filteredPayments.filter((p) => p.status === "POSTED").reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalCount = filteredPayments.length;
    const postedCount = filteredPayments.filter((p) => p.status === "POSTED").length;
    const reversedCount = filteredPayments.filter((p) => p.status === "REVERSED").length;

    return { totalAmount, totalCount, postedCount, reversedCount };
  }, [filteredPayments]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Customer Payments"
        description="History and receipts of payments received from customers."
        actions={
          user &&
          hasPermission(user, "sales:manage") && (
            <button
              onClick={() => nav("/payments/new")}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={18} />
              Record Payment
            </button>
          )
        }
      />

      {error && <div className="rounded-xl bg-red-50 p-4 text-red-800 text-sm font-bold border border-red-200">{error}</div>}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Received</span>
          <strong className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">{fmt(summary.totalAmount)}</strong>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">{summary.postedCount} posted receipts</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Transactions</span>
          <strong className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">{summary.totalCount}</strong>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">All payment records</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Active Receipts</span>
          <strong className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">{summary.postedCount}</strong>
          <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">Valid payments</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Reversals</span>
          <strong className="text-xl sm:text-2xl font-black text-red-600 mt-1 block">{summary.reversedCount}</strong>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Reversed payments</span>
        </div>
      </div>

      {/* Filter Control Toolbar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, code, or receipt #..."
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 h-11 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="POSTED">POSTED (Active)</option>
              <option value="REVERSED">REVERSED</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div>
            <button
              onClick={() => {
                setSearch("");
                setMethodFilter("ALL");
                setStatusFilter("ALL");
                setFromDate("");
                setToDate("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Optional Date Range Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Filter by Date Range:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-700 focus:outline-none"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-700 focus:outline-none"
          />
        </div>
      </section>

      {/* Payment History Viewport */}
      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" role="status" aria-label="Loading payment history" />
      ) : filteredPayments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 space-y-2">
          <p className="font-bold text-base text-slate-800">No payment records found</p>
          <p className="text-xs text-slate-500">Try clearing or adjusting your search filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table Viewport (>=768px) */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Payment Number</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Invoice Ref</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Received By</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <Link to={`/payments/${p.id}`} className="hover:text-orange-600 transition-colors">
                        {p.paymentNumber}
                      </Link>
                    </td>
                    <td className="p-3.5">
                      <p className="font-extrabold text-slate-900">{p.customer?.name || "—"}</p>
                      {p.customer?.customerCode && <p className="text-[10px] text-slate-400 font-bold">{p.customer.customerCode}</p>}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{p.invoice?.invoiceNumber || "—"}</td>
                    <td className="p-3.5 text-right font-black text-emerald-700 text-sm">{fmt(p.amount)}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                        {p.paymentMethod?.replaceAll("_", " ")}
                      </span>
                      {p.referenceNumber && <p className="text-[10px] text-slate-400 mt-0.5">Ref: {p.referenceNumber}</p>}
                    </td>
                    <td className="p-3.5 text-slate-600">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                    <td className="p-3.5 text-slate-600">{p.receivedBy?.name || "—"}</td>
                    <td className="p-3.5 text-center">
                      <BusinessStatusBadge status={p.status} />
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/payments/${p.id}`}
                          className="min-h-8 inline-flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 px-2.5 text-[10px] font-bold text-slate-700 transition-colors"
                          title="View Payment Details"
                        >
                          <Eye size={12} /> View
                        </Link>
                        <Link
                          to={`/payments/${p.id}/receipt`}
                          className="min-h-8 inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 px-2.5 text-[10px] font-bold text-white transition-colors"
                          title="Print Official A4 Receipt"
                        >
                          <Printer size={12} /> Receipt
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Viewport (<768px) */}
          <div className="space-y-3.5 md:hidden">
            {filteredPayments.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <Link to={`/payments/${p.id}`} className="text-base font-extrabold text-slate-900 hover:text-orange-600">
                      {p.paymentNumber}
                    </Link>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{p.customer?.name}</p>
                  </div>
                  <BusinessStatusBadge status={p.status} />
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount Received</span>
                    <strong className="text-lg font-black text-emerald-700">{fmt(p.amount)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Mode</span>
                    <span className="font-extrabold text-slate-800 uppercase">{p.paymentMethod?.replaceAll("_", " ")}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
                  <p>Invoice: <strong className="text-slate-900">{p.invoice?.invoiceNumber || "—"}</strong></p>
                  <p className="text-right">Date: <strong>{new Date(p.paymentDate).toLocaleDateString("en-IN")}</strong></p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Link
                    to={`/payments/${p.id}`}
                    className="flex-1 min-h-10 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Eye size={14} /> Details
                  </Link>
                  <Link
                    to={`/payments/${p.id}/receipt`}
                    className="flex-1 min-h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white transition-colors"
                  >
                    <Printer size={14} /> Receipt
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
