import React from "react";
import { useNavigate } from "react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Package, PackagePlus, ChevronRight } from "lucide-react";
import type { InventoryItemData } from "../../api/inventory.api";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { hasPermission } from "../../utils/permissions";

interface MaterialAvailabilityChartProps {
  materials: InventoryItemData[];
}

export const MaterialAvailabilityChart: React.FC<MaterialAvailabilityChartProps> = ({ materials = [] }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const canAddStock = hasPermission(user, "inventory:create");

  const validMaterials = materials
    .filter((m) => m.isActive && m.quantity > 0)
    .sort((a, b) => Number(b.quantity) - Number(a.quantity))
    .slice(0, 6);

  if (validMaterials.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 dark:border-slate-800 bg-card dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-[#F97316]" />
            <h3 className="font-extrabold text-sm text-foreground dark:text-white">Top Materials by Availability</h3>
          </div>
        </div>

        <div className="py-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-[#F97316]">
            <Package size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-foreground dark:text-white">No materials available yet</h4>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 max-w-[260px] mx-auto">
              Add materials to visualize your inventory distribution.
            </p>
          </div>
          {canAddStock && (
            <button
              onClick={() => navigate("/materials/new")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0F172A] dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-700 px-4 text-xs font-bold text-white cursor-pointer transition-colors"
            >
              <PackagePlus size={15} />
              <span>Add Material</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const chartData = validMaterials.map((m) => ({
    name: m.materialName.length > 15 ? `${m.materialName.slice(0, 14)}…` : m.materialName,
    fullName: m.materialName,
    quantity: Number(m.quantity || 0),
    unit: m.unit || "units",
    category: m.category || "General"
  }));

  return (
    <div className="rounded-2xl border border-border/80 dark:border-slate-800 bg-card dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-[#F97316]" />
          <h3 className="font-extrabold text-sm text-foreground dark:text-white">Top Materials by Availability</h3>
        </div>
        <button
          onClick={() => navigate("/materials")}
          className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>View All</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="w-full min-h-[220px] h-56 pt-1">
        <ResponsiveContainer width="100%" height={220} minHeight={220}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              width={105}
              tick={{ fontSize: 11, fill: isDark ? "#CBD5E1" : "#0F172A", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#0F172A" : "#0F172A",
                color: "#FFF",
                borderRadius: "12px",
                fontSize: "11px",
                border: isDark ? "1px solid #334155" : "none"
              }}
              formatter={(val: any, _name: any, item: any) => [
                `${val} ${item.payload.unit} (${item.payload.category})`,
                item.payload.fullName
              ]}
            />
            <Bar dataKey="quantity" fill="#F97316" radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
