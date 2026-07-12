import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Package, AlertTriangle, ArrowUpRight, 
  Truck, ClipboardList, RefreshCw, Bell, DollarSign, CheckCircle2, Navigation
} from "lucide-react";
import { toast } from "sonner";

import { C } from "../../constants/colors";
import { Card } from "../../app/components/common/Card";
import { SectionLabel } from "../../app/components/common/SectionLabel";
import { StatChip } from "../../app/components/common/StatChip";
import { Divider } from "../../app/components/common/Divider";

import { useAuth } from "../../hooks/useAuth";
import { useGetInventory } from "../../hooks/useInventory";
import { inventoryApi } from "../../api/inventory.api";
import { notificationApi, NotificationData } from "../../api/notification.api";
import { LocalDelivery } from "../deliveries/DeliveriesPage";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { business, user } = useAuth();
  const isManagement = user?.role === "OWNER" || user?.role === "MANAGER";

  // Fetch Inventory (Real Data)
  const { data: stockItems, loading: invLoading, refresh: refreshInv } = useGetInventory();

  // Fetch Global Transactions (Real Data)
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  // Fetch Backend Notifications
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  // Fetch Local Storage Deliveries
  const [deliveries, setDeliveries] = useState<LocalDelivery[]>([]);

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const res = await inventoryApi.getAllTransactions();
      if (res.success) {
        setTransactions(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load global transactions:", err);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchBackendNotifications = async () => {
    if (!isManagement) {
      setNotifLoading(false);
      return;
    }
    setNotifLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  const loadLocalDeliveries = () => {
    try {
      const stored = localStorage.getItem("apni_deliveries");
      if (stored) {
        setDeliveries(JSON.parse(stored));
      } else {
        setDeliveries([]);
      }
    } catch (err) {
      console.error("Failed to load local deliveries:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchBackendNotifications();
    loadLocalDeliveries();
  }, [user]);

  const handleRefresh = () => {
    refreshInv();
    fetchTransactions();
    fetchBackendNotifications();
    loadLocalDeliveries();
    toast.success("Dashboard metrics updated");
  };

  // Calculations
  const totalItems = stockItems.length;
  const lowStockItemsCount = stockItems.filter(item => {
    return typeof item.reorderLevel === "number" && item.quantity <= item.reorderLevel;
  }).length;

  const todayStr = new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const stockInTodayCount = transactions.filter(
    t => t.type === "IN" && new Date(t.createdAt).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }) === todayStr
  ).length;

  const stockOutTodayCount = transactions.filter(
    t => t.type === "OUT" && new Date(t.createdAt).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }) === todayStr
  ).length;

  const recentTransactions = transactions.slice(0, 5);

  // Delivery count details
  const pendingDelCount = deliveries.filter(d => d.status === "PENDING").length;
  const outDelCount = deliveries.filter(d => d.status === "OUT_FOR_DELIVERY").length;
  const deliveredDelCount = deliveries.filter(d => d.status === "DELIVERED").length;
  const paymentPendingDelCount = deliveries.filter(d => d.paymentStatus === "PENDING").length;

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Mobile Header */}
      <div style={{ background: C.blue }} className="px-4 pt-12 pb-5 md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/60 text-[11px] font-medium uppercase tracking-wider">Business Dashboard</div>
            <div className="text-white text-lg font-bold leading-tight">{business?.name || "APNI ESTATE"}</div>
          </div>
          <button 
            onClick={handleRefresh}
            style={{ background: "rgba(255,255,255,0.15)" }} 
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          >
            <RefreshCw size={15} color="white" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ background: C.success }} className="w-1.5 h-1.5 rounded-full" />
          <span className="text-white/70 text-[11px] font-medium">Real-time Connected</span>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-2">
        <div>
          <h1 style={{ color: C.ink }} className="text-lg font-bold">Control Centre</h1>
          <p style={{ color: C.muted }} className="text-xs">Real-time business performance, stock adjustments, and delivery pipelines.</p>
        </div>
        <button
          onClick={handleRefresh}
          style={{ border: `1.5px solid ${C.border}`, color: C.ink }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-xs font-semibold bg-white hover:bg-slate-50 active:scale-95 transition-all"
        >
          <RefreshCw size={13} />
          <span>Sync Data</span>
        </button>
      </div>

      <div className="px-1 md:px-0 flex flex-col gap-5">
        {/* Real Metrics Grid */}
        <div>
          <SectionLabel>Operational Health</SectionLabel>
          {invLoading || txLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-[rgba(20,18,14,0.1)] rounded-xl p-4 h-20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              <StatChip 
                label="Total Materials" 
                value={String(totalItems)} 
                sub="Registered in inventory" 
                trend={null} 
              />
              <StatChip 
                label="Low Stock Items" 
                value={String(lowStockItemsCount)} 
                sub="Requires replenishment" 
                trend={lowStockItemsCount > 0 ? "up" : null} 
              />
              <StatChip 
                label="Stock In (Today)" 
                value={`${stockInTodayCount} adjustments`} 
                sub="Dockets logged today" 
                trend={null} 
              />
              <StatChip 
                label="Stock Out (Today)" 
                value={`${stockOutTodayCount} adjustments`} 
                sub="Deductions logged today" 
                trend={null} 
              />
            </div>
          )}
        </div>

        {/* Primary Actions Grid */}
        <div>
          <SectionLabel>Quick Operations</SectionLabel>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <Card 
              className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black/[0.01] active:scale-98 transition-all"
              onClick={() => navigate("/inventory?action=stock-in")}
            >
              <div style={{ background: "rgba(16,185,129,0.08)" }} className="w-10 h-10 rounded-full flex items-center justify-center mb-2">
                <ArrowUpRight size={18} color={C.success} />
              </div>
              <span style={{ color: C.ink }} className="text-xs font-bold">Stock In / Adjust</span>
              <span style={{ color: C.muted }} className="text-[10px] mt-0.5">Adjust stock values</span>
            </Card>

            <Card 
              className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black/[0.01] active:scale-98 transition-all"
              onClick={() => navigate("/deliveries?action=new-delivery")}
            >
              <div style={{ background: "rgba(42,76,214,0.08)" }} className="w-10 h-10 rounded-full flex items-center justify-center mb-2">
                <Truck size={18} color={C.blue} />
              </div>
              <span style={{ color: C.ink }} className="text-xs font-bold">New Delivery</span>
              <span style={{ color: C.muted }} className="text-[10px] mt-0.5">Schedule shipment</span>
            </Card>
          </div>
        </div>

        {/* Unified Deliveries Summary, Transactions, and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
          {/* Deliveries Stats Card (Real Counts) */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            <SectionLabel>Delivery Overview</SectionLabel>
            <Card className="p-5 flex flex-col gap-4 h-[280px]">
              <div className="flex items-center gap-2">
                <div style={{ background: "rgba(42,76,214,0.08)" }} className="p-2 rounded-lg text-blue-600">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h3 style={{ color: C.ink }} className="text-xs font-bold">Logistics Summary</h3>
                  <p style={{ color: C.muted }} className="text-[9px]">Active dispatcher counters</p>
                </div>
              </div>
              
              <Divider className="my-0" />

              <div className="grid grid-cols-2 gap-3 flex-1 text-xs">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                  <span style={{ color: C.muted }} className="font-semibold text-[9px] uppercase tracking-wider block">Pending</span>
                  <span style={{ color: C.ink }} className="text-lg font-bold font-mono mt-1">{pendingDelCount}</span>
                </div>
                <div className="bg-sky-50/50 border border-sky-100/50 p-3 rounded-xl flex flex-col justify-between">
                  <span style={{ color: "#0369A1" }} className="font-semibold text-[9px] uppercase tracking-wider block">In Transit</span>
                  <span style={{ color: "#0369A1" }} className="text-lg font-bold font-mono mt-1">{outDelCount}</span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl flex flex-col justify-between">
                  <span style={{ color: "#047857" }} className="font-semibold text-[9px] uppercase tracking-wider block">Delivered</span>
                  <span style={{ color: "#047857" }} className="text-lg font-bold font-mono mt-1">{deliveredDelCount}</span>
                </div>
                <div className="bg-rose-50/50 border border-rose-100/50 p-3 rounded-xl flex flex-col justify-between">
                  <span style={{ color: "#BE123C" }} className="font-semibold text-[9px] uppercase tracking-wider block">Pay Pending</span>
                  <span style={{ color: "#BE123C" }} className="text-lg font-bold font-mono mt-1">{paymentPendingDelCount}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Real Transactions Ledger */}
          <div className={`${isManagement ? "lg:col-span-4" : "lg:col-span-8"} flex flex-col gap-2`}>
            <SectionLabel>Recent Ledger Transactions</SectionLabel>
            <Card className="p-5 flex flex-col gap-3 h-[280px] overflow-y-auto">
              {txLoading ? (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Loading ledger logs...</div>
              ) : recentTransactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-1.5">
                  <span style={{ color: C.muted }} className="text-xs font-semibold">No recent adjustments</span>
                  <span style={{ color: C.muted }} className="text-[10px] max-w-xs">Stock-ins and Stock-outs will display here as they occur.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recentTransactions.map((tx, idx) => {
                    const isIn = tx.type === "IN";
                    return (
                      <div key={tx.id}>
                        {idx > 0 && <Divider className="my-1.5" />}
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="min-w-0 flex-1">
                            <div style={{ color: C.ink }} className="font-bold truncate">{tx.inventoryItem?.materialName || "Material Item"}</div>
                            <div style={{ color: C.muted }} className="text-[9px] mt-0.5">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              {tx.note && ` · ${tx.note}`}
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <span 
                              style={{ 
                                color: isIn ? C.success : C.error, 
                                background: isIn ? "#ECFDF5" : "#FEF2F2" 
                              }} 
                              className="px-1.5 py-0.5 rounded font-bold text-[9px]"
                            >
                              {isIn ? "+" : "-"}{tx.quantity.toLocaleString("en-IN")} {tx.inventoryItem?.unit || "Units"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Business Notifications Feed (Owners & Managers Only) */}
          {isManagement && (
            <div className="lg:col-span-4 flex flex-col gap-2">
              <SectionLabel>Business Notifications</SectionLabel>
              <Card className="p-5 flex flex-col gap-3 h-[280px] overflow-y-auto bg-white border border-[rgba(20,18,14,0.1)] shadow-sm">
                {notifLoading ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Loading alerts...</div>
                ) : notifications.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-1">
                    <div style={{ background: "rgba(42,76,214,0.05)" }} className="w-10 h-10 rounded-full flex items-center justify-center mb-1 text-blue-600">
                      <Bell size={18} />
                    </div>
                    <span style={{ color: C.muted }} className="text-xs font-semibold">No alerts yet</span>
                    <span style={{ color: C.muted }} className="text-[9px] max-w-[180px]">Created shipments and delivery events generate logs here.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {notifications.slice(0, 8).map((n, idx) => (
                      <div key={n.id}>
                        {idx > 0 && <Divider className="my-1.5" />}
                        <div className="flex items-start gap-2.5 text-[11px]">
                          <div style={{ background: "rgba(42,76,214,0.06)" }} className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 mt-0.5">
                            <Bell size={10} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div style={{ color: C.ink }} className="font-bold truncate">{n.title}</div>
                            <p style={{ color: C.muted }} className="text-[10px] mt-0.5 leading-normal">{n.message}</p>
                            <span style={{ color: "rgba(20,18,14,0.3)" }} className="text-[8px] block mt-1">
                              {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
