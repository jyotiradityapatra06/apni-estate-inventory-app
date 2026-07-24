import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Search, ShoppingBag, DollarSign, TrendingUp, Users, FileX2, CheckSquare, Clock, Filter } from "lucide-react";
import { purchaseApi } from "../../api/purchase.api";
import { purchaseReturnApi } from "../../api/purchaseReturn.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { PurchaseTable } from "../../features/purchases/PurchaseTable";
import type { PurchaseOrder, PurchaseSummary } from "../../features/purchases/purchase.types";
import { StatCard } from "../../app/components/common/Card";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { MobileFilterDrawer } from "../../app/components/mobile/MobileFilterDrawer";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [summary, setSummary] = useState<PurchaseSummary>({ totalPurchases: 0, pendingPayments: 0, thisMonthPurchase: 0, totalSuppliers: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [payment, setPayment] = useState("ALL");
  const [supplier, setSupplier] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState("ALL");
  const [draftPayment, setDraftPayment] = useState("ALL");
  const [draftSupplier, setDraftSupplier] = useState("ALL");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      purchaseApi.list(),
      purchaseReturnApi.list().catch(() => ({ data: [] }))
    ])
      .then(([purchaseRes, returnsRes]) => {
        setData(purchaseRes.data || []);
        setSummary(purchaseRes.summary);
        setReturns(returnsRes.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const visible = useMemo(() => {
    return data.filter((x) => {
      const q = search.toLowerCase();
      const d = x.orderDate.slice(0, 10);
      return (
        (!q || [x.purchaseOrderNumber, x.supplierName, x.supplierPhone].some((v) => v.toLowerCase().includes(q))) &&
        (status === "ALL" || x.status === status) &&
        (payment === "ALL" || x.paymentStatus === payment) &&
        (supplier === "ALL" || x.supplierId === supplier) &&
        (!from || d >= from) &&
        (!to || d <= to)
      );
    });
  }, [data, search, status, payment, supplier, from, to]);

  const activeCount = [status, payment, supplier, from, to].filter(x => x && x !== "ALL").length;

  const filtersPanel = (
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Order Status
        <select 
          aria-label="Purchase status" 
          value={draftStatus} 
          onChange={(e) => setDraftStatus(e.target.value)} 
          className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="ALL">All statuses</option>
          {["DRAFT", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"].map((x) => (
            <option key={x} value={x}>{x.replaceAll("_", " ")}</option>
          ))}
        </select>
      </label>

      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Payment Status
        <select 
          aria-label="Payment status" 
          value={draftPayment} 
          onChange={(e) => setDraftPayment(e.target.value)} 
          className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="ALL">All payments</option>
          {["UNPAID", "PARTIAL", "PAID"].map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
      </label>

      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Supplier
        <select 
          aria-label="Supplier filter" 
          value={draftSupplier} 
          onChange={(e) => setDraftSupplier(e.target.value)} 
          className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="ALL">All suppliers</option>
          {Array.from(new Map(data.map((x) => [x.supplierId, x.supplierName])).entries()).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
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
  const totalPurchasesVal = summary.totalPurchases;
  const pendingOrdersCount = data.filter((x) => ["DRAFT", "SENT", "PARTIALLY_RECEIVED"].includes(x.status)).length;
  const receivedStockCount = data.filter((x) => x.status === "RECEIVED").length;
  const supplierPayablesVal = summary.pendingPayments;
  const totalReturnsCount = returns.length;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <PageHeader 
        title="Purchase Management" 
        description="Manage suppliers, purchase orders, goods receipt, and supplier payments" 
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {hasPermission(user, "purchases:manage") && (
              <button 
                onClick={() => navigate("/purchases/new")} 
                className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={15}/>
                Create Purchase Order
              </button>
            )}
            {hasPermission(user, "suppliers:create") && (
              <button 
                onClick={() => navigate("/suppliers/new")} 
                className="flex min-h-10 items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={15}/>
                Add Supplier
              </button>
            )}
          </div>
        }
      />

      {/* 2. Purchase Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Purchases" value={fmt(totalPurchasesVal)} helper="Material order volume" icon={ShoppingBag} />
        <StatCard label="Pending Orders" value={pendingOrdersCount} helper="Awaiting stock receiving" icon={Clock} className={pendingOrdersCount > 0 ? "border-amber-200 bg-amber-50/20" : ""} />
        <StatCard label="Received Stock" value={receivedStockCount} helper="Fully stock-received orders" icon={CheckSquare} />
        <StatCard label="Supplier Payables" value={fmt(supplierPayablesVal)} helper="Outstanding balances due" icon={DollarSign} className={supplierPayablesVal > 0 ? "border-red-200 bg-red-50/20" : ""} />
        <StatCard label="Purchase Returns" value={totalReturnsCount} helper="Returned PO logs" icon={FileX2} />
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
            <input 
              aria-label="Search purchases" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Purchase number or supplier" 
              className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button 
            onClick={() => {
              setDraftStatus(status);
              setDraftPayment(payment);
              setDraftSupplier(supplier);
              setDraftFrom(from);
              setDraftTo(to);
              setFilterOpen(true);
            }} 
            className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer shrink-0"
          >
            <Filter size={15}/>
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Filters Bar */}
        <div className="hidden md:grid md:grid-cols-6 gap-3 items-center border-t pt-3">
          <select 
            aria-label="Purchase status" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All statuses</option>
            {["DRAFT", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"].map((x) => (
              <option key={x} value={x}>{x.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select 
            aria-label="Payment status" 
            value={payment} 
            onChange={(e) => setPayment(e.target.value)} 
            className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All payments</option>
            {["UNPAID", "PARTIAL", "PAID"].map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
          <select 
            aria-label="Supplier filter" 
            value={supplier} 
            onChange={(e) => setSupplier(e.target.value)} 
            className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All suppliers</option>
            {Array.from(new Map(data.map((x) => [x.supplierId, x.supplierName])).entries()).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
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
          {activeCount > 0 && (
            <button 
              onClick={() => {
                setStatus("ALL");
                setPayment("ALL");
                setSupplier("ALL");
                setFrom("");
                setTo("");
              }} 
              className="h-10 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4}/>
      ) : error ? (
        <EmptyState title="Could not load purchases" description={error} action={<button onClick={load} className="rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold">Retry</button>} />
      ) : visible.length ? (
        <PurchaseTable data={visible}/>
      ) : (
        <EmptyState 
          title="No Purchase Orders" 
          description={data.length ? "Try adjusting filters or search keywords." : "Create your first purchase order to manage incoming materials."} 
          icon={ShoppingBag} 
          action={
            hasPermission(user, "purchases:manage") && (
              <button onClick={() => navigate("/purchases/new")} className="min-h-10 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 text-xs font-bold text-white transition-colors cursor-pointer">
                Create First Purchase Order
              </button>
            )
          }
        />
      )}

      {/* Reusable Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Purchase Orders"
        subtitle="Refine purchase orders by status, payment & date range"
        activeFilterCount={activeCount}
        onReset={() => {
          setDraftStatus("ALL");
          setDraftPayment("ALL");
          setDraftSupplier("ALL");
          setDraftFrom("");
          setDraftTo("");
          setStatus("ALL");
          setPayment("ALL");
          setSupplier("ALL");
          setFrom("");
          setTo("");
        }}
        onApply={() => {
          setStatus(draftStatus);
          setPayment(draftPayment);
          setSupplier(draftSupplier);
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

