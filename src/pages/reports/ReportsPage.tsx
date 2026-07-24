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
  ArrowDownLeft,
  ArrowUpRight,
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
      ["Sales Report", "/reports/sales", ShoppingCart, "Issued invoice sales, GST breakdown & customer collections"],
      ["Purchase Report", "/reports/purchases", ReceiptIndianRupee, "Vendor purchase orders, stock GRNs & supplier dues"],
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
    name: "Expenses & GST Compliance",
    items: [
      ["Expense Report", "/reports/expenses", WalletCards, "Operating business expenses & category totals"],
      ["GST Summary", "/reports/gst", ReceiptIndianRupee, "CGST, SGST & IGST tax breakdown estimate", true],
    ],
  },
  {
    name: "Executive Summaries",
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
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Reports & Business Analytics"
        description="Comprehensive reports for sales, purchases, inventory stock valuation, GST compliance, and profit estimates."
      />

      {/* Key Business Insights Summary KPI Grid */}
      {financial && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles size={18} className="text-orange-500" />
                Key Business Insights Overview
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Real-time financial summary across all business operations.</p>
            </div>
            <Link to="/reports/overview" className="text-xs font-extrabold text-orange-600 hover:underline">
              Full Analytics →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6 pt-1">
            <KpiCard
              label="Sales Revenue"
              value={fmt(overview?.totalSales || overview?.sales || 0)}
              color="text-slate-900"
              bg="bg-slate-50"
            />
            <KpiCard
              label="Purchases Cost"
              value={fmt(overview?.totalPurchases || overview?.purchases || 0)}
              color="text-slate-900"
              bg="bg-slate-50"
            />
            <KpiCard
              label="Stock Valuation"
              value={fmt(overview?.stockValuation || overview?.inventoryValue || 0)}
              color="text-blue-700"
              bg="bg-blue-50/70"
            />
            <KpiCard
              label="Customer Receivables"
              value={fmt(overview?.customerReceivables || overview?.receivables || 0)}
              color="text-amber-800"
              bg="bg-amber-50/70"
            />
            <KpiCard
              label="Supplier Payables"
              value={fmt(overview?.supplierPayables || overview?.payables || 0)}
              color="text-red-700"
              bg="bg-red-50/70"
            />
            <KpiCard
              label="Estimated Net Profit"
              value={fmt(overview?.netProfit || overview?.profit || 0)}
              color="text-emerald-700"
              bg="bg-emerald-50/70"
              highlight
            />
          </div>
        </section>
      )}

      {groups.map((g) => {
        const items = g.items.filter((x) => !x[4] || financial);
        if (!items.length) return null;
        return (
          <section key={g.name} className="space-y-3">
            <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-wider">{g.name}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(([title, path, Icon, text]) => (
                <Link
                  key={path}
                  to={path}
                  className="min-h-[110px] rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-orange-500 hover:shadow-md block space-y-2 group cursor-pointer"
                >
                  <Icon className="text-orange-600 shrink-0 transition-transform group-hover:scale-110" size={24} />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">{title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{text}</p>
                  </div>
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
    <div className={`rounded-xl border border-slate-200/80 p-3.5 space-y-1 ${bg} ${highlight ? "ring-2 ring-emerald-500/20" : ""}`}>
      <span className="text-[10px] font-black uppercase text-slate-500 block truncate">{label}</span>
      <strong className={`text-base sm:text-lg font-black block truncate ${color}`}>{value}</strong>
    </div>
  );
}
