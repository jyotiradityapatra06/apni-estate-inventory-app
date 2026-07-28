import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  Boxes, 
  PackageCheck, 
  AlertTriangle, 
  XCircle, 
  IndianRupee, 
  ArrowLeftRight, 
  SlidersHorizontal,
  PackagePlus,
  Warehouse,
  Search,
  Filter
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { PageHeader } from "../../app/components/common/PageHeader";
import { StatCard } from "../../app/components/common/Card";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { QuantityDisplay } from "../../app/components/common/BusinessPrimitives";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { godownApi } from "../../api/godown.api";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";
import type { Godown } from "../../types/godown.types";

const COLORS = ["#ea580c", "#0284c7", "#16a34a", "#8b5cf6", "#e11d48", "#d97706", "#0d9488", "#4f46e5"];

const stockStatus = (item: InventoryItemData) => {
  const qty = Number(item.quantity || 0);
  const reorder = Number(item.reorderLevel || 0);
  if (qty <= 0) return "OUT_OF_STOCK";
  if (qty <= reorder) return "LOW_STOCK";
  return "IN_STOCK";
};

export function StockOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItemData[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      inventoryApi.getItems(),
      godownApi.getAll().catch(() => ({ data: [] })),
    ])
      .then(([invRes, godownRes]) => {
        if (invRes?.data) setItems(invRes.data);
        if (godownRes?.data) setGodowns(godownRes.data.filter((g) => g.isActive));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load inventory."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort(),
    [items]
  );

  // Summary Metrics
  const totalItems = items.length;
  const totalStockValue = items.reduce((acc, item) => acc + (item.quantity * (item.costPrice || 0)), 0);
  const lowStockCount = items.filter((item) => stockStatus(item) === "LOW_STOCK").length;
  const outOfStockCount = items.filter((item) => stockStatus(item) === "OUT_OF_STOCK").length;

  // Chart 1: Category Distribution
  const categoryDistribution = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const cat = item.category || "Uncategorized";
      map.set(cat, (map.get(cat) || 0) + item.quantity);
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total: Math.round(total) }))
      .sort((a, b) => b.total - a.total);
  }, [items]);

  // Chart 2: Stock Value Distribution by Category
  const categoryValueDistribution = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const cat = item.category || "Uncategorized";
      const val = item.quantity * (item.costPrice || 0);
      map.set(cat, (map.get(cat) || 0) + val);
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total: Math.round(total) }))
      .sort((a, b) => b.total - a.total);
  }, [items]);

  // Godown Breakdown
  const godownBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; value: number }>();
    godowns.forEach((g) => map.set(g.id, { name: g.name, quantity: 0, value: 0 }));

    items.forEach((item) => {
      const cost = item.costPrice || 0;
      if (item.godownStocks && item.godownStocks.length > 0) {
        item.godownStocks.forEach((gs) => {
          const gId = gs.godown.id;
          const current = map.get(gId) || { name: gs.godown.name, quantity: 0, value: 0 };
          current.quantity += gs.quantity;
          current.value += gs.quantity * cost;
          map.set(gId, current);
        });
      }
    });
    return Array.from(map.values()).filter((g) => g.quantity > 0 || godowns.length <= 3);
  }, [items, godowns]);

  // Filtered Items Table
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const term = search.trim().toLowerCase();
      if (
        term &&
        !item.materialName.toLowerCase().includes(term) &&
        !item.sku.toLowerCase().includes(term) &&
        !item.category.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      const status = stockStatus(item);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      return true;
    });
  }, [items, search, categoryFilter, statusFilter]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load inventory"
        description={error}
        action={<button onClick={load} className="min-h-11 rounded-xl bg-orange-600 px-5 font-bold text-white">Retry</button>}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Stock Intelligence & Overview" description="Real-time inventory levels, stock valuation, godown distribution, and health alerts." />
        <EmptyState
          title="No inventory materials yet"
          description="Add your first material to start tracking stock, valuation, and warehouse balances."
          icon={Boxes}
          action={hasPermission(user, "inventory:create") ? (
            <button onClick={() => navigate("/materials/new")} className="min-h-11 rounded-xl bg-orange-600 px-5 font-bold text-white">
              Add First Material
            </button>
          ) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header with Quick Actions */}
      <PageHeader
        title="Stock Intelligence & Overview"
        description="Real-time inventory levels, stock valuation, godown distribution, and health alerts."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {hasPermission(user, "inventory:update") && (
              <button
                onClick={() => navigate("/inventory/stock-adjustments")}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer dark:bg-orange-600 dark:hover:bg-orange-500"
              >
                <SlidersHorizontal size={15} />
                Stock Adjustments
              </button>
            )}
            {hasPermission(user, "inventory:create") && (
              <button
                onClick={() => navigate("/materials/new")}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <PackagePlus size={15} />
                Add Material
              </button>
            )}
            {hasPermission(user, "godowns:transfer") && (
              <button
                onClick={() => navigate("/transfers/new")}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground shadow-2xs hover:bg-muted transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeftRight size={15} />
                Stock Transfer
              </button>
            )}
          </div>
        }
      />

      {/* 2. Top KPI Summary Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Catalog Items"
          value={totalItems.toLocaleString("en-IN")}
          icon={Boxes}
        />
        <StatCard
          label="Total Stock Valuation"
          value={fmt(totalStockValue)}
          icon={IndianRupee}
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStockCount.toLocaleString("en-IN")}
          icon={AlertTriangle}
        />
        <StatCard
          label="Out of Stock Items"
          value={outOfStockCount.toLocaleString("en-IN")}
          icon={XCircle}
        />
      </div>

      {/* 3. Recharts Analytics Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Quantity Donut Chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2">
            <Boxes size={16} className="text-orange-500" />
            Stock Quantity Distribution by Category
          </h3>
          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="total"
                  nameKey="name"
                >
                  {categoryDistribution.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [val.toLocaleString("en-IN"), "Quantity"]}
                  contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="font-bold text-muted-foreground dark:text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Value Bar Chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2">
            <IndianRupee size={16} className="text-orange-500" />
            Stock Valuation Breakdown by Category
          </h3>
          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryValueDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [fmt(val), "Valuation"]}
                  contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                />
                <Bar dataKey="total" name="Stock Value" radius={[6, 6, 0, 0]}>
                  {categoryValueDistribution.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Godown-wise Stock Breakdown Cards */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3 dark:border-slate-800">
          <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2">
            <Warehouse size={16} className="text-orange-500" />
            Godown / Warehouse Live Stock Balances
          </h3>
          <Link to="/godowns" className="text-xs font-extrabold text-orange-600 hover:underline dark:text-orange-400">
            View All Warehouses →
          </Link>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {godownBreakdown.map((g) => (
            <div
              key={g.name}
              className="rounded-xl border border-border bg-muted/70 p-4 space-y-1.5 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <span className="text-[11px] font-black uppercase text-muted-foreground block truncate dark:text-muted-foreground">
                {g.name}
              </span>
              <div className="flex items-baseline justify-between">
                <strong className="text-base font-black text-foreground dark:text-slate-100">
                  {g.quantity.toLocaleString("en-IN")} units
                </strong>
                <span className="text-xs font-bold text-muted-foreground dark:text-slate-300">
                  {fmt(g.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Live Stock Level Table & Cards */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 dark:border-slate-800">
          <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100">
            Inventory Stock Balances ({filteredItems.length})
          </h3>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stock..."
                className="h-10 rounded-xl border border-border bg-card pl-9 pr-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden overflow-hidden rounded-xl border border-border md:block dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted text-muted-foreground border-b border-border dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3.5 font-black uppercase">Material Name</th>
                <th className="px-4 py-3.5 font-black uppercase">SKU / Category</th>
                <th className="px-4 py-3.5 font-black uppercase">Available Qty</th>
                <th className="px-4 py-3.5 font-black uppercase">Stock Value</th>
                <th className="px-4 py-3.5 font-black uppercase">Primary Godown</th>
                <th className="px-4 py-3.5 font-black uppercase">Status</th>
                <th className="px-4 py-3.5 font-black uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const status = stockStatus(item);
                const value = item.quantity * (item.costPrice || 0);
                const godownName = item.godownStocks?.[0]?.godown.name || item.location || "Default Warehouse";

                return (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 border-border hover:bg-muted/70 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/materials/${item.id}`}
                        className="font-extrabold text-foreground hover:text-orange-600 transition-colors dark:text-slate-100 dark:hover:text-orange-400"
                      >
                        {item.materialName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground dark:text-muted-foreground font-semibold">
                      <span>{item.sku}</span>
                      <span className="text-[10px] text-muted-foreground block">{item.category}</span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-foreground dark:text-slate-100">
                      <QuantityDisplay value={item.quantity} unit={item.unit} />
                    </td>
                    <td className="px-4 py-3.5 font-bold text-muted-foreground dark:text-slate-300">
                      {fmt(value)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground dark:text-muted-foreground font-semibold">
                      {godownName}
                    </td>
                    <td className="px-4 py-3.5">
                      <BusinessStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold">
                      <Link
                        to={`/materials/${item.id}`}
                        className="text-xs font-extrabold text-orange-600 hover:underline dark:text-orange-400"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Grid View */}
        <div className="grid gap-3.5 md:hidden">
          {filteredItems.map((item) => {
            const status = stockStatus(item);
            const value = item.quantity * (item.costPrice || 0);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/materials/${item.id}`}
                      className="font-extrabold text-sm text-foreground hover:text-orange-600 dark:text-slate-100"
                    >
                      {item.materialName}
                    </Link>
                    <span className="text-xs text-muted-foreground block">{item.sku} • {item.category}</span>
                  </div>
                  <BusinessStatusBadge status={status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block font-bold">Quantity</span>
                    <QuantityDisplay value={item.quantity} unit={item.unit} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block font-bold">Stock Value</span>
                    <strong className="text-foreground dark:text-slate-100">{fmt(value)}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 dark:border-slate-800">
                  <Link
                    to={`/materials/${item.id}`}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-border px-2 text-center text-[11px] font-black text-muted-foreground"
                  >
                    Details
                  </Link>
                  {hasPermission(user, "inventory:update") && (
                    <Link
                      to="/inventory/stock-adjustments"
                      className="flex min-h-11 items-center justify-center rounded-xl bg-orange-600 px-2 text-center text-[11px] font-black text-white"
                    >
                      Adjust
                    </Link>
                  )}
                  {hasPermission(user, "godowns:transfer") && (
                    <Link
                      to={`/transfers/new?materialId=${item.id}`}
                      className="flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-2 text-center text-[11px] font-black text-white"
                    >
                      Transfer
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StockOverviewPage;
