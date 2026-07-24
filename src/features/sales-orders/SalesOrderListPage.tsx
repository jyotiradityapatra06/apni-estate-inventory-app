import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Search, ShoppingCart, CheckCircle, Clock, FileText, Landmark, FileCheck, Filter } from "lucide-react";
import salesOrderApi from "../../api/salesOrder.api";
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
import type { SalesOrder } from "./salesOrder.types";

export function SalesOrderListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState("ALL");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      salesOrderApi.getAll(),
      invoiceApi.getAll().catch(() => ({ data: [] }))
    ])
      .then(([ordersRes, invoicesRes]) => {
        setData(ordersRes.data || []);
        setInvoices(invoicesRes.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const visible = useMemo(() => {
    return data.filter((o) => {
      const q = search.toLowerCase();
      const d = o.orderDate.slice(0, 10);
      return (
        (!q || [o.orderNumber, o.customerName, o.customerPhone].some((v) => v?.toLowerCase().includes(q))) &&
        (status === "ALL" || o.status === status) &&
        (!from || d >= from) &&
        (!to || d <= to)
      );
    });
  }, [data, search, status, from, to]);

  const activeFilterCount = [status, from, to].filter(x => x && x !== "ALL").length;

  const filtersPanel = (
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Order Status
        <select 
          aria-label="Order status" 
          value={draftStatus} 
          onChange={(e) => setDraftStatus(e.target.value)} 
          className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="ALL">All statuses</option>
          {["DRAFT", "CONFIRMED", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_DELIVERED", "FULFILLED", "CANCELLED"].map((x) => (
            <option key={x} value={x}>{x.replaceAll("_", " ")}</option>
          ))}
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

  // Calculations for summary tiles
  const totalSalesVal = invoices.reduce((sum, inv) => sum + (inv.status !== "CANCELLED" ? Number(inv.totalAmount) : 0), 0);
  const pendingPaymentsVal = invoices.reduce((sum, inv) => sum + (inv.status !== "CANCELLED" ? Number(inv.balanceDue) : 0), 0);
  const completedOrdersCount = data.filter((o) => ["FULFILLED", "CONFIRMED"].includes(o.status)).length;
  const draftOrdersCount = data.filter((o) => o.status === "DRAFT").length;
  const totalInvoicesCount = invoices.length;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <PageHeader 
        title="Sales Management" 
        description="Manage customers, orders, invoices, and payments" 
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {hasPermission(user, "sales:manage") && (
              <button 
                onClick={() => navigate("/sales-orders/new")} 
                className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={15}/>
                Create Sale
              </button>
            )}
            {hasPermission(user, "sales:manage") && (
              <button 
                onClick={() => navigate("/invoices/new")} 
                className="flex min-h-10 items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={15}/>
                Create Invoice
              </button>
            )}
            {hasPermission(user, "customers:create") && (
              <button 
                onClick={() => navigate("/customers/new")} 
                className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Plus size={14}/>
                Add Customer
              </button>
            )}
          </div>
        }
      />

      {/* 2. Sales Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Sales" value={fmt(totalSalesVal)} helper="Completed invoice billing" icon={ShoppingCart} />
        <StatCard label="Pending Payments" value={fmt(pendingPaymentsVal)} helper="Receivables pending" icon={Landmark} className={pendingPaymentsVal > 0 ? "border-amber-200 bg-amber-50/20" : ""} />
        <StatCard label="Completed Orders" value={completedOrdersCount} helper="Delivered or Confirmed" icon={CheckCircle} />
        <StatCard label="Draft Orders" value={draftOrdersCount} helper="Awaiting confirmation" icon={Clock} />
        <StatCard label="Invoices Generated" value={totalInvoicesCount} helper="Tax and bill invoices" icon={FileCheck} />
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
            <input 
              aria-label="Search sales orders" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Order number, customer or phone" 
              className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button 
            onClick={() => {
              setDraftStatus(status);
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
        <div className="hidden md:grid md:grid-cols-[1fr_190px_160px_160px_auto] gap-3 items-center border-t pt-3">
          <div />
          <select 
            aria-label="Order status" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All statuses</option>
            {["DRAFT", "CONFIRMED", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_DELIVERED", "FULFILLED", "CANCELLED"].map((x) => (
              <option key={x} value={x}>{x.replaceAll("_", " ")}</option>
            ))}
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
          {(search || status !== "ALL" || from || to) && (
            <button 
              onClick={() => { setSearch(""); setStatus("ALL"); setFrom(""); setTo(""); }} 
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
        <EmptyState title="Could not load sales orders" description={error} action={<button onClick={load} className="rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold">Retry</button>} />
      ) : visible.length === 0 ? (
        <EmptyState 
          title="No Sales Orders Yet" 
          description={data.length ? "Try clearing your search or filters." : "Start your first customer order."} 
          icon={ShoppingCart} 
          action={
            hasPermission(user, "sales:manage") && (
              <Link to="/sales-orders/new" className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 text-xs font-bold text-white transition-colors cursor-pointer">
                + Create First Sale
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table View (>=768px) */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  {["Order Number", "Date", "Customer", "Items", "Total", "Status", "Created By"].map((x) => (
                    <th key={x} className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <Link to={`/sales-orders/${o.id}`} className="font-bold text-orange-600 hover:text-orange-700 hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {new Date(o.orderDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block font-bold text-slate-900">{o.customerName}</span>
                      <span className="text-xs text-slate-500">{o.customerPhone}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{o.items.length} items</td>
                    <td className="px-4 py-3.5 font-black text-slate-950">{fmt(o.totalAmount)}</td>
                    <td className="px-4 py-3.5">
                      <BusinessStatusBadge status={o.status}/>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">{o.createdBy?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Reusable Card Viewport (<768px) */}
          <div className="space-y-3.5 md:hidden">
            {visible.map((o) => (
              <MobileDataCard
                key={o.id}
                title={o.orderNumber}
                subtitle={`${o.customerName} · ${new Date(o.orderDate).toLocaleDateString("en-IN")}`}
                badge={<BusinessStatusBadge status={o.status} />}
                onClick={() => navigate(`/sales-orders/${o.id}`)}
                primaryMetric={{
                  label: "Order Total",
                  value: fmt(o.totalAmount),
                  helper: `${o.items.length} material(s) ordered`
                }}
                secondaryMetrics={[
                  { label: "Order Date", value: new Date(o.orderDate).toLocaleDateString("en-IN") },
                  { label: "Created By", value: o.createdBy?.name || "—" }
                ]}
                metadata={[
                  { label: "Customer Phone", value: o.customerPhone || "—" }
                ]}
                actions={
                  <>
                    <button
                      onClick={() => navigate(`/sales-orders/${o.id}`)}
                      className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
                    >
                      View Order
                    </button>
                    {hasPermission(user, "sales:manage") && o.status !== "CANCELLED" && (
                      <button
                        onClick={() => navigate(`/invoices/new?salesOrderId=${o.id}`)}
                        className="flex-1 min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white cursor-pointer press-active"
                      >
                        Generate Invoice
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
        title="Filter Sales Orders"
        subtitle="Refine orders by status & date range"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setDraftStatus("ALL");
          setDraftFrom("");
          setDraftTo("");
          setStatus("ALL");
          setFrom("");
          setTo("");
        }}
        onApply={() => {
          setStatus(draftStatus);
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

export default SalesOrderListPage;

