import { useEffect, useMemo, useState } from "react";
import { Filter, MoreVertical, Package, PackagePlus, Search, Warehouse, X, ArrowLeftRight, Landmark, ShieldAlert, AlertTriangle, Boxes } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { godownApi } from "../../api/godown.api";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { QuantityDisplay } from "../../app/components/common/BusinessPrimitives";
import { EmptyState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { PageHeader } from "../../app/components/common/PageHeader";
import { StatCard } from "../../app/components/common/Card";
import { MobileDataCard } from "../../app/components/mobile/MobileDataCard";
import { MobileFilterDrawer } from "../../app/components/mobile/MobileFilterDrawer";
import { useAuth } from "../../hooks/useAuth";
import type { Godown } from "../../types/godown.types";
import { hasPermission } from "../../utils/permissions";
import { StockMovementDialog } from "./StockMovementDialog";
import { availableStock, physicalStock, reservedStock, stockStatus, minimumStock } from "./stockCalculations";
import { useMaterials } from "./useMaterials";
import { fmt } from "../../utils/currency";

type FilterState = { category: string; godown: string; status: string };
const initialFilters: FilterState = { category: "ALL", godown: "ALL", status: "ALL" };

export function StockListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const materials = useMaterials();
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [draft, setDraft] = useState(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [movement, setMovement] = useState<{ type: "IN" | "OUT"; material: InventoryItemData | null } | null>(null);

  const canCreate = hasPermission(user, "inventory:create");
  const canUpdate = hasPermission(user, "inventory:update");
  const canDelete = hasPermission(user, "inventory:delete");
  const canIn = hasPermission(user, "stock:in");
  const canOut = hasPermission(user, "stock:out");

  useEffect(() => {
    godownApi.getAll()
      .then((response) => setGodowns(response.data.filter((item) => item.isActive)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const action = params.get("action");
    if ((action === "stock-in" && canIn) || (action === "stock-out" && canOut)) {
      setMovement({ type: action === "stock-in" ? "IN" : "OUT", material: null });
      setParams({}, { replace: true });
    }
  }, [params, canIn, canOut]);

  const categories = useMemo(() => [...new Set(materials.data.map((item) => item.category).filter(Boolean))].sort(), [materials.data]);
  
  const filtered = useMemo(() => {
    return materials.data.filter((item) => {
      const term = search.trim().toLowerCase();
      if (term && !item.materialName.toLowerCase().includes(term) && !item.sku.toLowerCase().includes(term) && !item.category.toLowerCase().includes(term)) return false;
      if (filters.category !== "ALL" && item.category !== filters.category) return false;
      if (filters.godown !== "ALL" && !item.godownStocks?.some((row) => row.godown.id === filters.godown)) return false;
      
      const status = stockStatus(item);
      if (filters.status !== "ALL") {
        if (filters.status === "LOW_STOCK" && status !== "LOW_STOCK") return false;
        if (filters.status === "OUT_OF_STOCK" && !["OUT_OF_STOCK", "FULLY_RESERVED"].includes(status)) return false;
        if (filters.status === "IN_STOCK" && status !== "IN_STOCK") return false;
      }
      return true;
    });
  }, [materials.data, search, filters]);

  const activeCount = Object.values(filters).filter((value) => value !== "ALL").length;

  const remove = async (item: InventoryItemData) => {
    if (!confirm(`Delete ${item.materialName}? Stock history linked to this material will also be removed.`)) return;
    try {
      await inventoryApi.deleteItem(item.id);
      toast.success("Material deleted");
      await materials.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Material could not be deleted.");
    }
  };

  const openMovement = (type: "IN" | "OUT", material: InventoryItemData | null) => setMovement({ type, material });

  // Calculations for summary cards
  const totalStockValue = materials.data.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);
  const lowStockCount = materials.data.filter((item) => stockStatus(item) === "LOW_STOCK").length;
  const outOfStockCount = materials.data.filter((item) => ["OUT_OF_STOCK", "FULLY_RESERVED"].includes(stockStatus(item))).length;
  const totalQty = materials.data.reduce((sum, item) => sum + item.quantity, 0);

  const filtersPanel = (
    <>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Category
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <option value="ALL">All categories</option>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Godown / Warehouse
        <select value={draft.godown} onChange={(e) => setDraft({ ...draft, godown: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <option value="ALL">All godowns</option>
          {godowns.map((godown) => <option key={godown.id} value={godown.id}>{godown.name}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Stock status
        <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <option value="ALL">All statuses</option>
          <option value="IN_STOCK">Available</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </label>
    </>
  );

  return (
    <div className="min-w-0 space-y-6">
      {/* 1. Header Section */}
      <PageHeader 
        title="Inventory Management" 
        description="Track construction materials, stock levels, and warehouse movement" 
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {canCreate && (
              <button 
                onClick={() => navigate("/materials/new")} 
                className="flex min-h-10 items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              >
                <PackagePlus size={15}/>
                Add Material
              </button>
            )}
            {canIn && (
              <button 
                onClick={() => openMovement("IN", null)} 
                className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              >
                <PackagePlus size={15}/>
                Stock In
              </button>
            )}
            {hasPermission(user, "godowns:transfer") && (
              <button 
                onClick={() => navigate("/transfers/new")} 
                className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeftRight size={14}/>
                Stock Transfer
              </button>
            )}
          </div>
        }
      />

      {/* 2. Inventory Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Materials" value={materials.data.length} helper="Unique items cataloged" icon={Package} />
        <StatCard label="Total Stock Value" value={fmt(totalStockValue)} helper="Physical assets worth" icon={Landmark} />
        <StatCard label="Low Stock Items" value={lowStockCount} helper="Below minimum limit" icon={ShieldAlert} className={lowStockCount > 0 ? "border-amber-200 bg-amber-50/20" : ""} />
        <StatCard label="Out of Stock" value={outOfStockCount} helper="Awaiting purchases" icon={AlertTriangle} className={outOfStockCount > 0 ? "border-red-200 bg-red-50/20" : ""} />
        <StatCard label="Total Quantity" value={totalQty.toLocaleString("en-IN")} helper="Combined store inventory" icon={Boxes} />
      </div>

      {/* 4. Smart Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search material name, SKU or category" 
              className="w-full rounded-lg border border-slate-200 pl-10 pr-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button 
            onClick={() => { setDraft(filters); setFilterOpen(true); }} 
            className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer"
          >
            <Filter size={15}/>
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Filter Panel */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 items-end border-t pt-3">
          {filtersPanel}
          <div className="flex gap-2">
            <button 
              onClick={() => setFilters(draft)} 
              className="h-10 flex-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white cursor-pointer transition-colors"
            >
              Apply Filters
            </button>
            <button 
              onClick={() => { setDraft(initialFilters); setFilters(initialFilters); }} 
              className="h-10 px-4 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {materials.loading && !materials.data.length ? (
        <LoadingSkeleton rows={6}/>
      ) : materials.error ? (
        <EmptyState title="Could not load inventory" description={materials.error} action={<button onClick={materials.refresh} className="rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold">Retry</button>} />
      ) : !filtered.length ? (
        <EmptyState 
          title="No materials found" 
          description={search || activeCount > 0 ? "Try adjusting your filters or search keywords." : "Add your first material to start managing your inventory."} 
          icon={Package} 
          action={
            canCreate && !materials.data.length ? (
              <button onClick={() => navigate("/materials/new")} className="min-h-10 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 text-xs font-bold text-white transition-colors cursor-pointer">
                Add First Material
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile Reusable Card List Viewport (<768px) */}
          <div className="space-y-3.5 md:hidden">
            {filtered.map((item) => {
              const status = stockStatus(item);
              const godownsText = item.godownStocks?.map((gs) => gs.godown.name).join(", ") || "Main Godown";
              const itemStockValue = item.quantity * (item.costPrice || 0);

              return (
                <MobileDataCard
                  key={item.id}
                  title={item.materialName}
                  subtitle={`${item.sku} · ${item.category}`}
                  badge={<BusinessStatusBadge status={status} />}
                  onClick={() => navigate(`/materials/${item.id}`)}
                  primaryMetric={{
                    label: "Available Quantity",
                    value: <QuantityDisplay value={availableStock(item)} unit={item.unit} />,
                    helper: `Min limit: ${minimumStock(item)} ${item.unit}`
                  }}
                  secondaryMetrics={[
                    { label: "Stock Value", value: fmt(itemStockValue) },
                    { label: "Godown / Location", value: godownsText }
                  ]}
                  actions={
                    <>
                      <button
                        onClick={() => navigate(`/materials/${item.id}`)}
                        className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
                      >
                        View Details
                      </button>
                      {canIn && (
                        <button
                          onClick={() => openMovement("IN", item)}
                          className="flex-1 min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-xs font-bold text-white cursor-pointer press-active"
                        >
                          + Stock In
                        </button>
                      )}
                      {hasPermission(user, "godowns:transfer") && (
                        <button
                          onClick={() => navigate(`/transfers/new?materialId=${item.id}`)}
                          className="min-h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
                        >
                          Transfer
                        </button>
                      )}
                    </>
                  }
                />
              );
            })}
          </div>

          {/* Desktop Table Viewport (>=768px) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Material</th>
                  <th className="font-semibold text-xs uppercase tracking-wider text-slate-500">Category</th>
                  <th className="font-semibold text-xs uppercase tracking-wider text-slate-500">Unit</th>
                  <th className="font-semibold text-xs uppercase tracking-wider text-slate-500">Available Quantity</th>
                  <th className="font-semibold text-xs uppercase tracking-wider text-slate-500">Godowns & Warehouses</th>
                  <th className="font-semibold text-xs uppercase tracking-wider text-slate-500">Stock Status</th>
                  <th className="w-28 font-semibold text-xs uppercase tracking-wider text-slate-500 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const status = stockStatus(item);
                  const godownsText = item.godownStocks?.map((gs) => gs.godown.name).join(", ") || "—";
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <button onClick={() => navigate(`/materials/${item.id}`)} className="text-left cursor-pointer group">
                          <span className="block font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{item.materialName}</span>
                          <span className="text-xs text-slate-400 font-medium">{item.sku}</span>
                        </button>
                      </td>
                      <td className="text-slate-600 font-medium">{item.category}</td>
                      <td className="text-slate-500 font-medium">{item.unit}</td>
                      <td className="font-black text-slate-900"><QuantityDisplay value={availableStock(item)} unit={item.unit}/></td>
                      <td className="text-slate-600 text-xs max-w-[200px] truncate" title={godownsText}>{godownsText}</td>
                      <td><BusinessStatusBadge status={status}/></td>
                      <td className="text-right pr-6">
                        <div className="flex items-center justify-end">
                          <button onClick={() => navigate(`/materials/${item.id}`)} className="min-h-9 px-3 font-bold text-orange-600 hover:text-orange-700 cursor-pointer">
                            View
                          </button>
                          <details className="relative">
                            <summary aria-label={`More actions for ${item.materialName}`} className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg hover:bg-slate-100 border border-transparent">
                              <MoreVertical size={16}/>
                            </summary>
                            <div className="absolute right-0 z-20 w-40 rounded-xl border bg-white p-1 shadow-lg border-slate-100 text-left">
                              {canIn && <button onClick={() => openMovement("IN", item)} className="min-h-9 w-full rounded px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-left">Stock In</button>}
                              {canOut && <button onClick={() => openMovement("OUT", item)} className="min-h-9 w-full rounded px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-left">Stock Out</button>}
                              {canUpdate && <button onClick={() => navigate(`/materials/${item.id}/edit`)} className="min-h-9 w-full rounded px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-left">Edit</button>}
                              {canDelete && <button onClick={() => remove(item)} className="min-h-9 w-full rounded px-3 text-xs font-semibold text-red-600 hover:bg-slate-50 cursor-pointer text-left">Delete</button>}
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Reusable Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Inventory"
        subtitle="Filter materials by category, warehouse & stock status"
        activeFilterCount={activeCount}
        onReset={() => {
          setDraft(initialFilters);
          setFilters(initialFilters);
        }}
        onApply={() => {
          setFilters(draft);
          setFilterOpen(false);
        }}
      >
        {filtersPanel}
      </MobileFilterDrawer>

      <StockMovementDialog 
        open={!!movement} 
        type={movement?.type ?? "IN"} 
        materials={materials.data} 
        initialMaterial={movement?.material} 
        godowns={godowns} 
        onClose={() => setMovement(null)} 
        onSuccess={materials.refresh}
      />
    </div>
  );
}

