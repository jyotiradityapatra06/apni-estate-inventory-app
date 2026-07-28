import React from "react";
import { IndianRupee, FileCheck, Landmark, DollarSign } from "lucide-react";
import { fmt } from "../../utils/currency";
import type { DashboardData } from "./dashboard.types";
import type { Invoice } from "../invoices/invoice.types";

interface TodaysBillingCardsProps {
  dashboard: DashboardData;
}

export const TodaysBillingCards: React.FC<TodaysBillingCardsProps> = ({ dashboard }) => {
  const invoices: Invoice[] = dashboard.invoices.data || [];
  const payments: any[] = dashboard.payments?.data || [];
  const loading = dashboard.invoices.loading || dashboard.payments?.loading;

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

  // Calculate Today's Collections
  const postedPayments = payments.filter((p) => p.status === "POSTED");
  const todaysPayments = postedPayments.filter((p) => isToday(p.paymentDate || p.createdAt));
  const todaysCollectionsAmount = todaysPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Pending Receivables
  const pendingCollections = validInvoices.reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

  if (loading) {
    return (
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Today's Billing & Collections
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          Today's Billing & Collections
        </h3>
        <span className="text-[11px] font-semibold text-muted-foreground">
          Live Financial Performance
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Today's Sales Amount */}
        <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-xs hover:border-orange-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today's Sales Amount
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <IndianRupee size={18} />
            </span>
          </div>
          <strong className="mt-2 block text-xl sm:mt-3 sm:text-3xl font-black text-foreground">
            {fmt(todaysSalesAmount)}
          </strong>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            From {todaysInvoiceCount} valid bill{todaysInvoiceCount === 1 ? "" : "s"} today
          </p>
        </div>

        {/* Invoices Created Today */}
        <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Invoices Created Today
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <FileCheck size={20} />
            </span>
          </div>
          <strong className="mt-2 block text-xl sm:mt-3 sm:text-3xl font-black text-foreground">
            {todaysInvoiceCount}
          </strong>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Issued & processed bills
          </p>
        </div>

        {/* Today's Collections */}
        <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-xs hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today's Collections
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign size={20} />
            </span>
          </div>
          <strong className="mt-2 block text-xl sm:mt-3 sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
            {fmt(todaysCollectionsAmount)}
          </strong>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {todaysPayments.length} payment receipt{todaysPayments.length === 1 ? "" : "s"} today
          </p>
        </div>

        {/* Pending Receivables */}
        <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-xs hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pending Receivables
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Landmark size={20} />
            </span>
          </div>
          <strong className="mt-2 block text-xl sm:mt-3 sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {fmt(pendingCollections)}
          </strong>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Total customer outstanding
          </p>
        </div>
      </div>
    </section>
  );
};

export default TodaysBillingCards;
