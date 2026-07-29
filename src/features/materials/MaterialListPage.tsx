import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  Package, 
  PackagePlus, 
  Search, 
  Filter, 
  Tag, 
  Percent, 
  Trash2, 
  Edit3, 
  Eye,
  SlidersHorizontal,
  Boxes
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../../app/components/common/PageHeader";
import { StatCard } from "../../app/components/common/Card";
import { LoadingSkeleton, EmptyState } from "../../app/components/common/FeedbackStates";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { useMaterials } from "./useMaterials";
import { fmt } from "../../utils/currency";

export function MaterialListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const materials = useMaterials();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const canCreate = hasPermission(user, "inventory:create");
  const canUpdate = hasPermission(user, "inventory:update");
  const canDelete = hasPermission(user, "inventory:delete");

  const categories = useMemo(
    () => Array.from(new Set(materials.data.map((item) => item.category).filter(Boolean))).sort(),
    [materials.data]
  );

  const filteredMaterials = useMemo(() => {
    return materials.data.filter((item) => {
      const term = search.trim().toLowerCase();
      if (
        term &&
        !item.materialName.toLowerCase().includes(term) &&
        !item.sku.toLowerCase().includes(term) &&
        !item.category.toLowerCase().includes(term) &&
        !(item.hsnCode || "").toLowerCase().includes(term)
      ) {
        return false;
      }
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      if (statusFilter === "ACTIVE" && !item.isActive) return false;
      if (statusFilter === "INACTIVE" && item.isActive) return false;
      return true;
    });
  }, [materials.data, search, categoryFilter, statusFilter]);

  const handleDelete = async (item: InventoryItemData) => {
    if (!confirm(`Are you sure you want to delete ${item.materialName}?`)) return;
    try {
      await inventoryApi.deleteItem(item.id);
      toast.success("Material deleted from catalog");
      await materials.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete material");
    }
  };

  if (materials.loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <PageHeader
        title="Material Master Catalog"
        description="Manage item definitions, SKUs, HSN codes, tax rates, units, and reorder levels."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate("/inventory")}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground shadow-2xs hover:bg-muted transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Boxes size={15} />
              Stock Overview
            </button>
            {canCreate && (
              <button
                onClick={() => navigate("/materials/new")}
                className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer dark:bg-orange-600 dark:hover:bg-orange-500"
              >
                <PackagePlus size={15} />
                Add New Material
              </button>
            )}
          </div>
        }
      />

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Catalog Materials"
          value={materials.data.length.toLocaleString("en-IN")}
          icon={Package}
        />
        <StatCard
          label="Material Categories"
          value={categories.length.toLocaleString("en-IN")}
          icon={Tag}
        />
        <StatCard
          label="Active Materials"
          value={materials.data.filter((i) => i.isActive).length.toLocaleString("en-IN")}
          icon={Package}
        />
        <StatCard
          label="Inactive Materials"
          value={materials.data.filter((i) => !i.isActive).length.toLocaleString("en-IN")}
          icon={Package}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 dark:border-slate-800">
          <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100">
            Material Master Catalogue ({filteredMaterials.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, SKU, HSN..."
                className="h-10 rounded-xl border border-border bg-card pl-9 pr-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* 4. Table & Cards Display */}
        {filteredMaterials.length === 0 ? (
          <EmptyState
            title="No materials available"
            description="No material item definitions found matching your search or filters."
            action={
              canCreate ? (
                <button onClick={() => navigate("/materials/new")} className="min-h-10 rounded-xl bg-orange-600 px-4 text-xs font-bold text-white cursor-pointer">
                  Add Material
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-hidden rounded-xl border border-border md:block dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground border-b border-border dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 font-black uppercase">Material Name</th>
                    <th className="px-4 py-3.5 font-black uppercase">SKU</th>
                    <th className="px-4 py-3.5 font-black uppercase">Category</th>
                    <th className="px-4 py-3.5 font-black uppercase">HSN Code</th>
                    <th className="px-4 py-3.5 font-black uppercase">GST Rate</th>
                    <th className="px-4 py-3.5 font-black uppercase">Unit</th>
                    <th className="px-4 py-3.5 font-black uppercase">Reorder Level</th>
                    <th className="px-4 py-3.5 font-black uppercase">Status</th>
                    <th className="px-4 py-3.5 font-black uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((item) => (
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
                      <td className="px-4 py-3.5 font-mono text-muted-foreground font-bold dark:text-slate-300">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground dark:text-muted-foreground font-semibold">
                        {item.category}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground dark:text-muted-foreground font-medium">
                        {item.hsnCode || "—"}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-foreground dark:text-slate-200">
                        {item.taxRate !== undefined && item.taxRate !== null ? `${item.taxRate}%` : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground dark:text-muted-foreground font-semibold uppercase">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-foreground dark:text-slate-200">
                        {item.reorderLevel} {item.unit}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            item.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-slate-200 text-muted-foreground dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/materials/${item.id}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-orange-600 hover:bg-muted dark:hover:bg-slate-800"
                            title="View Material Details"
                          >
                            <Eye size={15} />
                          </Link>
                          {canUpdate && (
                            <Link
                              to={`/materials/${item.id}/edit`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-muted dark:hover:bg-slate-800"
                              title="Edit Material"
                            >
                              <Edit3 size={15} />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-muted dark:hover:bg-slate-800 cursor-pointer"
                              title="Delete Material"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="grid gap-3.5 md:hidden">
              {filteredMaterials.map((item) => (
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
                      <span className="text-xs text-muted-foreground block font-mono">{item.sku} • {item.category}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-muted-foreground"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-border dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block font-bold">HSN Code</span>
                      <strong className="text-foreground dark:text-slate-200">{item.hsnCode || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block font-bold">GST Rate</span>
                      <strong className="text-foreground dark:text-slate-200">
                        {item.taxRate !== undefined && item.taxRate !== null ? `${item.taxRate}%` : "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block font-bold">Reorder Level</span>
                      <strong className="text-foreground dark:text-slate-200">{item.reorderLevel} {item.unit}</strong>
                    </div>
                  </div>

                  {/* Mobile Material Card Quick Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border/60">
                    <button
                      onClick={() => navigate(`/materials/${item.id}`)}
                      className="flex-1 min-h-[40px] rounded-xl border border-border bg-background hover:bg-muted text-[11px] font-bold text-foreground cursor-pointer press-active"
                    >
                      View History
                    </button>
                    <button
                      onClick={() => navigate("/inventory/stock-adjustments")}
                      className="flex-1 min-h-[40px] rounded-xl bg-orange-600 hover:bg-orange-700 text-[11px] font-bold text-white cursor-pointer press-active"
                    >
                      Adjust Stock
                    </button>
                    <button
                      onClick={() => navigate("/transfers")}
                      className="flex-1 min-h-[40px] rounded-xl border border-border bg-card hover:bg-muted text-[11px] font-bold text-muted-foreground cursor-pointer press-active"
                    >
                      Transfer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MaterialListPage;
