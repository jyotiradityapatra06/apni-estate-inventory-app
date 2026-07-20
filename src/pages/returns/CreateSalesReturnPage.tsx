import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import invoiceApi from "../../api/invoice.api";
import { salesReturnApi } from "../../api/salesReturn.api";
import { godownApi } from "../../api/godown.api";
import { PageHeader } from "../../app/components/common/PageHeader";

export default function CreateSalesReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryInvoiceId = searchParams.get("invoiceId") || "";

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(queryInvoiceId);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [godowns, setGodowns] = useState<any[]>([]);
  
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  
  const [returnItems, setReturnItems] = useState<Record<string, { quantity: number; godownId: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    // Fetch all issued invoices
    invoiceApi.getAll().then((res) => {
      setInvoices(res.data.filter((x: any) => x.status === "ISSUED"));
    });
    // Fetch active godowns
    godownApi.getAll().then((res) => {
      setGodowns(res.data.filter((x: any) => x.isActive));
    });
  }, []);

  useEffect(() => {
    if (selectedInvoiceId) {
      void loadInvoiceDetails(selectedInvoiceId);
    } else {
      setInvoiceDetails(null);
      setReturnItems({});
    }
  }, [selectedInvoiceId]);

  const loadInvoiceDetails = async (id: string) => {
    setLoadingInvoice(true);
    try {
      const res = await invoiceApi.getById(id);
      
      // Fetch completed returns to compute remaining quantities
      const retListRes = await salesReturnApi.list(`invoiceId=${id}`);
      const returnedMap: Record<string, number> = {};
      for (const r of retListRes.data) {
        if (r.status === "COMPLETED") {
          for (const item of r.items) {
            returnedMap[item.invoiceItemId] = (returnedMap[item.invoiceItemId] || 0) + Number(item.quantity);
          }
        }
      }

      // Initialize return quantities
      const initialItems: Record<string, { quantity: number; godownId: string }> = {};
      const mainGodown = godowns.find((g) => g.godownCode === "MAIN") || godowns[0];
      const defaultGodownId = mainGodown?.id || "";

      const itemsWithMax = res.data.items.map((item: any) => {
        const returnedQty = returnedMap[item.id] || 0;
        const maxReturn = Number(item.quantity) - returnedQty;
        initialItems[item.id] = {
          quantity: 0,
          godownId: defaultGodownId,
        };
        return {
          ...item,
          maxReturnable: maxReturn,
        };
      });

      setInvoiceDetails({ ...res.data, items: itemsWithMax });
      setReturnItems(initialItems);
    } catch (e) {
      toast.error("Failed to load invoice items details.");
    } finally {
      setLoadingInvoice(false);
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
    if (!selectedInvoiceId) return toast.error("Please select an invoice.");
    if (!reason.trim()) return toast.error("Please provide a return reason.");

    const items = Object.entries(returnItems)
      .filter(([_, data]) => data.quantity > 0)
      .map(([invoiceItemId, data]) => ({
        invoiceItemId,
        quantity: data.quantity,
        godownId: data.godownId,
      }));

    if (items.length === 0) {
      return toast.error("Please specify return quantities for at least one item.");
    }

    setSubmitting(true);
    try {
      await salesReturnApi.create({
        invoiceId: selectedInvoiceId,
        reason,
        notes,
        idempotencyKey: crypto.randomUUID(),
        items,
      });
      toast.success("Sales return draft created successfully.");
      navigate("/sales-returns");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create sales return.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <button
        onClick={() => navigate("/sales-returns")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Back to Sales Returns
      </button>

      <PageHeader title="Create Sales Return" description="Issue a credit return draft against an issued invoice." />

      <form onSubmit={submit} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Invoice</label>
            <select
              aria-label="Select invoice select"
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="h-12 w-full rounded-lg border bg-white px-3"
              disabled={loadingInvoice}
            >
              <option value="">Select an Invoice...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerName} ({new Date(inv.invoiceDate).toLocaleDateString()})
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
                placeholder="e.g. Damaged during transport, incorrect item"
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

        {loadingInvoice && <div className="h-32 animate-pulse rounded-xl bg-slate-100" />}

        {invoiceDetails && !loadingInvoice && (
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b">
              <h3 className="font-semibold text-slate-800">Invoice Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">
                    <th className="px-6 py-3">Material</th>
                    <th className="px-6 py-3 text-right">Sold Qty</th>
                    <th className="px-6 py-3 text-right">Remaining Returnable</th>
                    <th className="px-6 py-3">Return Qty</th>
                    <th className="px-6 py-3">Destination Godown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceDetails.items.map((item: any) => {
                    const retData = returnItems[item.id] || { quantity: 0, godownId: "" };
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{item.materialName}</div>
                          <div className="text-xs text-slate-500">SKU: {item.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {Number(item.quantity)} {item.unit}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-amber-700">
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
                            aria-label={`Destination godown for ${item.materialName}`}
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
            onClick={() => navigate("/sales-returns")}
            className="h-12 px-6 rounded-lg border font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedInvoiceId}
            className="flex h-12 px-6 items-center gap-2 rounded-lg bg-blue-700 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            <Save size={18} /> Create Draft Return
          </button>
        </div>
      </form>
    </div>
  );
}
