import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { C } from "../../constants/colors";
import { Card } from "../../app/components/common/Card";
import { Badge } from "../../app/components/common/Badge";
import { Truck, Clock, ShieldAlert, LogOut, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export const DriverHomePage = () => {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnDuty, setIsOnDuty] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col gap-6 pb-6 select-none max-w-md mx-auto">
      {/* Mobile Top Header */}
      <div 
        style={{ background: C.blue }} 
        className="rounded-2xl p-6 text-white flex flex-col gap-4 shadow-lg"
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
            setIsOnDuty(!isOnDuty);
            toast.info(isOnDuty ? "You are now Off Duty" : "You are now On Duty");
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
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Truck size={24} color={C.blue} />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: C.ink }} className="text-sm font-bold truncate">Tata Prima 2825.K</div>
              <div style={{ color: C.muted }} className="text-xs">Reg No: MH-12-PQ-9988 · 10-Tonne Tipper</div>
            </div>
            <Badge label="ACTIVE" variant="success" />
          </div>
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
          <Card className="p-8 flex flex-col items-center justify-center text-center gap-3 border-dashed">
            <div className="p-3 bg-emerald-50 rounded-full w-12 h-12 flex items-center justify-center">
              <CheckCircle size={24} color={C.success} />
            </div>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-bold">All caught up!</div>
              <div style={{ color: C.muted }} className="text-xs max-w-[240px] mt-1">
                No trips are currently assigned to you for today. Check back later or request dispatch.
              </div>
            </div>
          </Card>
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
