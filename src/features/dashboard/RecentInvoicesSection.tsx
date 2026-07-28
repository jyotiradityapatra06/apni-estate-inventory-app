import React from "react";
import { Link, useNavigate } from "react-router";
import { FileText, ArrowUpRight, PlusCircle } from "lucide-react";
import { fmt } from "../../utils/currency";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import type { DashboardData } from "./dashboard.types";
import type { Invoice } from "../invoices/invoice.types";

interface RecentInvoicesSectionProps {
  dashboard: DashboardData;
}

export const RecentInvoicesSection: React.FC<RecentInvoicesSectionProps> = ({ dashboard }) => {
  const navigate = useNavigate();
  const invoices: Invoice[] = dashboard.invoices.data || [];
  const loading = dashboard.invoices.loading;

  // Take top 5 recent invoices sorted by date
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt || b.invoiceDate).getTime() - new Date(a.createdAt || a.invoiceDate).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-orange-600" />
          <h3 className="font-extrabold text-base text-foreground">Recent Invoices</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/invoices/new")}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            <PlusCircle size={14} />
            New Invoice
          </button>
          <Link
            to="/invoices"
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            View All Invoices
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : recentInvoices.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">No invoices generated yet</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
              Create your first customer invoice or bill to see transaction records here.
            </p>
          </div>
          <button
            onClick={() => navigate("/invoices/new")}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-orange-600 px-4 text-xs font-black text-white hover:bg-orange-700 cursor-pointer"
          >
            <PlusCircle size={14} /> Create First Invoice
          </button>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {recentInvoices.map((invoice) => {
            const invoiceDateFormatted = new Date(
              invoice.invoiceDate || invoice.createdAt
            ).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={invoice.id}
                onClick={() => navigate(`/invoices/${invoice.id}`)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-2 -mx-2 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer gap-2"
              >
                {/* Left: Invoice Number & Customer */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground font-black text-xs group-hover:bg-orange-100 group-hover:text-orange-700 dark:group-hover:bg-orange-950 dark:group-hover:text-orange-400 transition-colors">
                    {invoice.invoiceType === "GST" ? "GST" : "BILL"}
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-sm text-foreground group-hover:text-orange-600 transition-colors block truncate">
                      {invoice.invoiceNumber}
                    </span>
                    <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                      {invoice.customerName || "Customer Account"}
                    </p>
                  </div>
                </div>

                {/* Right: Date, Amount & Status */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-1 sm:pt-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    {invoiceDateFormatted}
                  </span>
                  <div className="text-right">
                    <strong className="block text-sm font-black text-foreground">
                      {fmt(invoice.totalAmount)}
                    </strong>
                    <div className="mt-0.5 flex justify-end">
                      <BusinessStatusBadge status={invoice.status} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentInvoicesSection;
