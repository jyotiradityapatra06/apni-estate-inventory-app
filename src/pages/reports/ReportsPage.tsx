import { BarChart3, Boxes, IndianRupee, Landmark, ReceiptIndianRupee, ShoppingCart, WalletCards } from "lucide-react";
import { Link } from "react-router";
import { PageHeader } from "../../app/components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";

const groups = [
  {
    name: "Sales & Purchase",
    items: [
      ["Sales Report", "/reports/sales", ShoppingCart, "Issued invoice performance"],
      ["Purchase Report", "/reports/purchases", ReceiptIndianRupee, "Ordered and received purchases"]
    ]
  },
  {
    name: "Inventory",
    items: [
      ["Inventory Report", "/reports/inventory", Boxes, "Stock and movement reconciliation"],
      ["Stock Valuation", "/reports/stock-valuation", IndianRupee, "Current stock value", true]
    ]
  },
  {
    name: "Payments & Outstanding",
    items: [
      ["Customer Outstanding", "/reports/customer-outstanding", Landmark, "Money to receive", true],
      ["Supplier Outstanding", "/reports/supplier-outstanding", Landmark, "Money to pay", true]
    ]
  },
  {
    name: "Expenses & Tax",
    items: [
      ["Expense Report", "/reports/expenses", WalletCards, "Expense totals and categories"],
      ["GST Summary", "/reports/gst", ReceiptIndianRupee, "Operational GST estimate", true]
    ]
  },
  {
    name: "Business Summary",
    items: [
      ["Profit & Loss", "/reports/profit-loss", BarChart3, "Estimated operating profit", true],
      ["Business Overview", "/reports/overview", BarChart3, "Key business indicators", true]
    ]
  }
] as const;

export default function ReportsPage() {
  const { user } = useAuth();
  const financial = hasPermission(user, "reports:financial");

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Reports" description="Simple business summaries for sales, stock, expenses, tax and balances." />
      
      {groups.map((g) => {
        const items = g.items.filter((x) => !x[4] || financial);
        if (!items.length) return null;
        return (
          <section key={g.name} className="space-y-3">
            <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider">{g.name}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(([title, path, Icon, text]) => (
                <Link 
                  key={path} 
                  to={path} 
                  className="min-h-[110px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-orange-500 hover:shadow-md block space-y-2"
                >
                  <Icon className="text-orange-600 shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
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
