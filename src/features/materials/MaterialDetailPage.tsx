import { ArrowLeft, Pencil, Landmark, Package, Boxes, Layers, Clock, AlertTriangle, ArrowLeftRight, Building2, Tag, Percent, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { godownApi } from "../../api/godown.api";
import { inventoryApi, type InventoryItemData, type StockTransactionData } from "../../api/inventory.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { QuantityDisplay } from "../../app/components/common/BusinessPrimitives";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../app/components/common/FeedbackStates";
import { PageHeader } from "../../app/components/common/PageHeader";
import { StatCard } from "../../app/components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import type { Godown } from "../../types/godown.types";
import { hasPermission } from "../../utils/permissions";
import { StockMovementDialog } from "./StockMovementDialog";
import { availableStock, stockStatus } from "./stockCalculations";
import { fmt } from "../../utils/currency";

const dateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function MaterialDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [material, setMaterial] = useState<InventoryItemData | null>(null);
  const [transactions, setTransactions] = useState<StockTransactionData[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [movement, setMovement] = useState<"IN" | "OUT" | null>(null);

  const canUpdate = hasPermission(user, "inventory:update");
  const canIn = hasPermission(user, "stock:in");
  const canOut = hasPermission(user, "stock:out");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [item, history, godownResponse] = await Promise.all([
        inventoryApi.getItem(id),
        inventoryApi.getTransactions(id),
        godownApi.getAll(),
      ]);
      setMaterial(item.data);
      setTransactions(history.data ?? []);
      setGodowns(godownResponse.data.filter((row) => row.isActive));
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Could not load this material.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (loading && !material) return <LoadingSkeleton rows={8} />;
  if (error || !material) return <ErrorState message={error || "Material not found."} onRetry={load} />;

  const status = stockStatus(material);
  const totalQty = material.quantity;
  const stockVal = totalQty * (material.costPrice || 0);

  return (
    <div className="min-w-0 space-y-6 pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate("/materials")}
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-muted-foreground hover:text-orange-600 cursor-pointer dark:text-slate-300 dark:hover:text-orange-400"
      >
        <ArrowLeft size={14} />
        Back to Material Master
      </button>

      {/* Header */}
      <PageHeader
        title={material.materialName}
        description={`SKU: ${material.sku} • Category: ${material.category}`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {canUpdate && (
              <button
                onClick={() => navigate(`/materials/${material.id}/edit`)}
                className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground shadow-2xs hover:bg-muted transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Pencil size={15} />
                Edit Material
              </button>
            )}
            {canIn && (
              <button
                onClick={() => setMovement("IN")}
                className="flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                Stock In
              </button>
            )}
            {canOut && (
              <button
                onClick={() => setMovement("OUT")}
                className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer dark:bg-orange-600 dark:hover:bg-orange-500"
              >
                Stock Out / Adjust
              </button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Current Total Stock"
          value={`${totalQty.toLocaleString("en-IN")} ${material.unit}`}
          icon={Boxes}
        />
        <StatCard
          label="Total Stock Valuation"
          value={fmt(stockVal)}
          icon={Landmark}
        />
        <StatCard
          label="Reorder Alert Level"
          value={`${material.reorderLevel} ${material.unit}`}
          icon={AlertTriangle}
        />
        <StatCard
          label="Stock Status"
          value={status.replaceAll("_", " ")}
          icon={Package}
        />
      </div>

      {/* Section A: Basic Information & Section D: Pricing */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2 border-b pb-3 dark:border-slate-800">
            <Package size={16} className="text-orange-500" />
            Section A — Basic Material Master Specs
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Material Name</span>
              <strong className="text-foreground dark:text-slate-100">{material.materialName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">SKU Code</span>
              <strong className="text-foreground dark:text-slate-100 font-mono">{material.sku}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Category</span>
              <strong className="text-foreground dark:text-slate-100">{material.category}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Unit</span>
              <strong className="text-foreground dark:text-slate-100 uppercase">{material.unit}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">HSN Code</span>
              <strong className="text-foreground dark:text-slate-100">{material.hsnCode || "—"}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">GST Rate</span>
              <strong className="text-foreground dark:text-slate-100">
                {material.taxRate !== undefined && material.taxRate !== null ? `${material.taxRate}%` : "—"}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Reorder Level</span>
              <strong className="text-foreground dark:text-slate-100">{material.reorderLevel} {material.unit}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Status</span>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  material.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-muted-foreground"
                }`}
              >
                {material.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Section D: Pricing & Valuation */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2 border-b pb-3 dark:border-slate-800">
            <Landmark size={16} className="text-orange-500" />
            Section D — Pricing & Inventory Valuation
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-border bg-muted/70 p-3.5 space-y-1 dark:border-slate-700 dark:bg-slate-800/60">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Cost Price (Purchase Rate)</span>
              <strong className="text-foreground font-black text-base dark:text-slate-100">
                {material.costPrice ? fmt(material.costPrice) : "Not Set"}
              </strong>
            </div>
            <div className="rounded-xl border border-border bg-muted/70 p-3.5 space-y-1 dark:border-slate-700 dark:bg-slate-800/60">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Selling Price (Invoice Rate)</span>
              <strong className="text-foreground font-black text-base dark:text-slate-100">
                {material.sellingPrice ? fmt(material.sellingPrice) : "Not Set"}
              </strong>
            </div>
            <div className="col-span-2 rounded-xl border border-border bg-muted/70 p-3.5 space-y-1 dark:border-slate-700 dark:bg-slate-800/60">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Stock Valuation</span>
              <strong className="text-orange-600 font-black text-lg dark:text-orange-400">
                {fmt(stockVal)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Stock Distribution & Section C: Supplier Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Section B: Stock Distribution */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3 text-xs">
          <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2 border-b pb-3 dark:border-slate-800">
            <Layers size={16} className="text-orange-500" />
            Section B — Godown / Warehouse Stock Distribution
          </h3>
          {material.godownStocks && material.godownStocks.length > 0 ? (
            <div className="space-y-2.5">
              {material.godownStocks.map((gs) => (
                <div
                  key={gs.id}
                  className="flex items-center justify-between rounded-xl bg-muted p-3 border border-border/80 font-semibold dark:bg-slate-800 dark:border-slate-700"
                >
                  <span className="text-foreground font-extrabold dark:text-slate-200">{gs.godown.name}</span>
                  <strong className="text-foreground font-black dark:text-slate-100">
                    {gs.quantity.toLocaleString("en-IN")} {material.unit}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">Default Location: {material.location || "Main Warehouse"}</p>
          )}
        </div>

        {/* Section C: Supplier Information */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3 text-xs">
          <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2 border-b pb-3 dark:border-slate-800">
            <Building2 size={16} className="text-orange-500" />
            Section C — Linked Supplier Information
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Preferred Default Supplier</span>
              <strong className="text-foreground font-extrabold text-sm dark:text-slate-100">
                {material.defaultSupplier?.name || "No default supplier designated"}
              </strong>
            </div>
            {material.supplierMaterials && material.supplierMaterials.length > 0 && (
              <div className="pt-2 border-t border-border dark:border-slate-800">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1.5">Approved Suppliers List</span>
                <div className="flex flex-wrap gap-2">
                  {material.supplierMaterials.map((sm) => (
                    <span
                      key={sm.supplier.id}
                      className="px-2.5 py-1 rounded-lg bg-muted text-foreground font-bold dark:bg-slate-800 dark:text-slate-200"
                    >
                      {sm.supplier.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section E: Movement History Audit Log */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2 border-b pb-3 dark:border-slate-800">
          <Clock size={16} className="text-orange-500" />
          Section E — Complete Movement History Audit Trail ({transactions.length})
        </h3>

        {transactions.length === 0 ? (
          <EmptyState
            title="No Movement History"
            description="No stock in, stock out, transfer, or adjustment transactions recorded yet for this material."
          />
        ) : (
          <div className="hidden overflow-hidden rounded-xl border border-border md:block dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground border-b border-border dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-black uppercase">Date & Time</th>
                  <th className="px-4 py-3 font-black uppercase">Type</th>
                  <th className="px-4 py-3 font-black uppercase">Quantity</th>
                  <th className="px-4 py-3 font-black uppercase">Godown</th>
                  <th className="px-4 py-3 font-black uppercase">Reason / Ref</th>
                  <th className="px-4 py-3 font-black uppercase">User</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isIncrease = tx.type === "IN" || tx.type === "TRANSFER_IN";
                  return (
                    <tr
                      key={tx.id}
                      className="border-b last:border-0 border-border hover:bg-muted/70 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 text-muted-foreground font-semibold dark:text-muted-foreground">
                        {dateTime(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-extrabold uppercase">
                        {tx.type}
                      </td>
                      <td className="px-4 py-3 font-black">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                            isIncrease
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {isIncrease ? `+${tx.quantity}` : `-${tx.quantity}`} {material.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-slate-300 font-semibold">
                        {tx.godown?.name || "Main Warehouse"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-slate-300 font-medium">
                        {tx.reason?.replaceAll("_", " ") || tx.referenceType || "Adjustment"}
                        {tx.note && <span className="text-[10px] text-muted-foreground block">{tx.note}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground font-semibold">
                        {tx.user?.name || "User"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Movement Modal */}
      {movement && (
        <StockMovementDialog
          open={Boolean(movement)}
          type={movement}
          materials={[material]}
          initialMaterial={material}
          godowns={godowns}
          onClose={() => setMovement(null)}
          onSuccess={() => {
            setMovement(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

export default MaterialDetailPage;
