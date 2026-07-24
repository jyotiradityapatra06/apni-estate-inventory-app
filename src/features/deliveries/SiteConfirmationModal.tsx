import React, { useState, useEffect } from "react";
import { CheckCircle2, ShieldAlert, X, FileText, User, PackageCheck, AlertTriangle } from "lucide-react";
import { formatQuantity } from "../../utils/currency";

interface SiteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    receiverName: string;
    proofOfDeliveryReference?: string;
    deliveryNotes?: string;
    confirmedAt: string;
    items: Array<{
      deliveryItemId: string;
      receivedQuantity: number;
      rejectedQuantity: number;
      notes?: string;
    }>;
  }) => Promise<void>;
  items: any[];
}

export const SiteConfirmationModal: React.FC<SiteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items = []
}) => {
  if (!isOpen) return null;

  const [receiverName, setReceiverName] = useState("");
  const [proofReference, setProofReference] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [itemStates, setItemStates] = useState<
    Record<
      string,
      {
        received: string;
        rejected: string;
        notes: string;
      }
    >
  >({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize item states on modal open
  useEffect(() => {
    const initial: Record<string, { received: string; rejected: string; notes: string }> = {};
    items.forEach((item) => {
      const dispatched = Number(item.dispatchedQuantity || item.plannedQuantity || 0);
      initial[item.id] = {
        received: String(dispatched),
        rejected: "0",
        notes: ""
      };
    });
    setItemStates(initial);
    setErrors({});
    setReceiverName("");
    setProofReference("");
    setDeliveryNotes("");
  }, [isOpen, items]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!receiverName.trim()) {
      errs.receiverName = "Receiver name is required for site confirmation";
    }

    if (!items || items.length === 0) {
      errs.general = "No items available for confirmation";
    }

    items.forEach((item) => {
      const dispatched = Number(item.dispatchedQuantity || item.plannedQuantity || 0);
      const state = itemStates[item.id] || { received: "0", rejected: "0", notes: "" };
      const rec = Number(state.received || 0);
      const rej = Number(state.rejected || 0);

      if (isNaN(rec) || rec < 0) {
        errs[`item_${item.id}`] = `Received quantity cannot be negative for ${item.materialName}`;
      } else if (isNaN(rej) || rej < 0) {
        errs[`item_${item.id}`] = `Rejected quantity cannot be negative for ${item.materialName}`;
      } else if (rec + rej > dispatched + 0.0001) {
        errs[`item_${item.id}`] = `Received (${rec}) + Rejected (${rej}) exceeds Dispatched quantity (${dispatched}) for ${item.materialName}`;
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        receiverName: receiverName.trim(),
        proofOfDeliveryReference: proofReference.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        confirmedAt: new Date().toISOString(),
        items: items.map((item) => {
          const state = itemStates[item.id] || { received: "0", rejected: "0", notes: "" };
          return {
            deliveryItemId: item.id,
            receivedQuantity: Number(state.received || 0),
            rejectedQuantity: Number(state.rejected || 0),
            notes: state.notes.trim() || undefined
          };
        })
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      // Error handled upstream
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemChange = (itemId: string, field: "received" | "rejected" | "notes", val: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val
      }
    }));
    if (errors[`item_${itemId}`]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`item_${itemId}`];
        return copy;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/40 p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-xl rounded-t-2xl sm:rounded-2xl bg-white shadow-xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <PackageCheck size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Site Delivery Confirmation
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                Log Receiver Signature & Received Quantities
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form id="site-confirmation-form" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 flex-1">
          {errors.general && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Receiver Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Receiver & Site Verification
            </h3>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Receiver Name (Site Supervisor / Customer) *
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => {
                  setReceiverName(e.target.value);
                  if (errors.receiverName) setErrors({ ...errors, receiverName: "" });
                }}
                placeholder="e.g. Ramesh Site Engineer"
                className={`min-h-[44px] w-full rounded-xl border px-3 text-xs font-bold focus:outline-none ${
                  errors.receiverName
                    ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-500"
                    : "border-slate-200 bg-white text-slate-900 focus:border-green-600"
                }`}
              />
              {errors.receiverName && (
                <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                  <ShieldAlert size={12} />
                  <span>{errors.receiverName}</span>
                </p>
              )}
            </div>

            {/* POD Reference */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Proof of Delivery (POD) Reference (Optional)
              </label>
              <input
                type="text"
                value={proofReference}
                onChange={(e) => setProofReference(e.target.value)}
                placeholder="e.g. Gate Pass #4412 / Signature Slip"
                className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-green-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Item Acceptance Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Material Quantities Acceptance
            </h3>

            {items && items.length > 0 ? (
              items.map((item) => {
                const dispatched = Number(item.dispatchedQuantity || item.plannedQuantity || 0);
                const state = itemStates[item.id] || { received: String(dispatched), rejected: "0", notes: "" };
                const itemError = errors[`item_${item.id}`];

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                      itemError ? "border-red-300 bg-red-50/20" : "border-slate-200/80 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm font-extrabold text-slate-900 block">{item.materialName}</strong>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Godown: {item.godown?.name || "Central Store"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispatched</span>
                        <strong className="text-xs font-black text-slate-900">
                          {formatQuantity(dispatched, item.unit)}
                        </strong>
                      </div>
                    </div>

                    {/* Numeric Input Keypad Controls */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                          Received Qty ({item.unit}) *
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          value={state.received}
                          onChange={(e) => handleItemChange(item.id, "received", e.target.value)}
                          className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-green-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                          Rejected Qty ({item.unit})
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          value={state.rejected}
                          onChange={(e) => handleItemChange(item.id, "rejected", e.target.value)}
                          className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-red-600 focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {itemError && (
                      <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                        <ShieldAlert size={13} className="shrink-0" />
                        <span>{itemError}</span>
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs font-bold text-slate-400 border border-dashed rounded-xl">
                No items available for confirmation
              </div>
            )}
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Delivery Remarks / Site Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Unloaded safely at Tower B site..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-amber-50 p-3 border border-amber-100/80 text-[11px] font-semibold text-amber-900 flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              Note: Rejected quantities remain pending for subsequent deliveries and are not automatically returned to physical godown stock.
            </p>
          </div>
        </form>

        {/* Sticky Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="site-confirmation-form"
            disabled={submitting || !items || items.length === 0}
            className="min-h-[44px] flex-[2] rounded-xl bg-green-600 hover:bg-green-700 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>{submitting ? "Saving..." : "Save Site Confirmation"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
