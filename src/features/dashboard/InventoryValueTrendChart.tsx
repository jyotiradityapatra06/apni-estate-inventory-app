import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DollarSign, Landmark } from "lucide-react";
import type { InventoryItemData } from "../../api/inventory.api";
import { fmt } from "../../utils/currency";

interface InventoryValueTrendChartProps {
  materials: InventoryItemData[];
  movements: any[];
}

export const InventoryValueTrendChart: React.FC<InventoryValueTrendChartProps> = ({
  materials = [],
  movements = []
}) => {
  const currentValuation = materials.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity || 0)) * Number(item.costPrice || 0),
    0
  );

  if (!materials || materials.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-[#F97316]" />
            <h3 className="font-extrabold text-sm text-slate-900">Inventory Value Trend</h3>
          </div>
        </div>

        <div className="py-8 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316]">
            <Landmark size={24} />
          </div>
          <h4 className="font-extrabold text-sm text-slate-900">Not enough inventory history yet</h4>
          <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
            Continue adding stock transactions to see inventory value trends over time.
          </p>
        </div>
      </div>
    );
  }

  // Create historical valuation series based on stock movements
  const materialMap = new Map(materials.map((m) => [m.id, m]));
  const dateMap: Record<string, number> = {};

  // Group movement net valuation impact by date
  movements.slice(0, 30).forEach((tx) => {
    const rawDate = tx.createdAt || tx.date;
    if (!rawDate) return;

    const date = new Date(rawDate);
    const key = date.toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
    const item = materialMap.get(tx.inventoryItemId);
    const unitPrice = Number(item?.costPrice || item?.sellingPrice || 0);
    const qty = Math.abs(Number(tx.quantity || 0));
    const typeUpper = String(tx.type || "").toUpperCase();

    const isIncoming = typeUpper === "IN" || typeUpper.includes("IN") || typeUpper === "PURCHASE" || typeUpper === "RECEIPT";
    const valueDelta = isIncoming ? qty * unitPrice : -(qty * unitPrice);

    if (!dateMap[key]) dateMap[key] = 0;
    dateMap[key] += valueDelta;
  });

  const dates = Object.keys(dateMap).reverse();

  // If movements are sparse, build a progressive valuation trend ending at currentValuation
  let runningValuation = currentValuation;
  const trendDataReversed: { date: string; value: number }[] = [];

  if (dates.length > 0) {
    for (let i = 0; i < dates.length; i++) {
      const key = dates[i];
      trendDataReversed.push({ date: key, value: Math.max(0, Math.round(runningValuation)) });
      runningValuation -= dateMap[key];
    }
  } else {
    // Single static point if no movements
    trendDataReversed.push({
      date: new Date().toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
      value: Math.round(currentValuation)
    });
  }

  const trendData = trendDataReversed.reverse();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-[#F97316]" />
          <h3 className="font-extrabold text-sm text-slate-900">Inventory Value Trend</h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Stock Value</span>
          <strong className="text-sm font-black text-slate-900">{fmt(currentValuation)}</strong>
        </div>
      </div>

      <div className="h-48 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValuation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F172A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: "12px", fontSize: "11px", border: "none" }}
              formatter={(val: any) => [fmt(Number(val)), "Inventory Value"]}
            />
            <Area type="monotone" dataKey="value" stroke="#0F172A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValuation)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
