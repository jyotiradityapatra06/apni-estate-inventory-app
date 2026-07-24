import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import linkedDeliveryApi from "../../api/linkedDelivery.api";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { DeliveryChallanDocument } from "../../features/deliveries/DeliveryChallanDocument";
import { SiteConfirmationModal } from "../../features/deliveries/SiteConfirmationModal";
import { formatQuantity } from "../../utils/currency";
import { toast } from "sonner";
import {
  Truck,
  Phone,
  Navigation,
  FileText,
  CheckCircle2,
  LogOut,
  RefreshCw,
  MapPin,
  User,
  Package,
  X
} from "lucide-react";

export default function DriverTripsPage() {
  const { user, logout, business } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");

  // Selected delivery for Challan Preview modal
  const [selectedChallanDelivery, setSelectedChallanDelivery] = useState<any | null>(null);

  // Selected delivery for Site Confirmation modal
  const [selectedSiteDelivery, setSelectedSiteDelivery] = useState<any | null>(null);

  const fetchAssignedTrips = async () => {
    setLoading(true);
    try {
      const response = await linkedDeliveryApi.getAll();
      setDeliveries(response.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load assigned trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAssignedTrips();
  }, []);

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
    if (!selectedSiteDelivery) return;
    try {
      await linkedDeliveryApi.complete(selectedSiteDelivery.id, payload);
      toast.success("Delivery completed successfully!");
      setSelectedSiteDelivery(null);
      fetchAssignedTrips();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit site delivery confirmation");
      throw err;
    }
  };

  // Filter deliveries based on active tab
  const filteredDeliveries = deliveries.filter((d) => {
    if (activeTab === "ACTIVE") {
      return ["OUT_FOR_DELIVERY", "READY_FOR_DISPATCH", "PENDING"].includes(d.status);
    }
    if (activeTab === "COMPLETED") {
      return ["DELIVERED", "PARTIALLY_DELIVERED"].includes(d.status);
    }
    return true;
  });

  const activeCount = deliveries.filter((d) =>
    ["OUT_FOR_DELIVERY", "READY_FOR_DISPATCH", "PENDING"].includes(d.status)
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24 select-none">
      {/* Driver Mobile Header */}
      <header className="sticky top-0 z-30 bg-[#0F172A] text-white shadow-md">
        <div className="mx-auto max-w-xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F97316] text-white shadow-sm font-black">
              <Truck size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                APNI ESTATE Driver Portal
              </p>
              <h1 className="text-base font-extrabold text-white leading-tight">
                {user?.name || "Assigned Driver"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAssignedTrips}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh Trips"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="mx-auto max-w-xl px-4 pb-3 flex gap-2">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`flex-1 min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "ACTIVE"
                ? "bg-[#F97316] text-white shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Active Trips</span>
            {activeCount > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">
                {activeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`flex-1 min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "COMPLETED"
                ? "bg-[#F97316] text-white shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Completed
          </button>

          <button
            onClick={() => setActiveTab("ALL")}
            className={`flex-1 min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-[#F97316] text-white shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({deliveries.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-xl p-4 space-y-4">
        {loading ? (
          <div className="space-y-3 pt-4">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        ) : filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery) => {
            const customerPhone = delivery.customerPhone || delivery.customer?.phone || "";
            const siteAddress = delivery.deliveryAddress || delivery.customer?.billingAddress || "";
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteAddress)}`;
            const isCanComplete = ["OUT_FOR_DELIVERY", "PARTIALLY_DELIVERED"].includes(delivery.status);

            return (
              <div
                key={delivery.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4"
              >
                {/* Header Row: Numbers & Status */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {delivery.challanNumber || "Challan Pending"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        ({delivery.deliveryNumber})
                      </span>
                    </div>
                    {delivery.salesOrder?.orderNumber && (
                      <p className="text-[11px] font-semibold text-slate-500">
                        Order: <span className="font-mono text-slate-800">{delivery.salesOrder.orderNumber}</span>
                      </p>
                    )}
                  </div>

                  <BusinessStatusBadge status={delivery.status} />
                </div>

                {/* Customer & Address Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <User size={15} className="text-[#F97316] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer / Site</span>
                      <strong className="text-sm font-bold text-slate-900 block">
                        {delivery.customerName || delivery.customer?.name}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-[#F97316] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Site Delivery Address</span>
                      <p className="font-semibold text-slate-800 leading-relaxed">
                        {siteAddress || "Site address specified on order"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Material Manifest Summary */}
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 mb-1">
                    <Package size={13} className="text-[#F97316]" />
                    <span>Materials Manifest</span>
                  </div>

                  {delivery.items && delivery.items.length > 0 ? (
                    delivery.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center py-0.5">
                        <span className="font-bold text-slate-800">{item.materialName}</span>
                        <span className="font-mono font-extrabold text-slate-900">
                          {formatQuantity(item.dispatchedQuantity || item.plannedQuantity, item.unit)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="font-bold text-slate-800">{delivery.materialName}</span>
                      <span className="font-mono font-extrabold text-slate-900">
                        {formatQuantity(delivery.quantity, delivery.unit)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons Grid (44px min height) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Action 1: Call Customer */}
                  {customerPhone ? (
                    <a
                      href={`tel:${customerPhone}`}
                      className="min-h-[44px] rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 text-xs font-extrabold text-blue-700 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Phone size={15} />
                      <span>Call Site</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-400 flex items-center justify-center gap-2 opacity-60"
                    >
                      <Phone size={15} />
                      <span>No Phone</span>
                    </button>
                  )}

                  {/* Action 2: Navigate via Google Maps */}
                  {siteAddress ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-800 hover:bg-slate-900 px-3 text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Navigation size={15} />
                      <span>Maps GPS</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-400 flex items-center justify-center gap-2 opacity-60"
                    >
                      <Navigation size={15} />
                      <span>No Address</span>
                    </button>
                  )}

                  {/* Action 3: View Delivery Challan */}
                  <button
                    onClick={() => setSelectedChallanDelivery(delivery)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 text-xs font-extrabold text-slate-800 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <FileText size={15} className="text-[#F97316]" />
                    <span>View Challan</span>
                  </button>

                  {/* Action 4: Complete Site Delivery */}
                  {isCanComplete ? (
                    <button
                      onClick={() => setSelectedSiteDelivery(delivery)}
                      className="min-h-[44px] rounded-xl bg-green-600 hover:bg-green-700 px-3 text-xs font-extrabold text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 size={15} />
                      <span>Complete Site</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="min-h-[44px] rounded-xl bg-slate-100 border border-slate-200 px-3 text-xs font-bold text-slate-400 flex items-center justify-center gap-2 opacity-60"
                    >
                      <CheckCircle2 size={15} />
                      <span>
                        {delivery.status === "DELIVERED" ? "Delivered" : "Pending Dispatch"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3 my-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316]">
              <Truck size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900">
              No deliveries assigned today
            </h3>
            <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto leading-relaxed">
              Assigned trips will appear here when your manager dispatches materials for site delivery.
            </p>
            <button
              onClick={fetchAssignedTrips}
              className="mt-2 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Check for New Trips</span>
            </button>
          </div>
        )}
      </main>

      {/* Delivery Challan Document Modal */}
      {selectedChallanDelivery && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">Official Delivery Challan</h3>
              <button
                onClick={() => setSelectedChallanDelivery(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <DeliveryChallanDocument delivery={selectedChallanDelivery} business={business} />

            <div className="pt-2">
              <button
                onClick={() => setSelectedChallanDelivery(null)}
                className="min-h-[44px] w-full rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close Challan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Site Confirmation Modal */}
      {selectedSiteDelivery && (
        <SiteConfirmationModal
          isOpen={!!selectedSiteDelivery}
          onClose={() => setSelectedSiteDelivery(null)}
          onSubmit={handleSiteSubmit}
          items={selectedSiteDelivery.items || []}
        />
      )}
    </div>
  );
}
