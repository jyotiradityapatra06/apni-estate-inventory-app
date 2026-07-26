import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { 
  FileCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  History, 
  RefreshCw, 
  Truck, 
  Boxes, 
  Building2, 
  FileText, 
  PlusCircle, 
  ShieldAlert,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../../app/components/common/PageHeader";
import { StatCard } from "../../app/components/common/Card";
import { LoadingSkeleton, EmptyState } from "../../app/components/common/FeedbackStates";
import { purchaseApi } from "../../api/purchase.api";
import { godownApi } from "../../api/godown.api";
import type { PurchaseOrder, PurchaseItem } from "./purchase.types";
import type { Godown } from "../../types/godown.types";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import { fmt } from "../../utils/currency";

export function GoodsReceiptPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialPoId = params.get("poId") || "";

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedPoId, setSelectedPoId] = useState(initialPoId);
  const [challanNumber, setChallanNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [itemInputs, setItemInputs] = useState<
    Record<
      string,
      {
        receivedQty: string;
        damagedQty: string;
        godownId: string;
      }
    >
  >({});

  // History Tab & Search
  const [historySearch, setHistorySearch] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  const canManage = hasPermission(user, "purchases:manage");

  const load = () => {
    setLoading(true);
    Promise.all([
      purchaseApi.list(),
      godownApi.getAll().catch(() => ({ data: [] })),
    ])
      .then(([poRes, godownRes]) => {
        if (poRes?.data) setOrders(poRes.data);
        if (godownRes?.data) setGodowns(godownRes.data.filter((g) => g.isActive));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Filter Active POs available for GRN (SENT or PARTIALLY_RECEIVED)
  const activeReceivableOrders = useMemo(
    () => orders.filter((o) => o.status === "SENT" || o.status === "PARTIALLY_RECEIVED"),
    [orders]
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedPoId),
    [orders, selectedPoId]
  );

  // Pre-fill item inputs when selected PO changes
  useEffect(() => {
    if (selectedOrder) {
      const initial: Record<string, { receivedQty: string; damagedQty: string; godownId: string }> = {};
      selectedOrder.items.forEach((item) => {
        const pending = Math.max(0, item.quantity - item.receivedQuantity);
        initial[item.id] = {
          receivedQty: pending > 0 ? String(pending) : "0",
          damagedQty: "0",
          godownId: item.godownId || (godowns[0]?.id || ""),
        };
      });
      setItemInputs(initial);
    }
  }, [selectedOrder, godowns]);

  // Aggregate Receipt History from all POs
  const receiptHistory = useMemo(() => {
    const list: Array<{
      receiptId: string;
      receiptNumber: string;
      receiptDate: string;
      poNumber: string;
      poId: string;
      supplierName: string;
      totalAmount: number;
      recordedBy: string;
      notes?: string | null;
      itemsCount: number;
    }> = [];

    orders.forEach((po) => {
      if (po.receipts && po.receipts.length > 0) {
        po.receipts.forEach((r) => {
          list.push({
            receiptId: r.id,
            receiptNumber: r.receiptNumber,
            receiptDate: r.receiptDate,
            poNumber: po.purchaseOrderNumber,
            poId: po.id,
            supplierName: po.supplierName,
            totalAmount: r.totalAmount,
            recordedBy: (r as any).recordedBy?.name || po.createdBy?.name || "System Admin",
            notes: (r as any).notes || po.notes,
            itemsCount: r.items?.length || po.items.length,
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime());
  }, [orders]);

  const filteredHistory = useMemo(() => {
    return receiptHistory.filter((r) => {
      const q = historySearch.trim().toLowerCase();
      if (!q) return true;
      return (
        r.receiptNumber.toLowerCase().includes(q) ||
        r.poNumber.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
      );
    });
  }, [receiptHistory, historySearch]);

  const handleInputChange = (itemId: string, field: "receivedQty" | "damagedQty" | "godownId", value: string) => {
    setItemInputs((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) {
      toast.error("Please select a Purchase Order.");
      return;
    }

    const itemsToReceive: Array<{
      purchaseOrderItemId: string;
      quantity: number;
      godownId?: string;
    }> = [];

    let totalDamaged = 0;
    let totalShortage = 0;

    for (const item of selectedOrder.items) {
      const input = itemInputs[item.id] || { receivedQty: "0", damagedQty: "0", godownId: item.godownId };
      const recQty = Number(input.receivedQty || 0);
      const damQty = Number(input.damagedQty || 0);
      const pendingQty = Math.max(0, item.quantity - item.receivedQuantity);

      if (damQty > recQty) {
        toast.error(`Damaged quantity cannot exceed received quantity for ${item.materialName}.`);
        return;
      }

      const acceptedQty = Math.max(0, recQty - damQty);
      const shortage = Math.max(0, pendingQty - recQty);

      totalDamaged += damQty;
      totalShortage += shortage;

      if (acceptedQty > 0) {
        itemsToReceive.push({
          purchaseOrderItemId: item.id,
          quantity: acceptedQty,
          godownId: input.godownId || item.godownId,
        });
      }
    }

    if (itemsToReceive.length === 0) {
      toast.error("Accepted stock quantity must be greater than 0 to record a Goods Receipt Note.");
      return;
    }

    setSubmitting(true);
    try {
      const idempotencyKey = `grn-${selectedOrder.id}-${Date.now()}`;
      const noteDetails = [
        challanNumber ? `Challan #: ${challanNumber}` : "",
        totalShortage > 0 ? `Shortage: ${totalShortage} units` : "",
        totalDamaged > 0 ? `Damaged: ${totalDamaged} units` : "",
        remarks ? `Remarks: ${remarks}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      await purchaseApi.receive(selectedOrder.id, {
        idempotencyKey,
        items: itemsToReceive,
        notes: noteDetails || undefined,
      });

      toast.success("Goods Receipt Note (GRN) successfully recorded! Inventory stock updated.");
      setSelectedPoId("");
      setChallanNumber("");
      setRemarks("");
      load();
      setActiveTab("history");
    } catch (err: any) {
      toast.error(err.message || "Failed to record Goods Receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation */}
      <button
        onClick={() => navigate("/purchases")}
        className="flex min-h-9 items-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer dark:text-slate-300 dark:hover:text-orange-400"
      >
        <ArrowLeft size={14} />
        Back to Purchase Orders
      </button>

      {/* Page Header */}
      <PageHeader
        title="Goods Receipt Note (GRN) & Physical Stock Receiving"
        description="Record physically received materials, track partial shipments, shortage & damaged items, and update warehouse stock."
        actions={
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "create"
                  ? "bg-white text-orange-600 shadow-2xs dark:bg-slate-900 dark:text-orange-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Receive Goods (GRN)
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "history"
                  ? "bg-white text-orange-600 shadow-2xs dark:bg-slate-900 dark:text-orange-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              GRN Receipt History ({receiptHistory.length})
            </button>
          </div>
        }
      />

      {/* Tab 1: Create GRN Workflow */}
      {activeTab === "create" && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200 flex items-start gap-3">
            <Truck size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold uppercase tracking-wider block">
                ERP Goods Receiving Rules
              </span>
              <p className="font-medium leading-relaxed">
                Only <strong>Accepted Quantity</strong> (Received Quantity minus Damaged Quantity) increments live inventory stock. Shortages and damaged goods are logged in the GRN audit history without inflating warehouse inventory balances.
              </p>
            </div>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1 & Reference Info Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2 border-b pb-3 dark:border-slate-800">
                <FileCheck size={16} className="text-orange-500" />
                Step 1 — Purchase Order & Delivery Reference
              </h3>

              <div className="grid gap-4 sm:grid-cols-3 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                    Select Purchase Order *
                  </label>
                  <select
                    required
                    value={selectedPoId}
                    onChange={(e) => setSelectedPoId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Select PO (Sent / Partial)...</option>
                    {activeReceivableOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.purchaseOrderNumber} — {o.supplierName} ({o.status.replaceAll("_", " ")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                    Delivery Challan / Invoice #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DC-98421"
                    value={challanNumber}
                    onChange={(e) => setChallanNumber(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                    Internal Remarks / Vehicle #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Driver: Ramesh / MH-04-1234"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Step 2 to 5: Item Line Receiving Breakdown */}
            {selectedOrder && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2">
                    <Boxes size={16} className="text-orange-500" />
                    Step 2 to 5 — Item Shipment Quantities & Warehouse Destination
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    PO Value: <strong>{fmt(selectedOrder.totalAmount)}</strong>
                  </span>
                </div>

                {/* Items Line Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
                      <tr>
                        <th className="px-3.5 py-3 font-black uppercase">Material Item</th>
                        <th className="px-3.5 py-3 font-black uppercase">Ordered</th>
                        <th className="px-3.5 py-3 font-black uppercase">Prev Received</th>
                        <th className="px-3.5 py-3 font-black uppercase">Pending</th>
                        <th className="px-3.5 py-3 font-black uppercase">Received Now *</th>
                        <th className="px-3.5 py-3 font-black uppercase">Damaged</th>
                        <th className="px-3.5 py-3 font-black uppercase">Accepted (Stock)</th>
                        <th className="px-3.5 py-3 font-black uppercase">Shortage</th>
                        <th className="px-3.5 py-3 font-black uppercase">Target Godown</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => {
                        const input = itemInputs[item.id] || {
                          receivedQty: "0",
                          damagedQty: "0",
                          godownId: item.godownId,
                        };
                        const pendingQty = Math.max(0, item.quantity - item.receivedQuantity);
                        const recQty = Number(input.receivedQty || 0);
                        const damQty = Number(input.damagedQty || 0);
                        const acceptedQty = Math.max(0, recQty - damQty);
                        const shortageQty = Math.max(0, pendingQty - recQty);

                        return (
                          <tr
                            key={item.id}
                            className="border-b last:border-0 border-slate-100 dark:border-slate-800 font-semibold"
                          >
                            <td className="px-3.5 py-3.5">
                              <strong className="text-slate-900 dark:text-slate-100 block">{item.materialName}</strong>
                              <span className="text-[10px] text-slate-400">{item.sku}</span>
                            </td>
                            <td className="px-3.5 py-3.5 text-slate-700 dark:text-slate-300">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-400">
                              {item.receivedQuantity} {item.unit}
                            </td>
                            <td className="px-3.5 py-3.5 font-bold text-amber-800 dark:text-amber-300">
                              {pendingQty} {item.unit}
                            </td>
                            <td className="px-3.5 py-3.5">
                              <input
                                type="number"
                                min="0"
                                max={pendingQty}
                                step="any"
                                value={input.receivedQty}
                                onChange={(e) => handleInputChange(item.id, "receivedQty", e.target.value)}
                                className="w-24 h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              />
                            </td>
                            <td className="px-3.5 py-3.5">
                              <input
                                type="number"
                                min="0"
                                max={recQty}
                                step="any"
                                value={input.damagedQty}
                                onChange={(e) => handleInputChange(item.id, "damagedQty", e.target.value)}
                                className="w-20 h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              />
                            </td>
                            <td className="px-3.5 py-3.5">
                              <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {acceptedQty} {item.unit}
                              </span>
                            </td>
                            <td className="px-3.5 py-3.5">
                              {shortageQty > 0 ? (
                                <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  {shortageQty} {item.unit} Short
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">None</span>
                              )}
                            </td>
                            <td className="px-3.5 py-3.5">
                              <select
                                value={input.godownId}
                                onChange={(e) => handleInputChange(item.id, "godownId", e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              >
                                {godowns.map((g) => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Submit Action Bar */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-11 rounded-xl bg-orange-600 hover:bg-orange-700 px-6 text-xs font-extrabold text-white shadow-2xs transition-colors cursor-pointer dark:bg-orange-600 dark:hover:bg-orange-500 disabled:opacity-50"
                  >
                    {submitting ? "Posting Goods Receipt..." : "Confirm & Post Goods Receipt Note"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Goods Receipt History Audit Log */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider dark:text-slate-100 flex items-center gap-2">
                <History size={16} className="text-orange-500" />
                Goods Receipt Notes (GRN) Audit Trail History ({filteredHistory.length})
              </h3>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search GRN #, PO #, Supplier..."
                  className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <EmptyState
                title="No Goods Receipt Notes Found"
                description="No historical GRN records match your search filter."
              />
            ) : (
              <>
                {/* Desktop History Table */}
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3.5 font-black uppercase">GRN Number</th>
                        <th className="px-4 py-3.5 font-black uppercase">PO Number</th>
                        <th className="px-4 py-3.5 font-black uppercase">Supplier Name</th>
                        <th className="px-4 py-3.5 font-black uppercase">Receipt Date</th>
                        <th className="px-4 py-3.5 font-black uppercase">Total Value</th>
                        <th className="px-4 py-3.5 font-black uppercase">Recorded By</th>
                        <th className="px-4 py-3.5 font-black uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((r) => (
                        <tr
                          key={r.receiptId}
                          className="border-b last:border-0 border-slate-100 hover:bg-slate-50/70 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50 font-semibold"
                        >
                          <td className="px-4 py-3.5 font-mono text-slate-900 font-extrabold dark:text-slate-100">
                            {r.receiptNumber}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-bold">
                            <Link to={`/purchases/${r.poId}`} className="hover:text-orange-600">
                              {r.poNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200">
                            {r.supplierName}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                            {new Date(r.receiptDate).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-4 py-3.5 font-black text-slate-900 dark:text-slate-100">
                            {fmt(r.totalAmount)}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-semibold">
                            {r.recordedBy}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Link
                              to={`/purchases/${r.poId}`}
                              className="text-xs font-extrabold text-orange-600 hover:underline dark:text-orange-400"
                            >
                              View PO →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile History Card List */}
                <div className="grid gap-3.5 md:hidden">
                  {filteredHistory.map((r) => (
                    <div
                      key={r.receiptId}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 font-mono dark:text-slate-100">
                          {r.receiptNumber}
                        </span>
                        <strong className="text-slate-900 font-black dark:text-slate-100">
                          {fmt(r.totalAmount)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>PO: {r.poNumber}</span>
                        <span>{r.supplierName}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Received on {new Date(r.receiptDate).toLocaleDateString("en-IN")} by {r.recordedBy}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GoodsReceiptPage;
