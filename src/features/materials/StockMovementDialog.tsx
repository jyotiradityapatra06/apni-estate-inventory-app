import { useEffect, useMemo, useRef, useState } from "react";
import { X, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";
import type { Godown } from "../../types/godown.types";
import { formatQuantity } from "../../utils/currency";
import { godownAvailable } from "./stockCalculations";

interface StockMovementDialogProps {
  open: boolean;
  type: "IN" | "OUT";
  materials: InventoryItemData[];
  initialMaterial?: InventoryItemData | null;
  godowns: Godown[];
  onClose: () => void;
  onSuccess: () => void;
}

export function StockMovementDialog({
  open,
  type,
  materials,
  initialMaterial,
  godowns,
  onClose,
  onSuccess,
}: StockMovementDialogProps) {
  const idempotencyKey = useRef(crypto.randomUUID());
  const [materialId, setMaterialId] = useState("");
  const [godownId, setGodownId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const material = materials.find((item) => item.id === materialId);
  const balance = material?.godownStocks?.find((row) => row.godown.id === godownId);
  const current = Number(balance?.quantity ?? 0);
  const reserved = Number(balance?.reservedQuantity ?? 0);
  const available = balance ? godownAvailable(balance) : 0;
  const amount = Number(quantity || 0);
  const after = type === "IN" ? current + amount : current - amount;

  const selectableGodowns = useMemo(
    () =>
      type === "IN"
        ? godowns
        : (material?.godownStocks ?? []).map((row) => ({ ...row.godown, isActive: true } as Godown)),
    [godowns, material, type]
  );

  useEffect(() => {
    if (!open) return;
    idempotencyKey.current = crypto.randomUUID();
    const id = initialMaterial?.id ?? "";
    setMaterialId(id);
    const rows = initialMaterial?.godownStocks ?? [];
    setGodownId(rows.length === 1 ? rows[0].godown.id : "");
    setQuantity("");
    setReason("");
    setNotes("");
    setError("");
  }, [open, initialMaterial, type]);

  useEffect(() => {
    const rows = material?.godownStocks ?? [];
    if (rows.length === 1) setGodownId(rows[0].godown.id);
    else if (!rows.some((row) => row.godown.id === godownId)) setGodownId("");
  }, [materialId]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!material || !godownId) return setError("Please select both a material and a godown.");
    if (!(amount > 0)) return setError("Please enter a valid quantity greater than zero.");
    if (type === "OUT" && amount > available)
      return setError(`Only ${formatQuantity(available, material.unit)} available in this godown.`);

    setSaving(true);
    try {
      await inventoryApi.adjustStock(material.id, {
        idempotencyKey: idempotencyKey.current,
        type,
        quantity: amount,
        godownId,
        reason: reason.trim() || "MANUAL_ADJUSTMENT",
        note: notes.trim() || undefined,
      });
      toast.success(type === "IN" ? "Stock added successfully" : "Stock removed successfully");
      window.dispatchEvent(new Event("notifications:refresh"));
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stock could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/50 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={type === "IN" ? "Stock In Dialog" : "Stock Out Dialog"}
    >
      <form
        onSubmit={submit}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                type === "IN" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-600"
              }`}
            >
              {type === "IN" ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-wider ${type === "IN" ? "text-green-700" : "text-orange-600"}`}>
                {type === "IN" ? "Stock Entry (+ Stock In)" : "Stock Outward (- Stock Out)"}
              </p>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {type === "IN" ? "Receive Material into Godown" : "Dispatch / Remove Stock"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-800">
            <AlertTriangle size={18} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Material Picker */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Select Material
            <select
              required
              value={materialId}
              disabled={!!initialMaterial}
              onChange={(e) => setMaterialId(e.target.value)}
              className="mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
            >
              <option value="">Choose material item…</option>
              {materials.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.materialName} ({item.unit}) · SKU: {item.sku}
                </option>
              ))}
            </select>
          </label>

          {/* Godown Picker */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Select Warehouse / Godown
            <select
              required
              value={godownId}
              onChange={(e) => setGodownId(e.target.value)}
              className="mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
            >
              <option value="">Choose target godown…</option>
              {selectableGodowns.map((godown) => {
                const row = material?.godownStocks?.find((item) => item.godown.id === godown.id);
                return (
                  <option key={godown.id} value={godown.id}>
                    {godown.name} {row ? `(${formatQuantity(godownAvailable(row), material?.unit)} available)` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          {/* Live Balance Summary Stat Box */}
          {material && godownId && (
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-center">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Physical</span>
                <strong className="text-sm font-black text-slate-900 mt-0.5 block">
                  {formatQuantity(current, material.unit)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Reserved</span>
                <strong className="text-sm font-black text-slate-900 mt-0.5 block">
                  {formatQuantity(reserved, material.unit)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Available</span>
                <strong className="text-sm font-black text-green-700 mt-0.5 block">
                  {formatQuantity(available, material.unit)}
                </strong>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Quantity ({material ? material.unit : "Units"})
            <input
              required
              type="number"
              inputMode="decimal"
              min="0.001"
              step="0.001"
              placeholder={`Enter quantity in ${material ? material.unit : "units"}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base font-black text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
            />
          </label>

          {/* Calculation Preview Banner */}
          {material && amount > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/60 p-3.5 text-sm font-bold">
              <span className="text-slate-700">Calculated New Physical Stock:</span>
              <strong className={`text-base font-black ${after < 0 ? "text-red-700" : "text-slate-900"}`}>
                {formatQuantity(Math.max(0, after), material.unit)}
              </strong>
            </div>
          )}

          {/* Reason Select/Input */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Reason / Purpose
            <input
              list={`reasons-${type}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === "IN" ? "Purchase receipt, customer return, supplier stock" : "Dispatch, site issue, wastage, damage"}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
            />
            <datalist id={`reasons-${type}`}>
              {(type === "IN"
                ? ["PURCHASE", "CUSTOMER_RETURN", "ADJUSTMENT", "OTHER"]
                : ["MANUAL_SALE", "DAMAGE", "WASTAGE", "SITE_ISSUE", "ADJUSTMENT", "OTHER"]
              ).map((val) => (
                <option key={val} value={val} />
              ))}
            </datalist>
          </label>

          {/* Notes */}
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Notes / Reference (Optional)
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Challan #1042 or Truck MH-12 AB 1234"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl border border-slate-200 text-xs sm:text-sm font-extrabold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            type="submit"
            className={`flex-[2] min-h-[48px] rounded-xl text-xs sm:text-sm font-extrabold text-white cursor-pointer shadow-sm disabled:opacity-60 ${
              type === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-[#F97316] hover:bg-orange-600"
            }`}
          >
            {saving ? "Saving Entry…" : type === "IN" ? "Confirm Stock In (+)" : "Confirm Stock Out (-)"}
          </button>
        </div>
      </form>
    </div>
  );
}
