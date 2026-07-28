import React from "react";
import { IndianRupee, FileCheck, Landmark } from "lucide-react";
import { fmt } from "../../utils/currency";
import type { DashboardData } from "./dashboard.types";
import type { Invoice } from "../invoices/invoice.types";

interface TodaysBillingCardsProps {
  dashboard: DashboardData;
}

export const TodaysBillingCards: React.FC<TodaysBillingCardsProps> = ({ dashboard }) => {
  const invoices: Invoice[] = dashboard.invoices.data || [];
  const loading = dashboard.invoices.loading;

  // Filter out DRAFT and CANCELLED invoices
  const validInvoices = invoices.filter(
    (inv) => inv.status !== "DRAFT" && inv.status !== "CANCELLED"
  );

  const isToday = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const todaysInvoices = validInvoices.filter((inv) => isToday(inv.invoiceDate || inv.createdAt));
  const todaysSalesAmount = todaysInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const todaysInvoiceCount = todaysInvoices.length;
  const pendingCollections = validInvoices.reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

  if (loading) {
    return (
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Today's Billing
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Today's Billing
        </h3>
        <span className="text-[11px] font-semibold text-muted-foreground">
          Live Daily Performance
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Today's Sales Amount */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-orange-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today's Sales Amount
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <IndianRupee size={20} />
            </span>
          </div>
          <strong className="mt-3 block text-2xl sm:text-3xl font-black text-foreground">
            {fmt(todaysSalesAmount)}
          </strong>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            From {todaysInvoiceCount} valid invoice{todaysInvoiceCount === 1 ? "" : "s"} today
          </p>
        </div>

        {/* Today's Invoice Count */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Invoices Created Today
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <FileCheck size={20} />
            </span>
          </div>
          <strong className="mt-3 block text-2xl sm:text-3xl font-black text-foreground">
            {todaysInvoiceCount}
          </strong>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Issued & processed bills
          </p>
        </div>

        {/* Pending Customer Collections */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pending Customer Collections
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Landmark size={20} />
            </span>
          </div>
          <strong className="mt-3 block text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {fmt(pendingCollections)}
          </strong>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Total receivables outstanding
          </p>
        </div>
      </div>
    </section>
  );
};

export default TodaysBillingCards;
