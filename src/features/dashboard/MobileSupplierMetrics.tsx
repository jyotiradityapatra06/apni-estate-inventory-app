import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  IndianRupee,
  ShoppingBag,
  Landmark,
  Package,
  ShieldAlert,
  AlertTriangle,
  Plus,
  RefreshCw,
  TrendingUp,
  PackagePlus,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  ChevronRight,
  Boxes
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import type { DashboardData } from "./dashboard.types";
import { lowStockItems } from "./dashboardCalculations";
import { fmt } from "../../utils/currency";
import { hasPermission } from "../../utils/permissions";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";

export interface MobileSupplierMetricsProps {
  dashboard: DashboardData;
}

export const MobileSupplierMetrics: React.FC<MobileSupplierMetricsProps> = ({ dashboard }) => {
  const navigate = useNavigate();
  const { user, business } = useAuth();

  const canCreateSale = hasPermission(user, "sales:manage");
  const canAddStock = hasPermission(user, "inventory:create");
  const canCreatePurchase = hasPermission(user, "purchases:manage");
  const canReceivePayment = hasPermission(user, "financials:view");

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dashboard.refresh();
      toast.success("Dashboard updated");
    } catch {
      toast.error("Could not refresh dashboard");
    } finally {
      setRefreshing(false);
    }
  };

  // Calculations derived strictly from real API data
  const materials = dashboard.inventory.data || [];
  const invoices = dashboard.invoices.data || [];
  const purchasesList = dashboard.purchases.data?.data || [];

  const totalMaterials = materials.length;
  const lowStock = lowStockItems(materials);
  const outOfStock = materials.filter((item) => item.quantity <= 0);
  const totalStockValue = materials.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);

  const totalSales = invoices.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const totalReceivables = invoices.reduce((sum, item) => sum + Number(item.balanceDue || 0), 0);
  const moneyReceived = totalSales - totalReceivables;

  const totalPurchases = purchasesList.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const totalPayables = purchasesList.reduce((sum, item) => sum + Number(item.balanceDue || 0), 0);

  // Real data chart series from invoices
  const chartDataMap: Record<string, { month: string; sales: number; purchases: number }> = {};

  invoices.slice(0, 12).forEach((inv: any) => {
    if (!inv.invoiceDate && !inv.createdAt) return;
    const date = new Date(inv.invoiceDate || inv.createdAt);
    const key = date.toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
    if (!chartDataMap[key]) chartDataMap[key] = { month: key, sales: 0, purchases: 0 };
    chartDataMap[key].sales += Number(inv.totalAmount || 0);
  });

  purchasesList.slice(0, 12).forEach((pur: any) => {
    if (!pur.orderDate && !pur.createdAt) return;
    const date = new Date(pur.orderDate || pur.createdAt);
    const key = date.toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
    if (!chartDataMap[key]) chartDataMap[key] = { month: key, sales: 0, purchases: 0 };
    chartDataMap[key].purchases += Number(pur.totalAmount || 0);
  });

  const trendSeries = Object.values(chartDataMap).reverse();
  const hasChartData = trendSeries.length > 0 && (totalSales > 0 || totalPurchases > 0);

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-5 md:hidden pb-12">
      {/* 1. Mobile Business Compact Header */}
      <div className="flex items-center justify-between rounded-2xl bg-[#0F172A] p-4 text-white shadow-md">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
            {greeting}
          </p>
          <h2 className="text-lg font-black tracking-tight truncate text-white mt-0.5">
            {business?.name || "APNI ESTATE Material Store"}
          </h2>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Logged in as <span className="text-white font-bold">{user?.name || "Owner"}</span> ({user?.role})
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh dashboard"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-transform"
        >
          <RefreshCw size={16} className={refreshing || dashboard.inventory.loading ? "animate-spin text-orange-400" : ""} />
        </button>
      </div>

      {/* 2. Business Health Summary (Horizontal Carousel) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Financial Health
          </h3>
          <span className="text-[10px] font-bold text-slate-400">Swipe &rarr;</span>
        </div>

        <div
          className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 scroll-smooth-mobile"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Sales Card */}
          <div className="min-w-[210px] flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sales</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[#F97316]">
                <IndianRupee size={14} />
              </span>
            </div>
            <strong className="text-xl font-black text-slate-900 block leading-none">
              {totalSales > 0 ? fmt(totalSales) : "₹0"}
            </strong>
            <p className="text-[10px] text-slate-400 font-semibold truncate">
              {totalSales > 0 ? `${invoices.length} Sales Invoices` : "No sales logged yet"}
            </p>
          </div>

          {/* Purchases Card */}
          <div className="min-w-[210px] flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Purchases</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <ShoppingBag size={14} />
              </span>
            </div>
            <strong className="text-xl font-black text-slate-900 block leading-none">
              {totalPurchases > 0 ? fmt(totalPurchases) : "₹0"}
            </strong>
            <p className="text-[10px] text-slate-400 font-semibold truncate">
              {totalPurchases > 0 ? `${purchasesList.length} Orders` : "No purchases logged yet"}
            </p>
          </div>

          {/* Receivables Card */}
          <div className="min-w-[210px] flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receivables</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Landmark size={14} />
              </span>
            </div>
            <strong className={`text-xl font-black block leading-none ${totalReceivables > 0 ? "text-orange-600" : "text-slate-900"}`}>
              {fmt(totalReceivables)}
            </strong>
            <p className="text-[10px] text-slate-400 font-semibold truncate">Pending customer dues</p>
          </div>

          {/* Payables Card */}
          <div className="min-w-[210px] flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payables</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Landmark size={14} />
              </span>
            </div>
            <strong className={`text-xl font-black block leading-none ${totalPayables > 0 ? "text-red-600" : "text-slate-900"}`}>
              {fmt(totalPayables)}
            </strong>
            <p className="text-[10px] text-slate-400 font-semibold truncate">Due to suppliers</p>
          </div>

          {/* Stock Value Card */}
          <div className="min-w-[210px] flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Valuation</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Package size={14} />
              </span>
            </div>
            <strong className="text-xl font-black text-slate-900 block leading-none">
              {fmt(totalStockValue)}
            </strong>
            <p className="text-[10px] text-slate-400 font-semibold truncate">Physical store inventory</p>
          </div>
        </div>
      </div>

      {/* 3. Supplier Quick Actions Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Supplier Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {canCreateSale && (
            <button
              onClick={() => navigate("/sales-orders/new")}
              className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-3 text-left press-active cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F97316] text-white shadow-sm">
                <ShoppingCart size={18} />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 block leading-tight">+ New Sale</span>
                <span className="text-[10px] font-semibold text-slate-500 block">Create Invoice</span>
              </div>
            </button>
          )}

          {canAddStock && (
            <button
              onClick={() => navigate("/materials/new")}
              className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 text-left press-active cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <PackagePlus size={18} />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 block leading-tight">+ Add Material</span>
                <span className="text-[10px] font-semibold text-slate-500 block">Add to Stock</span>
              </div>
            </button>
          )}

          {canCreatePurchase && (
            <button
              onClick={() => navigate("/purchases/new")}
              className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 text-left press-active cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <ShoppingBag size={18} />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 block leading-tight">+ Create Purchase</span>
                <span className="text-[10px] font-semibold text-slate-500 block">Order Vendor PO</span>
              </div>
            </button>
          )}

          {canReceivePayment && (
            <button
              onClick={() => navigate("/payments/new")}
              className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 text-left press-active cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 border border-green-100">
                <DollarSign size={18} />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 block leading-tight">+ Receive Payment</span>
                <span className="text-[10px] font-semibold text-slate-500 block">Log Cash / UPI</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 4. Inventory Intelligence Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-[#F97316]" />
            <h3 className="font-extrabold text-sm text-slate-900">Inventory Health</h3>
          </div>
          <Link to="/materials" className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-0.5">
            <span>View All</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {totalMaterials === 0 ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316]">
              <Package size={24} />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900">No stock available</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                Add your first material to start tracking physical store inventory.
              </p>
            </div>
            {canAddStock && (
              <button
                onClick={() => navigate("/materials/new")}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 text-xs font-bold text-white cursor-pointer hover:bg-slate-800"
              >
                <Plus size={14} />
                <span>Add First Material</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Items</span>
                <strong className="text-lg font-black text-slate-900 mt-0.5 block">{totalMaterials}</strong>
              </div>

              <div className={`p-2.5 rounded-xl border ${lowStock.length > 0 ? "bg-amber-50/60 border-amber-200" : "bg-slate-50 border-slate-100"}`}>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Low Stock</span>
                <strong className={`text-lg font-black mt-0.5 block ${lowStock.length > 0 ? "text-amber-600 animate-pulse" : "text-slate-900"}`}>
                  {lowStock.length}
                </strong>
              </div>

              <div className={`p-2.5 rounded-xl border ${outOfStock.length > 0 ? "bg-red-50/60 border-red-200" : "bg-slate-50 border-slate-100"}`}>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Out of Stock</span>
                <strong className={`text-lg font-black mt-0.5 block ${outOfStock.length > 0 ? "text-red-600" : "text-slate-900"}`}>
                  {outOfStock.length}
                </strong>
              </div>
            </div>

            {lowStock.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200/60">
                <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                <p className="text-[11px] leading-tight">
                  <span className="font-bold">{lowStock.length} material(s)</span> are running below safety limits.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Sales & Purchase Trends Chart */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#F97316]" />
            <h3 className="font-extrabold text-sm text-slate-900">Sales & Purchase Trends</h3>
          </div>
        </div>

        {hasChartData ? (
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: "12px", fontSize: "11px", border: "none" }}
                  formatter={(val: any) => [fmt(Number(val)), ""]}
                />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#0F172A" strokeWidth={2} fillOpacity={1} fill="url(#colorPurchases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <p className="font-extrabold text-sm text-slate-900">No trend data yet</p>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
              Create your first sale or purchase order to generate live business analytics graphs.
            </p>
          </div>
        )}
      </div>

      {/* 6. Outstanding Payments & Finance Widget */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-[#F97316]" />
            <h3 className="font-extrabold text-sm text-slate-900">Cash Flow & Payments</h3>
          </div>
          <Link to="/financials/receivables" className="text-xs font-bold text-[#F97316] hover:underline">
            Ledger
          </Link>
        </div>

        {totalSales === 0 && totalPurchases === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="font-extrabold text-sm text-slate-900">No outstanding payments</p>
            <p className="text-xs text-slate-400">All customer & supplier balances are clean and up to date.</p>
          </div>
        ) : (
          <div className="space-y-3 text-xs font-semibold">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Received Cash</span>
                <span className="text-green-700 font-bold">{fmt(moneyReceived)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: `${totalSales ? Math.min(100, (moneyReceived / totalSales) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Customer Dues (Receivables)</span>
                <span className="text-orange-600 font-bold">{fmt(totalReceivables)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F97316] rounded-full"
                  style={{ width: `${totalSales ? Math.min(100, (totalReceivables / totalSales) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Supplier Dues (Payables)</span>
                <span className="text-red-600 font-bold">{fmt(totalPayables)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full"
                  style={{ width: `${totalPurchases ? Math.min(100, (totalPayables / totalPurchases) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSupplierMetrics;
