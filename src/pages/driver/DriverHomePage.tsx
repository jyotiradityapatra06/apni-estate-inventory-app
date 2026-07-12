import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { C } from "../../constants/colors";
import { Card } from "../../app/components/common/Card";
import { Badge } from "../../app/components/common/Badge";
import { Truck, Clock, ShieldAlert, LogOut, CheckCircle, Navigation } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { deliveryApi, DeliveryData } from "../../api/delivery.api";

export const DriverHomePage = () => {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignedDeliveries = async () => {
    if (!isOnDuty) return;
    setLoading(true);
    try {
      const res = await deliveryApi.getDriverDeliveries();
      if (res.success) {
        // Filter active deliveries (not delivered and not cancelled)
        const activeTrips = res.data.filter(
          (d) => d.status !== "DELIVERED" && d.status !== "CANCELLED"
        );
        setDeliveries(activeTrips);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch assigned deliveries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnDuty) {
      fetchAssignedDeliveries();
    } else {
      setDeliveries([]);
    }
  }, [isOnDuty]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      const res = await deliveryApi.updateStatus(id, nextStatus);
      if (res.success) {
        toast.success(`Trip status updated to ${nextStatus === "OUT_FOR_DELIVERY" ? "Out for Delivery" : "Delivered"}!`);
        fetchAssignedDeliveries();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update trip status.");
    }
  };

  // Find vehicle details from current trip
  const activeTrip = deliveries[0]; // SQLite order returns newest first
  const currentVehicleNumber = activeTrip?.vehicleNumber || null;

  return (
    <div className="flex flex-col gap-6 pb-6 select-none max-w-md mx-auto">
      {/* Mobile Top Header */}
      <div 
        style={{ background: C.blue }} 
        className="rounded-2xl p-6 text-white flex flex-col gap-4 shadow-lg animate-none"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : "D"}
            </div>
            <div>
              <div className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Welcome back,</div>
              <div className="text-base font-bold truncate max-w-[180px]">{user?.name || "Driver User"}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>

        <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/60 uppercase font-semibold">Business Unit</span>
            <span className="text-xs font-bold truncate max-w-[200px]">{business?.name || "APNI ESTATE"}</span>
          </div>
          <Badge label="DRIVER" variant="warning" />
        </div>
      </div>

      {/* Duty Status Control */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            style={{ background: isOnDuty ? "#ECFDF5" : "#FEF2F2" }} 
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
          >
            <Clock size={18} color={isOnDuty ? C.success : C.error} />
          </div>
          <div className="flex flex-col">
            <span style={{ color: C.muted }} className="text-[10px] uppercase font-bold tracking-wider">Duty Status</span>
            <span style={{ color: C.ink }} className="text-sm font-bold transition-all duration-300">
              {isOnDuty ? "Active - On Duty" : "Inactive - Off Duty"}
            </span>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <button
          onClick={() => {
            const nextDuty = !isOnDuty;
            setIsOnDuty(nextDuty);
            toast.info(nextDuty ? "You are now On Duty" : "You are now Off Duty");
          }}
          style={{ background: isOnDuty ? C.success : "#D1D5DB" }}
          className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
        >
          <span
            className={`${
              isOnDuty ? "translate-x-5" : "translate-x-0"
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </Card>

      {/* Assigned Vehicle */}
      <Card className="p-5 flex flex-col gap-3">
        <div style={{ color: C.muted }} className="text-[10px] uppercase font-bold tracking-wider">Assigned Vehicle</div>
        {isOnDuty ? (
          currentVehicleNumber ? (
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Truck size={24} color={C.blue} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: C.ink }} className="text-sm font-bold truncate">Assigned Truck</div>
                <div style={{ color: C.muted }} className="text-xs">Reg No: {currentVehicleNumber}</div>
              </div>
              <Badge label="ACTIVE" variant="success" />
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2">
              <ShieldAlert size={16} color={C.muted} />
              <span style={{ color: C.muted }} className="text-xs">No vehicle assigned for current trip queue.</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 py-2">
            <ShieldAlert size={16} color={C.muted} />
            <span style={{ color: C.muted }} className="text-xs">Go On Duty to view assigned vehicle.</span>
          </div>
        )}
      </Card>

      {/* Today's Trips */}
      <div className="flex flex-col gap-2">
        <div style={{ color: C.muted }} className="text-[10px] uppercase font-bold tracking-wider px-1">Today's Trips</div>
        
        {isOnDuty ? (
          loading ? (
            <div className="text-center py-6 text-xs font-semibold text-gray-500">Loading trips...</div>
          ) : deliveries.length > 0 ? (
            <div className="flex flex-col gap-3">
              {deliveries.map((trip) => {
                const isAssigned = trip.status === "ASSIGNED";
                const isOngoing = trip.status === "OUT_FOR_DELIVERY";

                return (
                  <Card key={trip.id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div style={{ color: C.ink }} className="text-xs font-bold uppercase tracking-wider">{trip.deliveryNumber}</div>
                        <h4 style={{ color: C.ink }} className="text-sm font-bold mt-0.5">{trip.customerName}</h4>
                      </div>
                      <Badge 
                        label={isAssigned ? "Assigned" : "On The Way"} 
                        variant={isAssigned ? "warning" : "info"} 
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1 text-xs">
                      <div>
                        <span style={{ color: C.muted }} className="text-[10px] uppercase tracking-wide mr-1">Address:</span>
                        <span style={{ color: C.ink }} className="font-semibold">{trip.deliveryAddress}</span>
                      </div>
                      <div>
                        <span style={{ color: C.muted }} className="text-[10px] uppercase tracking-wide mr-1">Load:</span>
                        <span style={{ color: C.ink }} className="font-semibold">{trip.materialName} · {trip.quantity} {trip.unit}</span>
                      </div>
                      {trip.notes && (
                        <div className="mt-1 bg-slate-50 border border-slate-100 p-2 rounded italic text-[11px]">
                          Note: {trip.notes}
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      {isAssigned && (
                        <button
                          onClick={() => handleUpdateStatus(trip.id, "OUT_FOR_DELIVERY")}
                          style={{ background: C.blue }}
                          className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Navigation size={13} /> Start Delivery
                        </button>
                      )}
                      {isOngoing && (
                        <button
                          onClick={() => handleUpdateStatus(trip.id, "DELIVERED")}
                          style={{ background: C.success }}
                          className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle size={13} /> Mark Delivered
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 flex flex-col items-center justify-center text-center gap-3 border-dashed">
              <div className="p-3 bg-emerald-50 rounded-full w-12 h-12 flex items-center justify-center">
                <CheckCircle size={24} color={C.success} />
              </div>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-bold">No delivery assigned</div>
                <div style={{ color: C.muted }} className="text-xs max-w-[240px] mt-1">
                  No active trips are currently assigned to you. Refresh later or contact supervisor.
                </div>
              </div>
            </Card>
          )
        ) : (
          <Card className="p-8 flex flex-col items-center justify-center text-center gap-2 border-dashed">
            <ShieldAlert size={20} color={C.muted} />
            <div style={{ color: C.muted }} className="text-xs">
              Trips queue is offline. Switch On Duty to fetch assigned orders.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
export default DriverHomePage;
