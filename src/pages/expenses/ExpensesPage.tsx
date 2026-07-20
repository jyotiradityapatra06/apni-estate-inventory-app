import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, Landmark, TrendingDown, DollarSign, ArrowLeft } from "lucide-react";
import { expenseApi, expenseCategoryApi } from "../../api/expense.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { PageHeader } from "../../app/components/common/PageHeader";
import type { Expense, ExpenseCategory, ExpenseSummary } from "../../features/expenses/expense.types";
import { StatCard } from "../../app/components/common/Card";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { useAuth } from "../../hooks/useAuth";
import { fmt } from "../../utils/currency";
import { hasPermission } from "../../utils/permissions";

const emptySummary: ExpenseSummary = { todayExpenses: 0, monthExpenses: 0, totalPaid: 0, pendingExpenses: 0 };

export default function ExpensesPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, "expenses:manage");

  const [data, setData] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("");
  const [gst, setGst] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const q = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) q.set("search", search);
    if (from) q.set("from", from);
    if (to) q.set("to", `${to}T23:59:59.999`);
    if (category) q.set("categoryId", category);
    if (status) q.set("paymentStatus", status);
    if (mode) q.set("paymentMode", mode);
    if (gst) q.set("gstApplicable", gst);

    try {
      const [r, s] = await Promise.all([
        expenseApi.list(q.toString()),
        expenseApi.summary()
      ]);
      setData(r.data);
      setPages(r.pagination.pages);
      setSummary(s.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Expenses could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    expenseCategoryApi.list("active=all").then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [page, search, from, to, category, status, mode, gst]);

  const clear = () => {
    setSearch("");
    setFrom("");
    setTo("");
    setCategory("");
    setStatus("");
    setMode("");
    setGst("");
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <PageHeader 
        title="Expenses" 
        description="Record and track business expenses." 
        actions={
          canManage && (
            <Link to="/expenses/new" className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer">
              <Plus size={15}/>
              Add Expense
            </Link>
          )
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Today's Expenses" value={fmt(summary.todayExpenses)} helper="Total recorded today" icon={TrendingDown} />
        <StatCard label="This Month" value={fmt(summary.monthExpenses)} helper="Expenses this billing cycle" icon={TrendingDown} />
        <StatCard label="Total Paid" value={fmt(summary.totalPaid)} helper="Paid out expenses" icon={DollarSign} />
        <StatCard label="Pending Expenses" value={fmt(summary.pendingExpenses)} helper="Awaiting disbursement" icon={Landmark} className={summary.pendingExpenses > 0 ? "border-amber-200 bg-amber-50/20" : ""} />
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
            <input 
              aria-label="Search expenses" 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder="Search category, payee, transaction ID or notes" 
              className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </label>
          <input aria-label="From date" type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"/>
          <input aria-label="To date" type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"/>
          <select aria-label="Expense category" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select aria-label="Payment status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
            <option value="">All Statuses</option>
            <option>PENDING</option>
            <option>PAID</option>
            <option>CANCELLED</option>
          </select>
          <select aria-label="Payment mode" value={mode} onChange={e => { setMode(e.target.value); setPage(1); }} className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
            <option value="">All Payment Methods</option>
            {["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"].map(x => <option key={x}>{x}</option>)}
          </select>
          <select aria-label="GST applicable" value={gst} onChange={e => { setGst(e.target.value); setPage(1); }} className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
            <option value="">GST & Non-GST</option>
            <option value="true">GST Invoice</option>
            <option value="false">No GST</option>
          </select>
        </div>
        {(search || from || to || category || status || mode || gst) && (
          <button 
            onClick={clear} 
            className="font-bold text-xs text-slate-700 hover:bg-slate-50 px-4 h-10 border rounded-lg cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4}/>
      ) : error ? (
        <EmptyState title="Could not load expenses" description={error} action={<button onClick={load} className="rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold">Retry</button>} />
      ) : !data.length ? (
        <EmptyState 
          title="No Expenses Added" 
          description={search || from || to || category || status || mode || gst ? "Try adjusting filters or search keywords." : "Start tracking business expenses."} 
          icon={Landmark} 
          action={
            canManage && (
              <Link to="/expenses/new" className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 text-xs font-bold text-white transition-colors cursor-pointer">
                Add Expense
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  {["Expense Number", "Date", "Category", "Payee", "Total", "Payment Method", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(x => (
                  <tr key={x.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{x.expenseNumber}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {new Date(x.expenseDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 text-slate-900 font-semibold">{x.category.name}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{x.payee || "—"}</td>
                    <td className="px-4 py-3.5 font-black text-slate-950">{fmt(x.totalAmount)}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{x.paymentMode?.replaceAll("_", " ") || "—"}</td>
                    <td className="px-4 py-3.5">
                      <BusinessStatusBadge status={x.paymentStatus}/>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link className="font-bold text-xs text-orange-600 hover:text-orange-700 cursor-pointer" to={`/expenses/${x.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="grid gap-4 md:hidden">
            {data.map(x => (
              <article key={x.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{x.category.name}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{x.expenseNumber} &middot; {x.payee || "No payee"}</p>
                  </div>
                  <BusinessStatusBadge status={x.paymentStatus}/>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3 border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Expense Total</span>
                    <strong className="text-slate-950 text-sm mt-0.5 block">{fmt(x.totalAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Date</span>
                    <span className="text-slate-700 text-xs mt-0.5 block">{new Date(x.expenseDate).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <Link to={`/expenses/${x.id}`} className="flex min-h-9 items-center justify-center rounded-xl border text-xs font-bold text-slate-700 hover:bg-slate-50">
                  View Details
                </Link>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t pt-4">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)} 
              className="min-h-10 rounded-xl border px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-medium">Page {page} of {pages}</span>
            <button 
              disabled={page >= pages} 
              onClick={() => setPage(p => p + 1)} 
              className="min-h-10 rounded-xl border px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
