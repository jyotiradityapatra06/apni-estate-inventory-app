import React from "react";
import { useNavigate } from "react-router";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Boxes, PackagePlus, ChevronRight } from "lucide-react";
import type { InventoryItemData } from "../../api/inventory.api";
import { minimumStock, availableStock } from "./dashboardCalculations";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";

interface InventoryHealthChartProps {
  materials: InventoryItemData[];
}

export const InventoryHealthChart: React.FC<InventoryHealthChartProps> = ({ materials = [] }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAddStock = hasPermission(user, "inventory:create");

  const total = materials.length;

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-[#F97316]" />
            <h3 className="font-extrabold text-sm text-slate-900">Inventory Health Breakdown</h3>
          </div>
        </div>

        <div className="py-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316]">
            <Boxes size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">No inventory data yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
              Add your first material to see stock health analytics.
            </p>
          </div>
          {canAddStock && (
            <button
              onClick={() => navigate("/materials/new")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 text-xs font-bold text-white cursor-pointer transition-colors"
            >
              <PackagePlus size={15} />
              <span>Add Material</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const outOfStockCount = materials.filter((m) => m.quantity <= 0).length;
  const lowStockCount = materials.filter((m) => m.quantity > 0 && availableStock(m) <= minimumStock(m)).length;
  const healthyCount = materials.filter((m) => m.quantity > 0 && availableStock(m) > minimumStock(m)).length;

  const healthyPct = Math.round((healthyCount / total) * 100);
  const lowPct = Math.round((lowStockCount / total) * 100);
  const outOfStockPct = Math.round((outOfStockCount / total) * 100);

  const chartData = [
    { name: "Healthy Stock", value: healthyCount, percentage: healthyPct, color: "#16A34A" },
    { name: "Low Stock", value: lowStockCount, percentage: lowPct, color: "#F97316" },
    { name: "Out of Stock", value: outOfStockCount, percentage: outOfStockPct, color: "#DC2626" }
  ].filter(d => d.value > 0);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Boxes size={18} className="text-[#F97316]" />
          <h3 className="font-extrabold text-sm text-slate-900">Inventory Health Breakdown</h3>
        </div>
        <button
          onClick={() => navigate("/materials")}
          className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>View Stock</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-12 items-center">
        {/* Recharts Donut Pie Chart */}
        <div className="sm:col-span-5 h-44 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: "12px", fontSize: "11px", border: "none" }}
                formatter={(val: any, name: any) => [`${val} items (${Math.round((Number(val) / total) * 100)}%)`, name]}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={68}
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xl font-black text-slate-900 leading-none">{total}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Total Items</span>
          </div>
        </div>

        {/* Legend / Metrics Grid */}
        <div className="sm:col-span-7 space-y-2">
          {/* Healthy Stock */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-green-50/60 border border-green-100/80">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Healthy Stock</p>
                <p className="text-[10px] text-slate-500 font-semibold">{healthyCount} items</p>
              </div>
            </div>
            <span className="text-sm font-black text-green-700">{healthyPct}%</span>
          </div>

          {/* Low Stock */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/60 border border-orange-100/80">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#F97316] shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Low Stock</p>
                <p className="text-[10px] text-slate-500 font-semibold">{lowStockCount} items</p>
              </div>
            </div>
            <span className="text-sm font-black text-[#F97316]">{lowPct}%</span>
          </div>

          {/* Out of Stock */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/60 border border-red-100/80">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Out of Stock</p>
                <p className="text-[10px] text-slate-500 font-semibold">{outOfStockCount} items</p>
              </div>
            </div>
            <span className="text-sm font-black text-red-600">{outOfStockPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
