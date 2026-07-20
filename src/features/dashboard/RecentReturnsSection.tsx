import { useNavigate } from "react-router";
import { format } from "date-fns";
import { CurrencyDisplay } from "../../app/components/common/BusinessPrimitives";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import type { DashboardData } from "./dashboard.types";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export function RecentReturnsSection({ dashboard }: { dashboard: DashboardData }) {
  const navigate = useNavigate();
  if (!dashboard.canViewSalesReturns && !dashboard.canViewPurchaseReturns) return null;

  const sales = dashboard.salesReturns.data.map((r) => ({
    ...r,
    type: "Sales Return",
    icon: ArrowDownToLine,
    iconColor: "text-pink-600 bg-pink-50",
    path: `/sales-returns/${r.id}`,
  }));
  const purchases = dashboard.purchaseReturns.data.map((r) => ({
    ...r,
    type: "Purchase Return",
    icon: ArrowUpFromLine,
    iconColor: "text-rose-600 bg-rose-50",
    path: `/purchase-returns/${r.id}`,
  }));

  const combined = [...sales, ...purchases]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const loading = dashboard.salesReturns.loading || dashboard.purchaseReturns.loading;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Returns</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-100 rounded"></div>
          <div className="h-8 bg-slate-100 rounded"></div>
          <div className="h-8 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (combined.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Recent Returns</h3>
        <p className="text-sm text-slate-500">No returns recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Recent Returns</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[12px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th className="px-6 py-3">Return Info</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Reason</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {combined.map((item) => {
              const Icon = item.icon;
              return (
                <tr
                  key={`${item.type}-${item.id}`}
                  onClick={() => navigate(item.path)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{item.returnNumber}</div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(item.returnDate), "dd MMM yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${item.iconColor}`}>
                        <Icon size={14} />
                      </span>
                      <span className="font-medium text-slate-700">{item.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 line-clamp-1 max-w-[200px]" title={item.reason}>
                    {item.reason}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <CurrencyDisplay value={item.totalAmount} />
                  </td>
                  <td className="px-6 py-4">
                    <BusinessStatusBadge status={item.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
