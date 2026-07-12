import { useState, useEffect } from "react";
import { ArrowLeft, AlertTriangle, Truck, User, Users, Phone, AlertCircle, CheckCircle, X, Plus, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";

import { C } from "../../constants/colors";
import { Badge } from "../../app/components/common/Badge";
import { Card } from "../../app/components/common/Card";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { Divider } from "../../app/components/common/Divider";

import { useAuth } from "../../hooks/useAuth";
import { useGetInventory } from "../../hooks/useInventory";
import { teamApi, Worker } from "../../api/team.api";
import { deliveryApi, DeliveryData } from "../../api/delivery.api";
import { hasPermission, hasRole } from "../../utils/permissions";

const statusMeta: Record<string, { label: string; bg: string; color: string; variant: "warning" | "success" | "danger" | "info" | "neutral" }> = {
  PENDING: { label: "Pending", bg: "#FEF3C7", color: "#D97706", variant: "warning" },
  ASSIGNED: { label: "Assigned", bg: "#DBEAFE", color: "#2563EB", variant: "info" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", bg: "#E0F2FE", color: "#0284C7", variant: "info" },
  DELIVERED: { label: "Delivered", bg: "#D1FAE5", color: "#059669", variant: "success" },
  CANCELLED: { label: "Cancelled", bg: "#FEE2E2", color: "#DC2626", variant: "danger" },
};

export const DeliveriesPage = () => {
  const { user } = useAuth();
  const canManageDeliveries =
    hasRole(user, ["OWNER", "MANAGER"]) ||
    hasPermission(user, "deliveries:manage");

  // Filter & Data States
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal / Form States
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showAssign, setShowAssign] = useState<boolean>(false);

  // Form inputs (Create)
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [materialName, setMaterialName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("Bags");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Form inputs (Assign)
  const [assignedDriverId, setAssignedDriverId] = useState<string>("");
  const [assignedVehicleNumber, setAssignedVehicleNumber] = useState<string>("");
  const [drivers, setDrivers] = useState<Worker[]>([]);

  // Fetch lists
  const { data: stockItems } = useGetInventory();

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getDeliveries(activeStatus);
      if (res.success) {
        setDeliveries(res.data);
        if (res.data.length > 0 && !selectedId) {
          setSelectedId(res.data[0].id);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch deliveries");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await teamApi.getTeam({ role: "DRIVER" });
      if (res.success) {
        setDrivers(res.data.workers.filter(w => w.isActive));
      }
    } catch (err: any) {
      console.error("Failed to fetch drivers:", err);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [activeStatus]);

  useEffect(() => {
    if (showAssign) {
      fetchDrivers();
    }
  }, [showAssign]);

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

    try {
      const res = await deliveryApi.createDelivery({
        customerName,
        customerPhone: customerPhone || null,
        deliveryAddress,
        materialName,
        quantity: Number(quantity),
        unit,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        notes: notes || null,
      });

      if (res.success) {
        toast.success("Delivery scheduled successfully!");
        setShowCreate(false);
        // Clear form
        setCustomerName("");
        setCustomerPhone("");
        setDeliveryAddress("");
        setMaterialName("");
        setQuantity("");
        setUnit("Bags");
        setScheduledDate("");
        setNotes("");
        // Reload
        fetchDeliveries();
        if (res.data) setSelectedId(res.data.id);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to schedule delivery");
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!assignedDriverId) {
      toast.error("Please select a driver.");
      return;
    }
    if (!assignedVehicleNumber.trim()) {
      toast.error("Please enter a vehicle number.");
      return;
    }

    try {
      const res = await deliveryApi.assignDriver(selectedId, assignedDriverId, assignedVehicleNumber);
      if (res.success) {
        toast.success("Driver and vehicle assigned successfully!");
        setShowAssign(false);
        setAssignedDriverId("");
        setAssignedVehicleNumber("");
        fetchDeliveries();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign driver");
    }
  };

  const handleCancelDelivery = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this delivery?")) return;
    try {
      const res = await deliveryApi.updateStatus(id, "CANCELLED");
      if (res.success) {
        toast.success("Delivery cancelled successfully.");
        fetchDeliveries();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel delivery");
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this delivery? This action is permanent.")) return;
    try {
      const res = await deliveryApi.deleteDelivery(id);
      toast.success("Delivery deleted successfully.");
      setSelectedId(null);
      fetchDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete delivery");
    }
  };

  const active = deliveries.find(d => d.id === selectedId) || deliveries[0];

  return (
    <div className="flex flex-col gap-0 pb-4 h-full">
      {/* Mobile Top Header */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[11px] uppercase tracking-wider">Logistics</div>
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
              {["ALL", "PENDING", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((st) => (
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
                  {st === "ALL" ? "All" : statusMeta[st]?.label || st}
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
          {["ALL", "PENDING", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((st) => (
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
              {st === "ALL" ? "All" : statusMeta[st]?.label || st}
            </button>
          ))}
        </div>

        {/* Main Content Layout */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white border border-[rgba(20,18,14,0.1)] rounded-xl gap-2">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            <span style={{ color: C.muted }} className="text-xs font-semibold">Loading deliveries...</span>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-[rgba(20,18,14,0.1)] rounded-xl h-64 border-dashed">
            <div style={{ background: "rgba(42,76,214,0.05)" }} className="w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <Truck size={22} color={C.blue} />
            </div>
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-1">No deliveries found</div>
            <div style={{ color: C.muted }} className="text-xs max-w-xs mb-4">
              {activeStatus === "ALL" ? "Create your first delivery to start tracking trips." : `No deliveries currently set as ${statusMeta[activeStatus]?.label || activeStatus}.`}
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
              <SectionLabel>{deliveries.length} active deliveries</SectionLabel>
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {deliveries.map(d => {
                  const meta = statusMeta[d.status];
                  const isSel = selectedId === d.id;
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
                          <span style={{ background: meta.bg, color: meta.color }} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            {meta.label}
                          </span>
                          <span style={{ color: C.muted, fontFamily: "'Space Grotesk'" }} className="text-[10px] font-bold">
                            {d.deliveryNumber}
                          </span>
                        </div>
                        <div style={{ color: C.ink }} className="text-[13px] font-bold">{d.customerName}</div>
                        <div style={{ color: C.muted }} className="text-[11px] mt-0.5">{d.materialName} · {d.quantity} {d.unit}</div>
                        <div style={{ color: C.muted }} className="text-[11px] truncate">{d.deliveryAddress}</div>
                        
                        {d.driver ? (
                          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[rgba(20,18,14,0.04)]">
                            <User size={10} color={C.muted} />
                            <span style={{ color: C.muted }} className="text-[11px]">
                              {d.driver.name} · <span className="font-semibold text-gray-700">{d.vehicleNumber}</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-[rgba(20,18,14,0.04)]">
                            <AlertCircle size={10} color={C.error} />
                            <span style={{ color: C.error }} className="text-[10px] font-semibold">No driver assigned</span>
                          </div>
                        )}
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
                      <div className="flex items-center gap-2">
                        <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-base font-bold">{active.deliveryNumber}</span>
                        <Badge label={statusMeta[active.status].label} variant={statusMeta[active.status].variant} />
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

                  <Divider />

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
                    <span style={{ color: C.ink }} className="text-xs font-bold uppercase tracking-wide">Driver & Vehicle Assignment</span>
                    {active.driver ? (
                      <div className="flex items-center gap-4 text-xs">
                        <div style={{ background: "rgba(42,76,214,0.08)" }} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Truck size={18} color={C.blue} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ color: C.ink }} className="font-bold">{active.driver.name}</div>
                          <div style={{ color: C.muted }} className="text-[11px] mt-0.5">Phone: {active.driver.phone || "Not set"}</div>
                        </div>
                        <div className="text-right">
                          <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="text-xs font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            {active.vehicleNumber}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span style={{ color: C.muted }} className="text-xs">No driver assigned to this trip.</span>
                        {canManageDeliveries && (active.status === "PENDING" || active.status === "ASSIGNED") && (
                          <button
                            onClick={() => setShowAssign(true)}
                            style={{ background: C.blue }}
                            className="px-3 py-1.5 rounded-lg text-white font-semibold text-xs cursor-pointer hover:opacity-95"
                          >
                            Assign Driver
                          </button>
                        )}
                      </div>
                    )}

                    {canManageDeliveries && active.driver && (active.status === "PENDING" || active.status === "ASSIGNED") && (
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => setShowAssign(true)}
                          style={{ color: C.blue }}
                          className="text-xs font-semibold hover:underline cursor-pointer"
                        >
                          Change Assignment
                        </button>
                      </div>
                    )}
                  </div>

                  {canManageDeliveries && active.status !== "DELIVERED" && active.status !== "CANCELLED" && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-[rgba(20,18,14,0.04)]">
                      <button
                        onClick={() => handleCancelDelivery(active.id)}
                        style={{ border: `1.5px solid ${C.error}30`, color: C.error }}
                        className="w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer hover:bg-red-50"
                      >
                        Cancel Delivery
                      </button>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-8 text-center border-dashed">
                  <span style={{ color: C.muted }} className="text-xs">Select a delivery to view full logs and driver actions.</span>
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
              <div className="flex items-center gap-2">
                <span style={{ color: C.ink, fontFamily: "'Space Grotesk'" }} className="text-base font-bold">{active.deliveryNumber}</span>
                <Badge label={statusMeta[active.status].label} variant={statusMeta[active.status].variant} />
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

            <Divider />

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
              <span style={{ color: C.ink }} className="text-xs font-bold uppercase tracking-wide">Driver & Vehicle Assignment</span>
              {active.driver ? (
                <div className="flex items-center gap-3 text-xs">
                  <div style={{ background: "rgba(42,76,214,0.08)" }} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck size={16} color={C.blue} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ color: C.ink }} className="font-bold">{active.driver.name}</div>
                    <div style={{ color: C.muted }} className="text-[10px]">Phone: {active.driver.phone || "Not set"}</div>
                  </div>
                  <span style={{ color: C.blue, fontFamily: "'Space Grotesk'" }} className="text-xs font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {active.vehicleNumber}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span style={{ color: C.muted }} className="text-xs">No driver assigned.</span>
                  {canManageDeliveries && (active.status === "PENDING" || active.status === "ASSIGNED") && (
                    <button
                      onClick={() => setShowAssign(true)}
                      style={{ background: C.blue }}
                      className="px-2.5 py-1.5 rounded-lg text-white font-semibold text-xs cursor-pointer hover:opacity-95"
                    >
                      Assign
                    </button>
                  )}
                </div>
              )}

              {canManageDeliveries && active.driver && (active.status === "PENDING" || active.status === "ASSIGNED") && (
                <button
                  onClick={() => setShowAssign(true)}
                  style={{ color: C.blue }}
                  className="text-xs font-semibold text-right hover:underline cursor-pointer"
                >
                  Change Assignment
                </button>
              )}
            </div>

            {canManageDeliveries && active.status !== "DELIVERED" && active.status !== "CANCELLED" && (
              <button
                onClick={() => handleCancelDelivery(active.id)}
                style={{ border: `1.5px solid ${C.error}30`, color: C.error }}
                className="w-full py-3 rounded-xl font-bold text-xs cursor-pointer hover:bg-red-50 mt-2"
              >
                Cancel Delivery
              </button>
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

      {/* DIALOG: ASSIGN DRIVER & VEHICLE */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" style={{ zIndex: 100 }}>
          <div style={{ background: C.white, borderRadius: 16 }} className="w-full max-w-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span style={{ color: C.ink }} className="text-base font-bold">Assign Driver</span>
              <button onClick={() => setShowAssign(false)} className="text-gray-500 hover:text-gray-700 text-lg font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-3.5 text-xs font-medium">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Select Driver</label>
                <select
                  required
                  value={assignedDriverId}
                  onChange={(e) => setAssignedDriverId(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} {d.phone ? `(${d.phone})` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] uppercase">Vehicle Reg Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12 PQ-9988"
                  value={assignedVehicleNumber}
                  onChange={(e) => setAssignedVehicleNumber(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                  className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                style={{ background: C.blue }}
                className="w-full mt-2 py-3 rounded-xl text-white font-bold cursor-pointer hover:opacity-95"
              >
                Confirm Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default DeliveriesPage;
