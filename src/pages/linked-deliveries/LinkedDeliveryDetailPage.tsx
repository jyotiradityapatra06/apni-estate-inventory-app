import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import linkedDeliveryApi from "../../api/linkedDelivery.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { formatQuantity } from "../../utils/currency";
import { DeliveryChallanDocument } from "../../features/deliveries/DeliveryChallanDocument";
import { VehicleAssignmentModal } from "../../features/deliveries/VehicleAssignmentModal";
import { SiteConfirmationModal } from "../../features/deliveries/SiteConfirmationModal";
import { ArrowLeft, CheckCircle2, Truck, XCircle, RotateCcw, FileText, AlertCircle } from "lucide-react";

export default function LinkedDeliveryDetailPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { user, business } = useAuth();
  const [d, setD] = useState<any>();

  // Modals state
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"ready" | "dispatch" | null>(null);
  const [siteModalOpen, setSiteModalOpen] = useState(false);

  const load = () =>
    linkedDeliveryApi
      .getById(id)
      .then((r) => setD(r.data))
      .catch((e: any) => toast.error(e.message));

  useEffect(() => {
    void load();
  }, [id]);

  if (!d) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />;

  const handleOpenVehicleModal = (action: "ready" | "dispatch") => {
    setPendingAction(action);
    setVehicleModalOpen(true);
  };

  const handleVehicleSubmit = async (vehicleData: {
    vehicleType: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
  }) => {
    try {
      await linkedDeliveryApi.ready(id, vehicleData);

      if (pendingAction === "dispatch") {
        const r = await linkedDeliveryApi.dispatch(id);
        toast.success(
          r.idempotentReplay
            ? "Vehicle assigned & already dispatched."
            : "Vehicle assigned, delivery dispatched, and stock deducted!"
        );
      } else {
        toast.success("Vehicle assigned & delivery marked ready for dispatch!");
      }

      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to process vehicle assignment");
      throw e;
    }
  };

  const handleSiteSubmit = async (payload: {
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
  }) => {
    try {
      await linkedDeliveryApi.complete(id, payload);
      toast.success("Site delivery confirmation saved!");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save site delivery confirmation");
      throw e;
    }
  };

  const runAction = async (type: string) => {
    try {
      if (type === "cancel") {
        const reason = prompt("Reason for cancellation");
        if (!reason) return;
        await linkedDeliveryApi.cancel(id, reason);
        toast.success("Delivery cancelled");
      }
      if (type === "reverse") {
        const reason = prompt("Reason for reversing dispatch");
        if (!reason || !confirm("This will restore stock and cancel the delivery. Continue?")) return;
        await linkedDeliveryApi.reverse(id, reason);
        toast.success("Dispatch reversed & stock restored");
      }
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const statusIdx = d.status === "PENDING" ? 0 : d.status === "READY_FOR_DISPATCH" ? 1 : d.status === "OUT_FOR_DELIVERY" ? 2 : 3;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls (Hidden on Print) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <button
            onClick={() => nav("/deliveries")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] hover:underline cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Deliveries</span>
          </button>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight md:text-3xl">
              {d.deliveryNumber}
            </h1>
            <BusinessStatusBadge status={d.status} />
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-2">
            <span>Customer: <strong className="text-slate-800">{d.customerName}</strong></span>
            <span>&middot;</span>
            <span>Order: <strong className="font-mono text-slate-800">{d.salesOrder?.orderNumber}</strong></span>
            <span>&middot;</span>
            {d.vehicleNumber ? (
              <span className="text-green-700 font-bold flex items-center gap-1">
                <Truck size={13} />
                <span>{d.vehicleNumber} ({d.driverName || "Driver Assigned"})</span>
              </span>
            ) : (
              <span className="text-amber-600 font-semibold italic flex items-center gap-1">
                <AlertCircle size={13} />
                <span>Vehicle not assigned</span>
              </span>
            )}
          </p>
        </div>

        {/* Workflow Actions */}
        <div className="flex flex-wrap gap-2">
          {d.status === "PENDING" && (
            <>
              <button
                onClick={() => handleOpenVehicleModal("ready")}
                className="min-h-[44px] rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 text-xs font-bold text-white shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Truck size={15} />
                <span>Assign & Mark Ready</span>
              </button>
              <button
                onClick={() => runAction("cancel")}
                className="min-h-[44px] rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-4 text-xs font-bold text-red-700 cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}

          {d.status === "READY_FOR_DISPATCH" && (
            <button
              onClick={() => handleOpenVehicleModal("dispatch")}
              className="min-h-[44px] rounded-xl bg-[#F97316] hover:bg-orange-600 px-4 text-xs font-bold text-white shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Truck size={15} />
              <span>Dispatch Delivery</span>
            </button>
          )}

          {["OUT_FOR_DELIVERY", "PARTIALLY_DELIVERED"].includes(d.status) && (
            <button
              onClick={() => setSiteModalOpen(true)}
              className="min-h-[44px] rounded-xl bg-green-600 hover:bg-green-700 px-4 text-xs font-bold text-white shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Complete Site Delivery</span>
            </button>
          )}

          {user?.role === "OWNER" && d.stockPostedAt && !d.stockReversedAt && !d.items.some((x: any) => Number(x.deliveredQuantity) > 0) && (
            <button
              onClick={() => runAction("reverse")}
              className="min-h-[44px] rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 text-xs font-bold text-red-700 cursor-pointer"
            >
              Reverse Dispatch
            </button>
          )}
        </div>
      </div>

      {/* Status Timeline Bar (Hidden on Print) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 print:hidden">
        {["Created", "Ready for Dispatch", "Dispatched", "Completed"].map((x, i) => (
          <div
            key={x}
            className={`rounded-xl border p-3 text-center text-xs font-extrabold ${
              i <= statusIdx
                ? "border-orange-200 bg-orange-50/60 text-[#F97316]"
                : "border-slate-100 bg-white text-slate-400"
            }`}
          >
            {x}
          </div>
        ))}
      </div>

      {/* Printable Official Delivery Challan Document */}
      <DeliveryChallanDocument delivery={d} business={business} />

      {/* Vehicle Assignment Modal */}
      <VehicleAssignmentModal
        isOpen={vehicleModalOpen}
        onClose={() => {
          setVehicleModalOpen(false);
          setPendingAction(null);
        }}
        onSubmit={handleVehicleSubmit}
        initialData={{
          vehicleType: d.vehicleType,
          vehicleNumber: d.vehicleNumber,
          driverName: d.driverName,
          driverPhone: d.driverPhone,
        }}
        actionTitle={pendingAction === "dispatch" ? "Assign Vehicle & Dispatch" : "Assign Vehicle & Mark Ready"}
      />

      {/* Site Confirmation Modal */}
      <SiteConfirmationModal
        isOpen={siteModalOpen}
        onClose={() => setSiteModalOpen(false)}
        onSubmit={handleSiteSubmit}
        items={d.items || []}
      />

      {/* Line Items Card Section (Hidden on Print) */}
      <section className="space-y-3 print:hidden">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Delivery Line Items
        </h3>
        {d.items.map((x: any) => (
          <div key={x.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <b className="text-sm font-black text-slate-900 block">{x.materialName}</b>
                <p className="text-xs text-slate-500 font-semibold">{x.godown?.name || "Central Store"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs pt-1 border-t border-slate-100">
              {[
                ["Planned", x.plannedQuantity],
                ["Dispatched", x.dispatchedQuantity],
                ["Received", x.receivedQuantity],
                ["Rejected", x.rejectedQuantity],
                ["Remaining", Number(x.plannedQuantity) - Number(x.receivedQuantity)],
              ].map(([l, v]) => (
                <div key={String(l)} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">{l}</p>
                  <strong className="text-xs font-extrabold text-slate-800">{formatQuantity(v, x.unit)}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
