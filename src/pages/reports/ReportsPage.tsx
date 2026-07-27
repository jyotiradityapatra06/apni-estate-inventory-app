import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  BarChart3,
  Boxes,
  IndianRupee,
  Landmark,
  ReceiptIndianRupee,
  ShoppingCart,
  WalletCards,
  TrendingUp,
  ShieldCheck,
  Building2,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { reportApi } from "../../api/report.api";
import { PageHeader } from "../../app/components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";

const groups = [
  {
    name: "Sales & Purchases",
    items: [
      ["Sales Analytics", "/reports/sales", ShoppingCart, "Issued invoice sales, GST breakdown & customer collections"],
      ["Purchase Analytics", "/reports/purchases", ReceiptIndianRupee, "Vendor purchase orders, stock GRNs & supplier dues"],
    ],
  },
  {
    name: "Inventory & Warehouses",
    items: [
      ["Inventory Report", "/reports/inventory", Boxes, "Godown stock balance & material movement audit"],
      ["Stock Valuation", "/reports/stock-valuation", IndianRupee, "Total inventory valuation by cost price", true],
    ],
  },
  {
    name: "Payments & Outstanding Balances",
    items: [
      ["Customer Outstanding", "/reports/customer-outstanding", Landmark, "Uncollected customer receivables & ageing", true],
      ["Supplier Outstanding", "/reports/supplier-outstanding", Landmark, "Pending vendor payables & supplier ageing", true],
    ],
  },
  {
    name: "Expenses & GST Compliance Analytics",
    items: [
      ["Expense Analytics", "/reports/expenses", WalletCards, "Operating business expenses & category totals"],
      ["GST Analytics Summary", "/reports/gst", ReceiptIndianRupee, "CGST, SGST & IGST tax breakdown estimate", true],
      ["ITC Tracker (Inward Supply)", "/reports/itc-tracker", ShieldCheck, "Input Tax Credit tracking on purchases & expenses", true],
      ["RCM Analytics", "/reports/rcm", FileCheck, "Reverse Charge Mechanism liability & supplier compliance", true],
      ["TDS / TCS Compliance", "/reports/tds-tcs", Building2, "Tax Deducted at Source & Tax Collected at Source ledger", true],
    ],
  },
  {
    name: "Executive Analytics Summaries",
    items: [
      ["Profit & Loss", "/reports/profit-loss", BarChart3, "Estimated management-level net profit", true],
      ["Business Overview", "/reports/overview", TrendingUp, "Comprehensive executive business performance summary", true],
    ],
  },
] as const;

export default function ReportsPage() {
  const { user } = useAuth();
  const financial = hasPermission(user, "reports:financial");
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    if (financial) {
      reportApi
        .get("overview", "")
        .then((r) => setOverview(r.summary))
        .catch(() => setOverview(null));
    }
  }, [financial]);

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Reports & Business Analytics"
        description="Comprehensive ERP analytics for sales, purchases, inventory stock valuation, GST compliance, ITC tracking, and profit estimates."
      />

      {/* Key Business Insights Summary KPI Grid */}
      {financial && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg md:text-xl lg:text-[22px] font-semibold text-foreground tracking-tight flex items-center gap-2">
                <Sparkles size={20} className="text-orange-500" />
                Key Business Insights Overview
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Real-time financial summary across all business operations.</p>
            </div>
            <Link to="/reports/overview" className="text-xs sm:text-sm font-semibold text-orange-600 hover:underline">
              Full Analytics →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 pt-1">
            <KpiCard
              label="Sales Revenue"
              value={fmt(overview?.sales || 0)}
              color="text-foreground"
              bg="bg-muted/40"
            />
            <KpiCard
              label="Purchases Cost"
              value={fmt(overview?.purchases || 0)}
              color="text-foreground"
              bg="bg-muted/40"
            />
            <KpiCard
              label="Stock Valuation"
              value={fmt(overview?.inventoryValue || 0)}
              color="text-blue-700 dark:text-blue-300"
              bg="bg-blue-50/70 dark:bg-blue-950/40"
            />
            <KpiCard
              label="Customer Receivables"
              value={fmt(overview?.receivables || 0)}
              color="text-amber-800 dark:text-amber-300"
              bg="bg-amber-50/70 dark:bg-amber-950/40"
            />
            <KpiCard
              label="Supplier Payables"
              value={fmt(overview?.payables || 0)}
              color="text-red-700 dark:text-red-300"
              bg="bg-red-50/70 dark:bg-red-950/40"
            />
            <KpiCard
              label="Estimated Net Profit"
              value={fmt(overview?.netProfitEstimate || 0)}
              color="text-emerald-700 dark:text-emerald-300"
              bg="bg-emerald-50/70 dark:bg-emerald-950/40"
              highlight
            />
          </div>
        </section>
      )}

      {groups.map((g) => {
        const items = g.items.filter((x) => !x[4] || financial);
        if (!items.length) return null;
        return (
          <section key={g.name} className="space-y-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground">{g.name}</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(([title, path, Icon, text]) => (
                <Link
                  key={path}
                  to={path}
                  className="min-h-[120px] rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-orange-500 hover:shadow-md block space-y-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <Icon size={20} />
                    </span>
                    <h4 className="font-bold text-foreground text-base group-hover:text-orange-600 transition-colors">{title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function KpiCard({ label, value, color, bg, highlight = false }: { label: string; value: string; color: string; bg: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border border-border/80 p-4 space-y-1.5 ${bg} ${highlight ? "ring-2 ring-emerald-500/30" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground block truncate">{label}</span>
      <strong className={`text-lg sm:text-xl font-bold block truncate ${color}`}>{value}</strong>
    </div>
  );
}

