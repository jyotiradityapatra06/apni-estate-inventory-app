import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  SlidersHorizontal, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  FileText, 
  RefreshCw, 
  User, 
  Calendar,
  Building2,
  Boxes,
  PlusCircle,
  MinusCircle
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../../app/components/common/PageHeader";
import { LoadingSkeleton, EmptyState } from "../../app/components/common/FeedbackStates";
import { inventoryApi, type InventoryItemData, type StockTransactionData } from "../../api/inventory.api";
import { godownApi } from "../../api/godown.api";
import { useAuth } from "../../hooks/useAuth";
import type { Godown } from "../../types/godown.types";
import { fmt } from "../../utils/currency";

const ADJUSTMENT_REASONS = [
  { value: "PHYSICAL_COUNT_CORRECTION", label: "Physical Count Correction" },
  { value: "DAMAGED_STOCK", label: "Damaged Stock" },
  { value: "EXPIRED_MATERIAL", label: "Expired Material" },
  { value: "MANUAL_ADJUSTMENT", label: "Manual Adjustment" },
  { value: "OTHER", label: "Other" },
];

export function StockAdjustmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<InventoryItemData[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [transactions, setTransactions] = useState<StockTransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [selectedGodownId, setSelectedGodownId] = useState("");
  const [newQuantityInput, setNewQuantityInput] = useState("");
  const [reason, setReason] = useState("PHYSICAL_COUNT_CORRECTION");
  const [note, setNote] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      inventoryApi.getItems(),
      godownApi.getAll().catch(() => ({ data: [] })),
      inventoryApi.getAllTransactions().catch(() => ({ data: [] })),
    ])
      .then(([invRes, godownRes, txRes]) => {
        if (invRes?.data) setItems(invRes.data);
        if (godownRes?.data) setGodowns(godownRes.data.filter((g) => g.isActive));
        if (txRes?.data) setTransactions(txRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedMaterial = useMemo(
    () => items.find((i) => i.id === selectedMaterialId),
    [items, selectedMaterialId]
  );

  // Calculate current quantity in selected godown (or total quantity)
  const currentQuantity = useMemo(() => {
    if (!selectedMaterial) return 0;
    if (selectedGodownId && selectedMaterial.godownStocks) {
      const gs = selectedMaterial.godownStocks.find((g) => g.godown.id === selectedGodownId);
      return gs ? gs.quantity : 0;
    }
    return selectedMaterial.quantity;
  }, [selectedMaterial, selectedGodownId]);

  const newQuantity = Number(newQuantityInput || 0);
  const delta = newQuantity - currentQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!selectedMaterialId) {
      toast.error("Please select a material.");
      return;
    }
    if (newQuantityInput === "" || isNaN(newQuantity) || newQuantity < 0) {
      toast.error("Please enter a valid new quantity.");
      return;
    }
    if (delta === 0) {
      toast.error("New quantity is identical to current quantity.");
      return;
    }

    setSubmitting(true);
    try {
      const idempotencyKey = `adj-${selectedMaterialId}-${Date.now()}`;
      const type = delta >= 0 ? "IN" : "OUT";
      const quantity = Math.abs(delta);

      await inventoryApi.adjustStock(selectedMaterialId, {
        idempotencyKey,
        type,
        quantity,
        note: note || undefined,
        godownId: selectedGodownId || undefined,
        reason,
      });

      toast.success("Stock adjustment successfully posted!");
      // Reset Form
      setSelectedMaterialId("");
      setSelectedGodownId("");
      setNewQuantityInput("");
      setNote("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit stock adjustment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation & Header */}
      <button
        onClick={() => navigate("/inventory")}
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-muted-foreground hover:text-orange-600 cursor-pointer dark:text-slate-300 dark:hover:text-orange-400"
      >
        <ArrowLeft size={14} />
        Back to Stock Overview
      </button>

      <PageHeader
        title="Controlled Stock Adjustment & Audit Trail"
        description="Correct physical inventory counts, record damaged or expired stock, and view transaction audit trail."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Adjustment Form (1 Column) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2 border-b pb-3 dark:border-slate-800">
              <SlidersHorizontal size={16} className="text-orange-500" />
              New Stock Correction
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Step 1: Select Material */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground dark:text-muted-foreground block mb-1">
                  1. Material Item *
                </label>
                <select
                  required
                  value={selectedMaterialId}
                  onChange={(e) => {
                    setSelectedMaterialId(e.target.value);
                    setNewQuantityInput("");
                  }}
                  className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Select Material Item...</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.materialName} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Godown */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground dark:text-muted-foreground block mb-1">
                  2. Warehouse / Godown
                </label>
                <select
                  value={selectedGodownId}
                  onChange={(e) => setSelectedGodownId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">All Warehouses / Default</option>
                  {godowns.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3 & 4: Quantities & Difference Calculation */}
              {selectedMaterial && (
                <div className="rounded-xl border border-border bg-muted/70 p-3.5 space-y-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-extrabold uppercase text-[10px]">Current Quantity:</span>
                    <strong className="text-foreground font-black text-sm dark:text-slate-100">
                      {currentQuantity} {selectedMaterial.unit}
                    </strong>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-muted-foreground dark:text-muted-foreground block mb-1">
                      New Corrected Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder={`e.g. ${currentQuantity}`}
                      value={newQuantityInput}
                      onChange={(e) => setNewQuantityInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {newQuantityInput !== "" && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/80 dark:border-slate-700">
                      <span className="text-muted-foreground font-extrabold uppercase text-[10px]">Quantity Change:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                          delta > 0
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : delta < 0
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-slate-200 text-muted-foreground dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {delta > 0 ? <PlusCircle size={12} /> : delta < 0 ? <MinusCircle size={12} /> : null}
                        {delta > 0 ? `+${delta}` : delta} {selectedMaterial.unit}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Adjustment Reason */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground dark:text-muted-foreground block mb-1">
                  5. Adjustment Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {ADJUSTMENT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 6: Reference Note */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground dark:text-muted-foreground block mb-1">
                  6. Audit Note / Reference
                </label>
                <input
                  type="text"
                  placeholder="Reasoning or physical audit ref..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !selectedMaterialId || newQuantityInput === ""}
                className="w-full min-h-11 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-2xs transition-colors cursor-pointer dark:bg-orange-600 dark:hover:bg-orange-500"
              >
                {submitting ? "Posting Adjustment..." : "Submit Stock Adjustment"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Audit Trail & Transaction Log (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3 dark:border-slate-800">
              <h3 className="font-black text-foreground text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2">
                <History size={16} className="text-orange-500" />
                Stock Adjustment Audit Trail History ({transactions.length})
              </h3>
              <button
                onClick={loadData}
                className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline dark:text-orange-400 cursor-pointer"
              >
                <RefreshCw size={13} />
                Refresh Logs
              </button>
            </div>

            {transactions.length === 0 ? (
              <EmptyState
                title="No Adjustment History"
                description="No stock adjustment transactions have been recorded yet."
              />
            ) : (
              <>
                {/* Desktop Audit Table */}
                <div className="hidden overflow-hidden rounded-xl border border-border md:block dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground border-b border-border dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
                      <tr>
                        <th className="px-3.5 py-3 font-black uppercase">Date & Time</th>
                        <th className="px-3.5 py-3 font-black uppercase">Material Name</th>
                        <th className="px-3.5 py-3 font-black uppercase">Godown</th>
                        <th className="px-3.5 py-3 font-black uppercase">Change</th>
                        <th className="px-3.5 py-3 font-black uppercase">Reason</th>
                        <th className="px-3.5 py-3 font-black uppercase">Performed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const isIncrease = tx.type === "IN" || tx.type === "TRANSFER_IN";
                        const reasonLabel =
                          ADJUSTMENT_REASONS.find((r) => r.value === tx.reason)?.label ||
                          tx.reason?.replaceAll("_", " ") ||
                          "Stock Movement";

                        return (
                          <tr
                            key={tx.id}
                            className="border-b last:border-0 border-border hover:bg-muted/70 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            <td className="px-3.5 py-3 font-semibold text-muted-foreground dark:text-muted-foreground whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleString("en-IN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </td>
                            <td className="px-3.5 py-3 font-extrabold text-foreground dark:text-slate-100">
                              {tx.inventoryItem?.materialName || "Material Item"}
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground dark:text-slate-300 font-semibold">
                              {tx.godown?.name || "Main Warehouse"}
                            </td>
                            <td className="px-3.5 py-3 font-black">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black ${
                                  isIncrease
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                              >
                                {isIncrease ? `+${tx.quantity}` : `-${tx.quantity}`} {tx.inventoryItem?.unit || "units"}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground dark:text-slate-300 font-medium">
                              <span className="capitalize">{reasonLabel}</span>
                              {tx.note && <span className="text-[10px] text-muted-foreground block">{tx.note}</span>}
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground dark:text-muted-foreground font-semibold">
                              {tx.user?.name || "System Admin"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Audit Card List */}
                <div className="grid gap-3 md:hidden">
                  {transactions.map((tx) => {
                    const isIncrease = tx.type === "IN" || tx.type === "TRANSFER_IN";
                    return (
                      <div
                        key={tx.id}
                        className="rounded-xl border border-border bg-muted/50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="font-extrabold text-foreground dark:text-slate-100">
                            {tx.inventoryItem?.materialName || "Material"}
                          </strong>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-black ${
                              isIncrease ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isIncrease ? `+${tx.quantity}` : `-${tx.quantity}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{tx.godown?.name || "Warehouse"}</span>
                          <span>{new Date(tx.createdAt).toLocaleDateString("en-IN")}</span>
                        </div>
                        {tx.note && <p className="text-[11px] text-muted-foreground dark:text-muted-foreground italic">{tx.note}</p>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockAdjustmentPage;
