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
import { QuickBillingCTA } from "./QuickBillingCTA";
import { TodaysBillingCards } from "./TodaysBillingCards";
import { RecentInvoicesSection } from "./RecentInvoicesSection";
import { InventoryHealthChart } from "./InventoryHealthChart";
import { StockMovementChart } from "./StockMovementChart";
import { MaterialAvailabilityChart } from "./MaterialAvailabilityChart";
import { InventoryValueTrendChart } from "./InventoryValueTrendChart";

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
  const [showAnalytics, setShowAnalytics] = useState(false);

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const isLoading = dashboard.inventory.loading || dashboard.invoices.loading || dashboard.purchases.loading;

  if (isLoading) {
    return (
      <div className="space-y-5 md:hidden pb-16">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-900" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        </div>
        <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:hidden pb-20">
      {/* 1. Mobile Business Identity Header */}
      <div className="flex items-center justify-between rounded-2xl bg-[#0F172A] p-4 text-white shadow-md">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
            {greeting}
          </p>
          <h2 className="text-lg font-black tracking-tight truncate text-white mt-0.5">
            {business?.name || "APNI ESTATE Material Store"}
          </h2>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            Logged in as <span className="text-white font-bold">{user?.name || "Owner"}</span> ({user?.role})
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh dashboard"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-transform"
        >
          <RefreshCw size={18} className={refreshing || dashboard.inventory.loading ? "animate-spin text-orange-400" : ""} />
        </button>
      </div>

      {/* 2. Today's Business Summary */}
      <TodaysBillingCards dashboard={dashboard} />

      {/* 3. Primary Quick Billing & Supplier Actions */}
      <QuickBillingCTA />

      <div className="space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground px-1">
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
                <span className="text-xs font-extrabold text-foreground block leading-tight">+ New Sale</span>
                <span className="text-[10px] font-semibold text-muted-foreground block">Create Invoice</span>
              </div>
            </button>
          )}

          {canAddStock && (
            <button
              onClick={() => navigate("/materials/new")}
              className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 text-left press-active cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <PackagePlus size={18} />
              </span>
              <div>
                <span className="text-xs font-extrabold text-foreground block leading-tight">+ Add Material</span>
                <span className="text-[10px] font-semibold text-muted-foreground block">Add to Stock</span>
              </div>
            </button>
          )}

          {canCreatePurchase && (
            <button
              onClick={() => navigate("/purchases/new")}
              className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 text-left press-active cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <ShoppingBag size={18} />
              </span>
              <div>
                <span className="text-xs font-extrabold text-foreground block leading-tight">+ Create Purchase</span>
                <span className="text-[10px] font-semibold text-muted-foreground block">Order Vendor PO</span>
              </div>
            </button>
          )}

          {canReceivePayment && (
            <button
              onClick={() => navigate("/payments/new")}
              className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 text-left press-active cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 border border-green-100">
                <DollarSign size={18} />
              </span>
              <div>
                <span className="text-xs font-extrabold text-foreground block leading-tight">+ Receive Payment</span>
                <span className="text-[10px] font-semibold text-muted-foreground block">Log Cash / UPI</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 4. Financial Health & Pending Dues */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Financial Health & Outstanding
          </h3>
        </div>

        <div className="grid gap-3">
          {/* Sales Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Total Sales</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#F97316]">
                <IndianRupee size={16} />
              </span>
            </div>
            <strong className="text-2xl font-black text-foreground block leading-none">
              {totalSales > 0 ? fmt(totalSales) : "₹0"}
            </strong>
            <p className="text-xs text-muted-foreground font-semibold truncate mt-1">
              {totalSales > 0 ? `${invoices.length} Sales Invoices` : "No sales logged yet"}
            </p>
          </div>

          {/* Receivables Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Customer Dues (Receivables)</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Landmark size={16} />
              </span>
            </div>
            <strong className={`text-2xl font-black block leading-none ${totalReceivables > 0 ? "text-orange-600" : "text-foreground"}`}>
              {fmt(totalReceivables)}
            </strong>
            <p className="text-xs text-muted-foreground font-semibold truncate mt-1">Pending customer dues</p>
          </div>

          {/* Payables Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Supplier Dues (Payables)</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Landmark size={16} />
              </span>
            </div>
            <strong className={`text-2xl font-black block leading-none ${totalPayables > 0 ? "text-red-600" : "text-foreground"}`}>
              {fmt(totalPayables)}
            </strong>
            <p className="text-xs text-muted-foreground font-semibold truncate mt-1">Due to suppliers</p>
          </div>
        </div>
      </div>

      {/* 5. Recent Invoices / Bills */}
      <RecentInvoicesSection dashboard={dashboard} />

      {/* 6. Collapsible Analytics & Trends Accordion */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setShowAnalytics((prev) => !prev)}
          className="flex w-full items-center justify-between text-xs font-black uppercase tracking-wider text-muted-foreground cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#F97316]" />
            <span>Analytics & Business Trends</span>
          </div>
          <ChevronRight
            size={16}
            className={`transition-transform duration-200 ${showAnalytics ? "rotate-90 text-[#F97316]" : ""}`}
          />
        </button>

        {showAnalytics && (
          <div className="space-y-4 pt-3 border-t border-border animate-fade-in">
            <InventoryHealthChart materials={materials} />
            <StockMovementChart movements={dashboard.movements.data || []} />
            <MaterialAvailabilityChart materials={materials} />
            <InventoryValueTrendChart materials={materials} movements={dashboard.movements.data || []} />

            {/* Sales & Purchase Trends Chart */}
            <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-extrabold text-xs text-foreground">Sales & Purchase History</span>
              </div>
              {hasChartData ? (
                <div className="w-full min-h-[180px] h-48 pt-2">
                  <ResponsiveContainer width="100%" height={180} minHeight={180}>
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: "12px", fontSize: "11px", border: "none" }}
                        formatter={(val: any) => [fmt(Number(val)), ""]}
                      />
                      <Area type="monotone" dataKey="sales" name="Sales" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                      <Area type="monotone" dataKey="purchases" name="Purchases" stroke="var(--chart-1)" strokeWidth={2} fillOpacity={1} fill="url(#colorPurchases)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-3 text-center">No trend data logged yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSupplierMetrics;
