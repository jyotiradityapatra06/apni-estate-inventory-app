import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Search, ShoppingBag, DollarSign, TrendingUp, Users, FileX2, CheckSquare, Clock } from "lucide-react";
import { purchaseApi } from "../../api/purchase.api";
import { purchaseReturnApi } from "../../api/purchaseReturn.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { PurchaseTable } from "../../features/purchases/PurchaseTable";
import type { PurchaseOrder, PurchaseSummary } from "../../features/purchases/purchase.types";
import { StatCard } from "../../app/components/common/Card";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
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
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
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
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-7 shadow-sm">
        <label className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
          <input 
            aria-label="Search purchases" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Purchase number or supplier" 
            className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </label>
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
          description={data.length ? "Try adjusting filters or search keywords." : "Create purchase orders to manage incoming materials."} 
          icon={ShoppingBag} 
          action={
            hasPermission(user, "purchases:manage") && (
              <button onClick={() => navigate("/purchases/new")} className="min-h-10 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 text-xs font-bold text-white transition-colors cursor-pointer">
                Create Purchase Order
              </button>
            )
          }
        />
      )}
    </div>
  );
}
