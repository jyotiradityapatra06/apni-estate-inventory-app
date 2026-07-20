import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { purchaseApi } from "../../api/purchase.api";
import { purchaseReturnApi } from "../../api/purchaseReturn.api";
import { godownApi } from "../../api/godown.api";
import { PageHeader } from "../../app/components/common/PageHeader";

export default function CreatePurchaseReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPurchaseId = searchParams.get("purchaseOrderId") || "";

  const [pos, setPOs] = useState<any[]>([]);
  const [selectedPOId, setSelectedPOId] = useState(queryPurchaseId);
  const [poDetails, setPoDetails] = useState<any>(null);
  const [godowns, setGodowns] = useState<any[]>([]);
  
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  
  const [returnItems, setReturnItems] = useState<Record<string, { quantity: number; godownId: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingPO, setLoadingPO] = useState(false);

  useEffect(() => {
    // Fetch all POs that are RECEIVED or PARTIALLY_RECEIVED
    purchaseApi.list().then((res) => {
      setPOs(res.data.filter((x: any) => ["RECEIVED", "PARTIALLY_RECEIVED"].includes(x.status)));
    });
    // Fetch active godowns
    godownApi.getAll().then((res) => {
      setGodowns(res.data.filter((x: any) => x.isActive));
    });
  }, []);

  useEffect(() => {
    if (selectedPOId) {
      void loadPODetails(selectedPOId);
    } else {
      setPoDetails(null);
      setReturnItems({});
    }
  }, [selectedPOId]);

  const loadPODetails = async (id: string) => {
    setLoadingPO(true);
    try {
      const res = await purchaseApi.get(id);
      
      // Fetch completed purchase returns to compute remaining quantities
      const retListRes = await purchaseReturnApi.list(`purchaseOrderId=${id}`);
      const returnedMap: Record<string, number> = {};
      for (const r of retListRes.data) {
        if (r.status === "COMPLETED") {
          for (const item of r.items) {
            returnedMap[item.purchaseOrderItemId] = (returnedMap[item.purchaseOrderItemId] || 0) + Number(item.quantity);
          }
        }
      }

      // Initialize return quantities
      const initialItems: Record<string, { quantity: number; godownId: string }> = {};
      const mainGodown = godowns.find((g) => g.godownCode === "MAIN") || godowns[0];
      const defaultGodownId = mainGodown?.id || "";

      const itemsWithMax = res.data.items.map((item: any) => {
        const returnedQty = returnedMap[item.id] || 0;
        const maxReturn = Number(item.receivedQuantity) - returnedQty;
        initialItems[item.id] = {
          quantity: 0,
          godownId: defaultGodownId,
        };
        return {
          ...item,
          maxReturnable: maxReturn,
        };
      });

      setPoDetails({ ...res.data, items: itemsWithMax });
      setReturnItems(initialItems);
    } catch (e) {
      toast.error("Failed to load Purchase Order details.");
    } finally {
      setLoadingPO(false);
    }
  };

  const handleQtyChange = (itemId: string, val: number, max: number) => {
    const qty = Math.max(0, Math.min(max, val));
    setReturnItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: qty },
    }));
  };

  const handleGodownChange = (itemId: string, gId: string) => {
    setReturnItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], godownId: gId },
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOId) return toast.error("Please select a Purchase Order.");
    if (!reason.trim()) return toast.error("Please provide a return reason.");

    const items = Object.entries(returnItems)
      .filter(([_, data]) => data.quantity > 0)
      .map(([purchaseOrderItemId, data]) => ({
        purchaseOrderItemId,
        quantity: data.quantity,
        godownId: data.godownId,
      }));

    if (items.length === 0) {
      return toast.error("Please specify return quantities for at least one item.");
    }

    setSubmitting(true);
    try {
      await purchaseReturnApi.create({
        purchaseOrderId: selectedPOId,
        reason,
        notes,
        idempotencyKey: crypto.randomUUID(),
        items,
      });
      toast.success("Purchase return draft created successfully.");
      navigate("/purchase-returns");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create purchase return.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <button
        onClick={() => navigate("/purchase-returns")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Back to Purchase Returns
      </button>

      <PageHeader title="Create Purchase Return" description="Issue a purchase return draft to send materials back to a supplier." />

      <form onSubmit={submit} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Purchase Order</label>
            <select
              aria-label="Select Purchase Order dropdown"
              value={selectedPOId}
              onChange={(e) => setSelectedPOId(e.target.value)}
              className="h-12 w-full rounded-lg border bg-white px-3"
              disabled={loadingPO}
            >
              <option value="">Select a Purchase Order...</option>
              {pos.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.purchaseOrderNumber} — {po.supplierName} ({new Date(po.orderDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Return Reason *</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Defective materials, incorrect grade"
                className="h-12 w-full rounded-lg border px-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                className="h-12 w-full rounded-lg border px-3"
              />
            </div>
          </div>
        </div>

        {loadingPO && <div className="h-32 animate-pulse rounded-xl bg-slate-100" />}

        {poDetails && !loadingPO && (
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b">
              <h3 className="font-semibold text-slate-800">Purchase Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">
                    <th className="px-6 py-3">Material</th>
                    <th className="px-6 py-3 text-right">Received Qty</th>
                    <th className="px-6 py-3 text-right">Remaining Returnable</th>
                    <th className="px-6 py-3">Return Qty</th>
                    <th className="px-6 py-3">Source Godown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {poDetails.items.map((item: any) => {
                    const retData = returnItems[item.id] || { quantity: 0, godownId: "" };
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{item.materialName}</div>
                          <div className="text-xs text-slate-500">SKU: {item.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {Number(item.receivedQuantity)} {item.unit}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-rose-700">
                          {item.maxReturnable} {item.unit}
                        </td>
                        <td className="px-6 py-4 min-w-[120px]">
                          <input
                            type="number"
                            aria-label={`Return quantity for ${item.materialName}`}
                            min={0}
                            max={item.maxReturnable}
                            value={retData.quantity || ""}
                            onChange={(e) =>
                              handleQtyChange(item.id, Number(e.target.value), item.maxReturnable)
                            }
                            placeholder="0"
                            className="h-10 w-24 rounded border px-2 text-right"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            aria-label={`Source godown for ${item.materialName}`}
                            value={retData.godownId}
                            onChange={(e) => handleGodownChange(item.id, e.target.value)}
                            className="h-10 w-full min-w-[150px] rounded border bg-white px-2"
                          >
                            <option value="">Select Godown...</option>
                            {godowns.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name} ({g.godownCode})
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/purchase-returns")}
            className="h-12 px-6 rounded-lg border font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedPOId}
            className="flex h-12 px-6 items-center gap-2 rounded-lg bg-blue-700 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            <Save size={18} /> Create Draft Return
          </button>
        </div>
      </form>
    </div>
  );
}
