import { IndianRupee, ShoppingBag, Landmark, Package, ShieldAlert } from "lucide-react";
import { StatCard } from "../../app/components/common/Card";
import type { DashboardData } from "./dashboard.types";
import { lowStockItems } from "./dashboardCalculations";
import { fmt } from "../../utils/currency";

export function DashboardSummaryCards({ dashboard }: { dashboard: DashboardData }) {
  const low = lowStockItems(dashboard.inventory.data);
  
  // Calculate business values
  const totalSales = dashboard.invoices.data.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const totalPurchases = dashboard.purchases.data?.data 
    ? dashboard.purchases.data.data.reduce((sum: number, item: any) => sum + Number(item.totalAmount), 0) 
    : 0;
  const receivables = dashboard.invoices.data.reduce((sum, item) => sum + Number(item.balanceDue), 0);
  const payables = dashboard.purchases.data?.data 
    ? dashboard.purchases.data.data.reduce((sum: number, item: any) => sum + Number(item.balanceDue), 0) 
    : 0;
  const totalStockValue = dashboard.inventory.data.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);

  const loading = dashboard.inventory.loading || dashboard.invoices.loading || dashboard.purchases.loading;

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[110px] animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Total Sales" value={fmt(totalSales)} helper="Total invoiced sales" icon={IndianRupee} />
      <StatCard label="Total Purchases" value={fmt(totalPurchases)} helper="Total material purchases" icon={ShoppingBag} />
      <StatCard label="Receivables" value={fmt(receivables)} helper="Pending from customers" icon={Landmark} />
      <StatCard label="Payables" value={fmt(payables)} helper="Due to suppliers" icon={Landmark} />
      <StatCard label="Stock Value" value={fmt(totalStockValue)} helper="Physical stock valuation" icon={Package} />
      <StatCard label="Low Stock Items" value={low.length} helper="Items needing reorder" icon={ShieldAlert} className={low.length > 0 ? "border-amber-200 bg-amber-50/30" : ""} />
    </div>
  );
}
