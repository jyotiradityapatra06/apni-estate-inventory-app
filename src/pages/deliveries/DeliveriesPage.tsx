import { useState, useEffect } from "react";
import { Plus, ClipboardList, X } from "lucide-react";
import { toast } from "sonner";

import { C } from "../../constants/colors";
import { Badge } from "../../app/components/common/Badge";
import { Card } from "../../app/components/common/Card";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { Divider } from "../../app/components/common/Divider";

import { useAuth } from "../../hooks/useAuth";
import { useGetInventory } from "../../hooks/useInventory";
import { hasPermission, hasRole } from "../../utils/permissions";
import { notificationApi } from "../../api/notification.api";

export interface LocalDelivery {
  id: string;
  deliveryNumber: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress: string;
  materialName: string;
  quantity: number;
  unit: string;
  scheduledDate?: string | null;
  notes?: string | null;
  status: "PENDING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  paymentStatus: "PENDING" | "RECEIVED";
  createdAt: string;
}

const statusMeta: Record<string, { label: string; bg: string; color: string; variant: "warning" | "success" | "danger" | "info" | "neutral" }> = {
  PENDING: { label: "Pending", bg: "#FEF3C7", color: "#D97706", variant: "warning" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", bg: "#E0F2FE", color: "#0284C7", variant: "info" },
  DELIVERED: { label: "Delivered", bg: "#D1FAE5", color: "#059669", variant: "success" },
};

const payStatusMeta: Record<string, { label: string; bg: string; color: string; variant: "warning" | "success" | "danger" | "info" | "neutral" }> = {
  PENDING: { label: "Payment Pending", bg: "#FEE2E2", color: "#DC2626", variant: "danger" },
  RECEIVED: { label: "Payment Received", bg: "#D1FAE5", color: "#059669", variant: "success" },
};

export const DeliveriesPage = () => {
  const { user } = useAuth();
  const canManageDeliveries =
    hasRole(user, ["OWNER", "MANAGER"]) ||
    hasPermission(user, "deliveries:manage");

  // Filter & Data States
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [deliveries, setDeliveries] = useState<LocalDelivery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal / Form States
  const [showCreate, setShowCreate] = useState<boolean>(false);

  // Form inputs (Create)
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [materialName, setMaterialName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("Bags");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch lists
  const { data: stockItems } = useGetInventory();

  // Handle body scroll locking
  useEffect(() => {
    if (showCreate) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreate]);

  // Load from localStorage
  useEffect(() => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("apni_deliveries");
      if (stored) {
        const parsed: LocalDelivery[] = JSON.parse(stored);
        const normalized = parsed.map(d => ({
          ...d,
          status: (d.status as string === "ASSIGNED" || d.status as string === "CANCELLED" || !statusMeta[d.status]) ? "PENDING" as const : d.status,
          paymentStatus: d.paymentStatus || "PENDING",
        }));
        setDeliveries(normalized);
        if (normalized.length > 0) {
          setSelectedId(normalized[0].id);
        }
      } else {
        setDeliveries([]);
      }
    } catch (err) {
      console.error("Failed to load local deliveries", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for trigger queries from Dashboard quick actions
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("action") === "new-delivery") {
      setShowCreate(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Filter deliveries client-side
  const filteredDeliveries = deliveries.filter(d => {
    if (activeStatus === "ALL") return true;
    if (activeStatus === "PAYMENT_PENDING") return d.paymentStatus === "PENDING";
    return d.status === activeStatus;
  });

  const saveDeliveries = (newDeliveries: LocalDelivery[]) => {
    setDeliveries(newDeliveries);
    localStorage.setItem("apni_deliveries", JSON.stringify(newDeliveries));
  };

  // Submit handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName) {
      toast.error("Please select a material.");
      return;
    }
    if (Number(quantity) <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }

    const newDelivery: LocalDelivery = {
      id: Math.random().toString(36).substring(2, 9),
      deliveryNumber: `DEL-${Date.now().toString().slice(-5)}`,
      customerName,
      customerPhone: customerPhone || null,
      deliveryAddress,
      materialName,
      quantity: Number(quantity),
      unit,
      scheduledDate: scheduledDate || null,
      notes: notes || null,
      status: "PENDING",
      paymentStatus: "PENDING",
      createdAt: new Date().toISOString(),
    };

    const updated = [newDelivery, ...deliveries];
    saveDeliveries(updated);
    setSelectedId(newDelivery.id);
    toast.success("Delivery scheduled successfully!");
    setShowCreate(false);

    // Create Notification on Backend
    try {
      await notificationApi.createNotification(
        "Delivery Scheduled",
        `New shipment ${newDelivery.deliveryNumber} scheduled for ${newDelivery.customerName} (${newDelivery.quantity} ${newDelivery.unit} of ${newDelivery.materialName}).`
      );
    } catch (err) {
      console.error("Failed to generate delivery creation notification:", err);
    }

    // Reset Form
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    setMaterialName("");
    setQuantity("");
    setUnit("Bags");
    setScheduledDate("");
    setNotes("");
  };

  const handleStatusUpdate = async (id: string, nextStatus: LocalDelivery["status"]) => {
    const updated = deliveries.map(d => {
      if (d.id === id) {
        return { ...d, status: nextStatus };
      }
      return d;
    });
    saveDeliveries(updated);
    toast.success(`Delivery status updated to ${statusMeta[nextStatus]?.label || nextStatus}`);

    const activeDel = deliveries.find(d => d.id === id);
    if (activeDel) {
      try {
        const title = nextStatus === "OUT_FOR_DELIVERY" ? "Out for Delivery" : "Delivery Completed";
        const desc = nextStatus === "OUT_FOR_DELIVERY" 
          ? `Shipment ${activeDel.deliveryNumber} to ${activeDel.customerName} is now out for delivery.`
          : `Shipment ${activeDel.deliveryNumber} has been delivered successfully to ${activeDel.customerName}.`;
        await notificationApi.createNotification(title, desc);
      } catch (err) {
        console.error("Failed to log status notification:", err);
      }
    }
  };

  const handlePaymentUpdate = async (id: string, nextPayStatus: LocalDelivery["paymentStatus"]) => {
    const updated = deliveries.map(d => {
      if (d.id === id) {
        return { ...d, paymentStatus: nextPayStatus };
      }
      return d;
    });
    saveDeliveries(updated);
    toast.success(`Payment status updated to ${payStatusMeta[nextPayStatus]?.label || nextPayStatus}`);

    const activeDel = deliveries.find(d => d.id === id);
    if (activeDel && nextPayStatus === "RECEIVED") {
      try {
        await notificationApi.createNotification(
          "Payment Received",
          `Payment for shipment ${activeDel.deliveryNumber} (${activeDel.customerName}) has been marked as RECEIVED.`
        );
      } catch (err) {
        console.error("Failed to log payment status notification:", err);
      }
    }
  };

  const handleDeleteDelivery = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this delivery? This action is permanent.")) return;
    const updated = deliveries.filter(d => d.id !== id);
    saveDeliveries(updated);
    toast.success("Delivery deleted successfully.");
    setSelectedId(updated.length > 0 ? updated[0].id : null);
  };

  const active = filteredDeliveries.find(d => d.id === selectedId) || filteredDeliveries[0];

  return (
    <div className="flex flex-col gap-0 pb-4 h-full">
      {/* Mobile Top Header */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[11px] uppercase tracking-wider font-semibold">Logistics</div>
            <div className="text-white text-lg font-bold">Deliveries</div>
          </div>
          {canManageDeliveries && (
            <button
              onClick={() => setShowCreate(true)}
              style={{ background: "rgba(255,255,255,0.2)" }}
              className="p-2 rounded-lg flex items-center justify-center cursor-pointer text-white"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="px-1 md:px-0 py-4 flex flex-col gap-4 flex-1">
        {/* Desktop Toolbar */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 style={{ color: C.ink }} className="text-lg font-bold">Deliveries</h1>
            {/* Status Tabs */}
            <div className="flex gap-1 bg-black/[0.03] p-0.5 rounded-lg border border-[rgba(20,18,14,0.06)]">
              {["ALL", "PENDING", "OUT_FOR_DELIVERY", "DELIVERED", "PAYMENT_PENDING"].map((st) => (
                <button
                  key={st}
                  onClick={() => setActiveStatus(st)}
                  style={{
                    background: activeStatus === st ? C.white : "transparent",
                    color: activeStatus === st ? C.blue : C.muted,
                    boxShadow: activeStatus === st ? "0 1px 3px 0 rgba(0, 0, 0, 0.05)" : "none",
                  }}
                  className="px-3 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-all"
                >
                  {st === "ALL" ? "All" : st === "PAYMENT_PENDING" ? "Payment Pending" : statusMeta[st]?.label || st}
                </button>
              ))}
            </div>
          </div>
          {canManageDeliveries && (
            <button
              onClick={() => setShowCreate(true)}
              style={{ background: C.blue }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg cursor-pointer text-white text-xs font-semibold hover:opacity-95"
            >
              <Plus size={14} color="white" />
              <span>New Delivery</span>
            </button>
          )}
        </div>

        {/* Mobile Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap py-1 md:hidden scrollbar-none">
          {["ALL", "PENDING", "OUT_FOR_DELIVERY", "DELIVERED", "PAYMENT_PENDING"].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              style={{
                background: activeStatus === st ? C.blue : C.white,
                color: activeStatus === st ? "white" : C.muted,
                border: `1px solid ${activeStatus === st ? C.blue : C.border}`,
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all"
            >
              {st === "ALL" ? "All" : st === "PAYMENT_PENDING" ? "Pay Pending" : statusMeta[st]?.label || st}
            </button>
          ))}
        </div>

        {/* Main Content Layout */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white border border-[rgba(20,18,14,0.1)] rounded-xl gap-2">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            <span style={{ color: C.muted }} className="text-xs font-semibold">Loading deliveries...</span>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-[rgba(20,18,14,0.1)] rounded-xl h-64 border-dashed">
            <div style={{ background: "rgba(42,76,214,0.05)" }} className="w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <ClipboardList size={22} color={C.blue} />
            </div>
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-1">No deliveries found</div>
            <div style={{ color: C.muted }} className="text-xs max-w-xs mb-4">
              {activeStatus === "ALL" ? "Create your first delivery to start dispatch operations." : "No matching deliveries found."}
            </div>
            {canManageDeliveries && activeStatus === "ALL" && (
              <button
                onClick={() => setShowCreate(true)}
                style={{ background: C.blue }}
                className="px-4 py-2 rounded-lg text-white font-semibold text-xs cursor-pointer"
              >
                Create Delivery
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* Left Column: Delivery pipeline */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <SectionLabel>{filteredDeliveries.length} deliveries</SectionLabel>
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {filteredDeliveries.map(d => {
                  const meta = statusMeta[d.status] || statusMeta.PENDING;
                  const isSel = selectedId === d.id;
                  const payMeta = payStatusMeta[d.paymentStatus || "PENDING"] || payStatusMeta.PENDING;
                  return (
                    <div
                      key={d.id}
                      style={{
                        background: C.white,
                        border: `1.5px solid ${isSel ? C.blue : C.border}`,
                        borderRadius: 12,
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.02)"
                      }}
                      className="overflow-hidden cursor-pointer hover:bg-black/[0.01] transition-colors"
                      onClick={() => setSelectedId(d.id)}
                    >
                      <div className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex gap-1.5 flex-wrap">
                            <span style={{ background: meta.bg, color: meta.color }} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-semibold">
                              {meta.label}
                            </span>
                            <span style={{ background: payMeta.bg, color: payMeta.color }} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-semibold">
                              {payMeta.label}
                            </span>
                          </div>
                          <span style={{ color: C.muted, fontFamily: "'Space Grotesk'" }} className="text-[10px] font-bold">
                            {d.deliveryNumber}
                          </span>
                        </div>
                        <div style={{ color: C.ink }} className="text-[13px] font-bold">{d.customerName}</div>
                        <div style={{ color: C.muted }} className="text-[11px] mt-0.5">{d.materialName} · {d.quantity} {d.unit}</div>
                        <div style={{ color: C.muted }} className="text-[11px] truncate">{d.deliveryAddress}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active details pane */}
            <div className="hidden lg:flex lg:col-span-7 flex-col gap-3">
              <SectionLabel>Delivery Details</SectionLabel>
              {active ? (
                <Card className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-base font-bold">{active.deliveryNumber}</span>
                        <Badge label={(statusMeta[active.status] || statusMeta.PENDING).label} variant={(statusMeta[active.status] || statusMeta.PENDING).variant} />
                        <Badge label={(payStatusMeta[active.paymentStatus || "PENDING"] || payStatusMeta.PENDING).label} variant={(payStatusMeta[active.paymentStatus || "PENDING"] || payStatusMeta.PENDING).variant} />
                      </div>
                      <p style={{ color: C.muted }} className="text-[10px] mt-1">Created on {new Date(active.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {canManageDeliveries && active.status === "PENDING" && (
                      <button
                        onClick={() => handleDeleteDelivery(active.id)}
                        style={{ border: `1.5px solid ${C.error}30`, color: C.error }}
                        className="px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer hover:bg-red-50"
                      >
                        Delete Delivery
                      </button>
                    )}
                  </div>

                  <Divider />

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Customer Name</span>
                      <span style={{ color: C.ink }} className="font-semibold">{active.customerName}</span>
                    </div>
                    <div>
                      <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Contact Phone</span>
                      <span style={{ color: C.ink }} className="font-semibold">{active.customerPhone || "Not provided"}</span>
                    </div>
                    <div className="col-span-2">
                      <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Delivery Address</span>
                      <span style={{ color: C.ink }} className="font-semibold">{active.deliveryAddress}</span>
                    </div>
                  </div>

                  <Divider />

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Material</span>
                      <span style={{ color: C.ink }} className="font-semibold">{active.materialName}</span>
                    </div>
                    <div>
                      <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Quantity</span>
                      <span style={{ color: C.ink }} className="font-semibold">{active.quantity.toLocaleString("en-IN")} {active.unit}</span>
                    </div>
                    <div>
                      <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Scheduled Date</span>
                      <span style={{ color: C.ink }} className="font-semibold">
                        {active.scheduledDate ? new Date(active.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Immediate"}
                      </span>
                    </div>
                  </div>

                  {active.notes && (
                    <>
                      <Divider />
                      <div className="text-xs">
                        <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Dispatch Note</span>
                        <p style={{ color: C.ink }} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">{active.notes}</p>
                      </div>
                    </>
                  )}

                  {canManageDeliveries && (
                    <>
                      <Divider />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span style={{ color: C.muted }} className="text-[10px] uppercase font-bold tracking-wider">Update Delivery Status</span>
                          <select
                            value={active.status}
                            onChange={(e) => handleStatusUpdate(active.id, e.target.value as LocalDelivery["status"])}
                            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                            className="px-3 py-1.5 rounded-lg text-xs outline-none font-semibold cursor-pointer w-full"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                            <option value="DELIVERED">Delivered</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span style={{ color: C.muted }} className="text-[10px] uppercase font-bold tracking-wider">Update Payment Status</span>
                          <select
                            value={active.paymentStatus}
                            onChange={(e) => handlePaymentUpdate(active.id, e.target.value as LocalDelivery["paymentStatus"])}
                            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                            className="px-3 py-1.5 rounded-lg text-xs outline-none font-semibold cursor-pointer w-full"
                          >
                            <option value="PENDING">Payment Pending</option>
                            <option value="RECEIVED">Payment Received</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              ) : (
                <Card className="p-8 text-center border-dashed">
                  <span style={{ color: C.muted }} className="text-xs">Select a delivery to view full logs and update statuses.</span>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE ONLY DETAIL SHEET (Overlay) */}
      {!loading && active && selectedId && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSelectedId(null)}>
          <div
            style={{ background: C.white }}
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-5 max-h-[85%] overflow-y-auto flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-base font-bold">{active.deliveryNumber}</span>
                <Badge label={(statusMeta[active.status] || statusMeta.PENDING).label} variant={(statusMeta[active.status] || statusMeta.PENDING).variant} />
                <Badge label={(payStatusMeta[active.paymentStatus || "PENDING"] || payStatusMeta.PENDING).label} variant={(payStatusMeta[active.paymentStatus || "PENDING"] || payStatusMeta.PENDING).variant} />
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1 rounded-full bg-slate-100 text-gray-500 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <Divider />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Customer Name</span>
                <span style={{ color: C.ink }} className="font-semibold">{active.customerName}</span>
              </div>
              <div>
                <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Phone</span>
                <span style={{ color: C.ink }} className="font-semibold">{active.customerPhone || "Not set"}</span>
              </div>
              <div className="col-span-2">
                <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Address</span>
                <span style={{ color: C.ink }} className="font-semibold">{active.deliveryAddress}</span>
              </div>
            </div>

            <Divider />

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Material</span>
                <span style={{ color: C.ink }} className="font-semibold">{active.materialName}</span>
              </div>
              <div>
                <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Quantity</span>
                <span style={{ color: C.ink }} className="font-semibold">{active.quantity} {active.unit}</span>
              </div>
              <div>
                <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Schedule</span>
                <span style={{ color: C.ink }} className="font-semibold">
                  {active.scheduledDate ? new Date(active.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Immediate"}
                </span>
              </div>
            </div>

            {active.notes && (
              <>
                <Divider />
                <div className="text-xs">
                  <span style={{ color: C.muted }} className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Notes</span>
                  <p style={{ color: C.ink }} className="bg-slate-50 p-2 border border-slate-100 rounded italic">{active.notes}</p>
                </div>
              </>
            )}

            {canManageDeliveries && (
              <>
                <Divider />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span style={{ color: C.muted }} className="text-[10px] uppercase font-bold tracking-wider">Update Delivery Status</span>
                    <select
                      value={active.status}
                      onChange={(e) => handleStatusUpdate(active.id, e.target.value as LocalDelivery["status"])}
                      style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                      className="px-3 py-1.5 rounded-lg text-xs outline-none font-semibold cursor-pointer w-full"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span style={{ color: C.muted }} className="text-[10px] uppercase font-bold tracking-wider">Update Payment Status</span>
                    <select
                      value={active.paymentStatus}
                      onChange={(e) => handlePaymentUpdate(active.id, e.target.value as LocalDelivery["paymentStatus"])}
                      style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                      className="px-3 py-1.5 rounded-lg text-xs outline-none font-semibold cursor-pointer w-full"
                    >
                      <option value="PENDING">Payment Pending</option>
                      <option value="RECEIVED">Payment Received</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {canManageDeliveries && active.status === "PENDING" && (
              <button
                onClick={() => handleDeleteDelivery(active.id)}
                style={{ background: "#FEF2F2", color: C.error }}
                className="w-full py-3 rounded-xl font-bold text-xs cursor-pointer mt-1"
              >
                Delete Delivery (Permanent)
              </button>
            )}
          </div>
        </div>
      )}

      {/* DIALOG: NEW DELIVERY FORM */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" style={{ zIndex: 100 }}>
          <div style={{ background: C.white, borderRadius: 16 }} className="w-full max-w-sm p-5 flex flex-col gap-4 overflow-y-auto max-h-[90%]">
            <div className="flex items-center justify-between">
              <span style={{ color: C.ink }} className="text-base font-bold">New Delivery</span>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700 text-lg font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3.5 text-xs font-medium">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Infra Pvt Ltd"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Customer Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 00002"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Scheduled Date (Optional)</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Delivery Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 43, Sector 5, Pimpri, Pune"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Select Material</label>
                <select
                  required
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- Choose Material --</option>
                  {stockItems.map(item => (
                    <option key={item.id} value={item.materialName}>{item.materialName} ({item.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] uppercase">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bags"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Dispatch Note (Optional)</label>
                <textarea
                  placeholder="e.g. Gate clearance needed, ask for Vikram at warehouse"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-16"
                />
              </div>

              <button
                type="submit"
                style={{ background: C.blue }}
                className="w-full mt-2 py-3 rounded-xl text-white font-bold cursor-pointer hover:opacity-95"
              >
                Schedule Delivery
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default DeliveriesPage;
