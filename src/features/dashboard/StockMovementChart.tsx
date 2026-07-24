import React from "react";
import { useNavigate } from "react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, PackagePlus, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";

interface StockMovementChartProps {
  movements: any[];
}

export const StockMovementChart: React.FC<StockMovementChartProps> = ({ movements = [] }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAddStock = hasPermission(user, "inventory:create");

  // Aggregate stock movements by date label
  const movementMap: Record<string, { label: string; stockIn: number; stockOut: number }> = {};

  let totalStockIn = 0;
  let totalStockOut = 0;

  if (movements && movements.length > 0) {
    movements.slice(0, 30).forEach((tx: any) => {
      const rawDate = tx.createdAt || tx.date;
      if (!rawDate) return;

      const date = new Date(rawDate);
      const key = date.toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
      if (!movementMap[key]) {
        movementMap[key] = { label: key, stockIn: 0, stockOut: 0 };
      }

      const qty = Math.abs(Number(tx.quantity || 0));
      const typeUpper = String(tx.type || "").toUpperCase();

      const isIncoming = typeUpper === "IN" || typeUpper.includes("IN") || typeUpper === "PURCHASE" || typeUpper === "RECEIPT";
      const isOutgoing = typeUpper === "OUT" || typeUpper.includes("OUT") || typeUpper === "SALE" || typeUpper === "DISPATCH";

      if (isIncoming) {
        movementMap[key].stockIn += qty;
        totalStockIn += qty;
      } else if (isOutgoing) {
        movementMap[key].stockOut += qty;
        totalStockOut += qty;
      } else {
        // Default fallback if type is positive / negative
        if (Number(tx.quantity) > 0) {
          movementMap[key].stockIn += qty;
          totalStockIn += qty;
        } else {
          movementMap[key].stockOut += qty;
          totalStockOut += qty;
        }
      }
    });
  }

  const chartData = Object.values(movementMap).reverse();

  if (!movements || movements.length === 0 || chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#F97316]" />
            <h3 className="font-extrabold text-sm text-slate-900">Stock Movement Trend</h3>
          </div>
        </div>

        <div className="py-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316]">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">No stock movement yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
              Stock in and stock out activity will appear here after your first inventory transaction.
            </p>
          </div>
          {canAddStock && (
            <button
              onClick={() => navigate("/materials")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 text-xs font-bold text-white cursor-pointer transition-colors"
            >
              <PackagePlus size={15} />
              <span>Add Stock</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#F97316]" />
          <h3 className="font-extrabold text-sm text-slate-900">Stock Movement Trend</h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">
            <ArrowDownLeft size={13} />
            <span>In: {totalStockIn}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
            <ArrowUpRight size={13} />
            <span>Out: {totalStockOut}</span>
          </div>
        </div>
      </div>

      <div className="w-full min-h-[220px] h-56 pt-1">
        <ResponsiveContainer width="100%" height={220} minHeight={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: "12px", fontSize: "11px", border: "none" }}
              formatter={(val: any, name: any) => [`${val} units`, name === "stockIn" ? "Stock In (Received)" : "Stock Out (Dispatched)"]}
            />
            <Legend
              wrapperStyle={{ paddingTop: "8px", fontSize: "11px", fontWeight: 700 }}
              formatter={(value) => (value === "stockIn" ? "Stock In (Received)" : "Stock Out (Dispatched)")}
            />
            <Bar dataKey="stockIn" name="stockIn" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="stockOut" name="stockOut" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
