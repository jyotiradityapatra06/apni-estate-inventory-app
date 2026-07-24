import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { FileText, Search, Landmark, CheckCircle, Clock, Receipt, Filter, Plus } from "lucide-react";
import invoiceApi from "../../api/invoice.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { StatCard } from "../../app/components/common/Card";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { MobileDataCard } from "../../app/components/mobile/MobileDataCard";
import { MobileFilterDrawer } from "../../app/components/mobile/MobileFilterDrawer";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";
import type { Invoice } from "../../features/invoices/invoice.types";

export default function InvoicesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [kind, setKind] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState("ALL");
  const [draftKind, setDraftKind] = useState("ALL");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

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

  const activeFilterCount = [status, kind, from, to].filter(x => x && x !== "ALL").length;

  const filtersPanel = (
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Invoice Status
        <select 
          aria-label="Invoice status" 
          value={draftStatus} 
          onChange={(e) => setDraftStatus(e.target.value)} 
          className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="ALL">All statuses</option>
          {["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "CANCELLED"].map((x) => (
            <option key={x} value={x}>{x.replaceAll("_", " ")}</option>
          ))}
        </select>
      </label>

      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bill Type
        <select 
          aria-label="Bill type" 
          value={draftKind} 
          onChange={(e) => setDraftKind(e.target.value)} 
          className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="ALL">All bill types</option>
          <option value="GST">GST Invoice</option>
          <option value="NON_GST">Non-GST Bill</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">From Date
          <input 
            type="date" 
            value={draftFrom} 
            onChange={(e) => setDraftFrom(e.target.value)} 
            className="mt-1.5 h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </label>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">To Date
          <input 
            type="date" 
            value={draftTo} 
            onChange={(e) => setDraftTo(e.target.value)} 
            className="mt-1.5 h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </label>
      </div>
    </div>
  );

  const active = data.filter(x => x.status !== "CANCELLED");

  // Calculations for summary tiles
  const unpaidCount = active.filter(x => x.status === "ISSUED").length;
  const partialCount = active.filter(x => x.status === "PARTIALLY_PAID").length;
  const paidCount = active.filter(x => x.status === "PAID").length;
  const amountToReceive = active.reduce((n, x) => n + Number(x.balanceDue), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader 
        title="Invoices" 
        description="Create, view and print customer bills." 
        actions={
          hasPermission(user, "sales:manage") && (
            <button 
              onClick={() => navigate("/invoices/new")} 
              className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={15}/>
              Create Invoice
            </button>
          )
        }
      />

      {/* Summary StatCards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Invoices" value={data.length} helper="All bills created" icon={FileText} />
        <StatCard label="Unpaid Invoices" value={unpaidCount} helper="Payment pending" icon={Clock} className={unpaidCount > 0 ? "border-red-200 bg-red-50/20" : ""} />
        <StatCard label="Partially Paid" value={partialCount} helper="Partial receipts" icon={Clock} className={partialCount > 0 ? "border-amber-200 bg-amber-50/20" : ""} />
        <StatCard label="Paid Bills" value={paidCount} helper="Fully settled bills" icon={CheckCircle} />
        <StatCard label="Outstanding Amount" value={fmt(amountToReceive)} helper="Receivables pending" icon={Landmark} />
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
            <input 
              aria-label="Search invoices" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Invoice, Sale, customer or phone" 
              className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button 
            onClick={() => {
              setDraftStatus(status);
              setDraftKind(kind);
              setDraftFrom(from);
              setDraftTo(to);
              setFilterOpen(true);
            }} 
            className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer shrink-0"
          >
            <Filter size={15}/>
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Filter Panel (>=768px) */}
        <div className="hidden md:grid md:grid-cols-[1fr_180px_170px_150px_150px_auto] gap-3 items-center border-t pt-3">
          <div />
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
      </div>

      {loading ? (
        <LoadingSkeleton rows={4}/>
      ) : error ? (
        <EmptyState title="Could not load invoices" description={error} action={<button onClick={load} className="rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold">Retry</button>} />
      ) : !visible.length ? (
        <EmptyState 
          title="No Invoices Generated" 
          description={data.length ? "Try adjusting filters or search keywords." : "Create your first invoice to track sales."} 
          icon={Receipt} 
          action={
            hasPermission(user, "sales:manage") ? (
              <button 
                onClick={() => navigate("/invoices/new")} 
                className="min-h-10 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                + Create First Invoice
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop Table View (>=768px) */}
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

          {/* Mobile Reusable Card Viewport (<768px) */}
          <div className="space-y-3.5 md:hidden">
            {visible.map((x) => (
              <MobileDataCard
                key={x.id}
                title={x.invoiceNumber}
                subtitle={`${x.customerName} · ${new Date(x.invoiceDate).toLocaleDateString("en-IN")}`}
                badge={
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      x.invoiceType === "GST" 
                        ? "bg-blue-50 text-blue-700 border border-blue-100" 
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {x.invoiceType === "GST" ? "GST" : "Non-GST"}
                    </span>
                    <BusinessStatusBadge status={x.status} />
                  </div>
                }
                onClick={() => navigate(`/invoices/${x.id}`)}
                primaryMetric={{
                  label: "Balance Due",
                  value: (
                    <span className={x.balanceDue > 0 ? "text-red-600 font-black" : "text-green-700 font-black"}>
                      {fmt(x.balanceDue)}
                    </span>
                  ),
                  helper: x.balanceDue > 0 ? "Payment Unpaid / Pending" : "Fully Settled"
                }}
                secondaryMetrics={[
                  { label: "Invoice Amount", value: fmt(x.totalAmount) },
                  { label: "Amount Paid", value: fmt(x.amountPaid) }
                ]}
                metadata={[
                  { label: "Sales Order", value: x.salesOrder?.orderNumber || "—" },
                  { label: "Customer Phone", value: x.customerPhone || "—" }
                ]}
                actions={
                  <>
                    <button
                      onClick={() => navigate(`/invoices/${x.id}`)}
                      className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
                    >
                      View Bill
                    </button>
                    {x.balanceDue > 0 && hasPermission(user, "financials:view") && (
                      <button
                        onClick={() => navigate(`/payments/new?invoiceId=${x.id}`)}
                        className="flex-1 min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white cursor-pointer press-active"
                      >
                        Record Payment
                      </button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        </>
      )}

      {/* Reusable Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Invoices"
        subtitle="Refine invoices by status, GST type & date range"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setDraftStatus("ALL");
          setDraftKind("ALL");
          setDraftFrom("");
          setDraftTo("");
          setStatus("ALL");
          setKind("ALL");
          setFrom("");
          setTo("");
        }}
        onApply={() => {
          setStatus(draftStatus);
          setKind(draftKind);
          setFrom(draftFrom);
          setTo(draftTo);
          setFilterOpen(false);
        }}
      >
        {filtersPanel}
      </MobileFilterDrawer>
    </div>
  );
}

