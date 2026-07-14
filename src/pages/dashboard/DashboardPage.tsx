import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { C } from "../../constants/colors";
import { Divider } from "../../app/components/common/Divider";

import { useAuth } from "../../hooks/useAuth";
import { useGetInventory } from "../../hooks/useInventory";
import { inventoryApi } from "../../api/inventory.api";
import { LocalDelivery } from "../deliveries/DeliveriesPage";
import { deliveryApi } from "../../api/delivery.api";
import { hasPermission } from "../../utils/permissions";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { business, user } = useAuth();
  const isOwnerOrManager = user?.role === "OWNER" || user?.role === "MANAGER";
  const canUpdate = hasPermission(user, "inventory:update");

  // Fetch Inventory (Real Data)
  const { data: stockItems, loading: invLoading, refresh: refreshInv } = useGetInventory();

  // Fetch Global Transactions (Real Data)
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(true);

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

  const fetchDeliveries = async () => {
    if (!isOwnerOrManager) {
      setDeliveries([]);
      return;
    }
    try {
      const res = await deliveryApi.getDeliveries();
      if (res.success && res.data) {
        setDeliveries(res.data as any);
      }
    } catch (err) {
      console.error("Failed to load deliveries for dashboard:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchDeliveries();
  }, [user]);

  const handleRefresh = () => {
    refreshInv();
    fetchTransactions();
    fetchDeliveries();
    toast.success("Dashboard updated");
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

  const recentActivity = [
    ...transactions.slice(0, 4).map((tx) => ({
      id: `stock-${tx.id}`,
      title: tx.type === "IN" ? "Stock Added" : "Stock Removed",
      message: `${tx.quantity.toLocaleString("en-IN")} ${tx.inventoryItem?.unit || "units"
        } of ${tx.inventoryItem?.materialName || "material"}`,
      createdAt: tx.createdAt,
      type: tx.type === "IN" ? "stock-in" : "stock-out",
    })),
    ...deliveries.slice(0, 4).map((delivery) => ({
      id: `delivery-${delivery.id}`,
      title:
        delivery.status === "DELIVERED"
          ? "Delivery Completed"
          : delivery.status === "OUT_FOR_DELIVERY"
            ? "Delivery Dispatched"
            : "Delivery Scheduled",
      message: `${delivery.deliveryNumber} · ${delivery.customerName}`,
      createdAt: delivery.createdAt,
      type:
        delivery.status === "DELIVERED"
          ? "delivered"
          : delivery.status === "OUT_FOR_DELIVERY"
            ? "in-transit"
            : "scheduled",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 6);

  // Delivery count details
  const pendingDelCount = deliveries.filter(d => d.status === "PENDING").length;
  const outDelCount = deliveries.filter(d => d.status === "OUT_FOR_DELIVERY").length;
  const deliveredDelCount = deliveries.filter(d => d.status === "DELIVERED").length;
  const paymentPendingDelCount = deliveries.filter(d => d.paymentStatus === "PENDING").length;

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-7xl mx-auto px-4 md:px-6">
      {/* Mobile Header Banner */}
      <div className="bg-[#0F172A] px-5 pt-8 pb-6 rounded-xl md:hidden border border-slate-700 text-white mt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white/70 text-xs font-semibold uppercase tracking-wider">Dashboard</div>
            <div className="text-xl font-bold leading-tight mt-1">{business?.name || "APNI ESTATE"}</div>
          </div>
          <button
            onClick={handleRefresh}
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 active:scale-95 transition-all focus:outline-none border border-white/20 cursor-pointer"
          >
            <RefreshCw size={16} className="text-white" />
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded border border-white/10 w-max">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/80 text-xs font-bold">Real-time Connected</span>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-2 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Your stock and delivery status at a glance.</p>
        </div>
        <button
          onClick={handleRefresh}
          style={{ border: `1.5px solid ${C.border}` }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer text-sm font-bold bg-white text-[#0F172A] hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Today's Summary section */}
        <div>
          <div className="mb-3">
            <span className="text-sm font-bold uppercase tracking-wider block text-[#0F172A]">
              Today&apos;s Summary
            </span>
          </div>

          {invLoading || txLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="bg-white border border-slate-300 rounded-xl p-5 h-28 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Materials */}
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${C.blue}`,
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                className="rounded-xl p-5 flex flex-col justify-between min-h-[110px] border-slate-300"
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-500">
                    Total Materials
                  </div>
                  <div className="text-2xl font-bold font-mono leading-none mt-1.5 text-[#0F172A]">
                    {totalItems}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-2">
                  Materials available
                </div>
              </div>

              {/* Low Stock */}
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${lowStockItemsCount > 0 ? C.error : C.muted}`,
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                className="rounded-xl p-5 flex flex-col justify-between min-h-[110px] border-slate-300"
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-500">
                    Low Stock
                  </div>
                  <div style={{ color: lowStockItemsCount > 0 ? C.error : "#0F172A" }} className="text-2xl font-bold font-mono leading-none mt-1.5">
                    {lowStockItemsCount}
                  </div>
                </div>
                <div className="text-xs font-semibold mt-2 flex items-center gap-1">
                  {lowStockItemsCount > 0 && <ArrowUpRight size={14} style={{ color: C.error }} />}
                  <span style={{ color: lowStockItemsCount > 0 ? C.error : C.muted }}>
                    {lowStockItemsCount > 0 ? "Needs more stock" : "All items ok"}
                  </span>
                </div>
              </div>

              {/* Stock In Today */}
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${C.success}`,
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                className="rounded-xl p-5 flex flex-col justify-between min-h-[110px] border-slate-300"
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-500">
                    Stock In Today
                  </div>
                  <div className="text-2xl font-bold font-mono leading-none mt-1.5 text-[#0F172A]">
                    {stockInTodayCount}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-2">
                  Entries made today
                </div>
              </div>

              {/* Stock Out Today */}
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${C.yellow}`, // Accent highlight yellow
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                className="rounded-xl p-5 flex flex-col justify-between min-h-[110px] border-slate-300"
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-500">
                    Stock Out Today
                  </div>
                  <div className="text-2xl font-bold font-mono leading-none mt-1.5 text-[#0F172A]">
                    {stockOutTodayCount}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-2">
                  Entries made today
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions section */}
        {canUpdate && (
          <div>
            <div className="mb-3">
              <span className="text-sm font-bold uppercase tracking-wider block text-[#0F172A]">
                Quick Actions
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              <button
                onClick={() => navigate("/inventory?action=stock-in")}
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                className="flex items-center justify-center gap-3 h-12 rounded-lg hover:bg-slate-50 active:scale-98 transition-all focus:outline-none cursor-pointer border-slate-300 px-4"
              >
                <ArrowDownToLine size={18} className="text-[#16A34A]" />
                <span className="text-sm font-bold text-[#0F172A]">Stock In</span>
              </button>

              <button
                onClick={() => navigate("/inventory?action=stock-out")}
                style={{
                  background: C.white,
                  border: `1.5px solid ${C.yellow}`, // Highlight border in yellow
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                className="flex items-center justify-center gap-3 h-12 rounded-lg hover:bg-slate-50 active:scale-98 transition-all focus:outline-none cursor-pointer px-4"
              >
                <ArrowUpFromLine size={18} className="text-[#DC2626]" />
                <span className="text-sm font-bold text-[#0F172A]">Stock Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Unified Deliveries Summary, Transactions, and Notifications */}
        <div className={`grid grid-cols-1 ${isOwnerOrManager ? "lg:grid-cols-12" : ""} gap-6 animate-fade-in`}>
          
          {/* Delivery Status (OWNER/MANAGER only) */}
          {isOwnerOrManager && (
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div>
                <span className="text-sm font-bold uppercase tracking-wider block text-[#0F172A]">
                  Delivery Status
                </span>
              </div>
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                className="p-6 flex flex-col gap-5 h-[350px] border-slate-300 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div style={{ background: "rgba(15,23,42,0.06)" }} className="p-2.5 rounded-lg text-[#0F172A]">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Delivery Summary</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Current delivery counts</p>
                  </div>
                </div>

                <Divider className="my-0" />

                <div className="grid grid-cols-2 gap-4 flex-1 text-xs">
                  <div className="bg-slate-50 border border-slate-300 p-4 rounded-lg flex flex-col justify-between shadow-sm">
                    <span className="font-bold text-[10px] uppercase tracking-wider block text-slate-500">Pending</span>
                    <span className="text-2xl font-bold font-mono mt-2 text-[#0F172A]">{pendingDelCount}</span>
                  </div>
                  <div className="bg-sky-50/50 border border-slate-300 p-4 rounded-lg flex flex-col justify-between shadow-sm">
                    <span className="font-bold text-[10px] uppercase tracking-wider block text-[#0284C7]">Out for Delivery</span>
                    <span className="text-2xl font-bold font-mono mt-2 text-[#0284C7]">{outDelCount}</span>
                  </div>
                  <div className="bg-emerald-50/50 border border-slate-300 p-4 rounded-lg flex flex-col justify-between shadow-sm">
                    <span className="font-bold text-[10px] uppercase tracking-wider block text-[#16A34A]">Delivered</span>
                    <span className="text-2xl font-bold font-mono mt-2 text-[#16A34A]">{deliveredDelCount}</span>
                  </div>
                  <div className="bg-rose-50/50 border border-slate-300 p-4 rounded-lg flex flex-col justify-between shadow-sm">
                    <span className="font-bold text-[10px] uppercase tracking-wider block text-[#DC2626]">Payment Pending</span>
                    <span className="text-2xl font-bold font-mono mt-2 text-[#DC2626]">{paymentPendingDelCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real Transactions Ledger */}
          <div className={`${isOwnerOrManager ? "lg:col-span-4" : "w-full max-w-3xl"} flex flex-col gap-3`}>
            <div>
              <span className="text-sm font-bold uppercase tracking-wider block text-[#0F172A]">
                Recent Stock Activity
              </span>
            </div>
            <div
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
              className="p-6 flex flex-col gap-4 h-[350px] overflow-y-auto border-slate-300 rounded-xl"
            >
              {txLoading ? (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-500 font-medium">Loading activity...</div>
              ) : recentTransactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-sm font-semibold text-slate-500">No recent activity</span>
                  <span className="text-xs text-slate-500 max-w-xs">Stock updates will appear here.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentTransactions.map((tx, idx) => {
                    const isIn = tx.type === "IN";
                    return (
                      <div key={tx.id}>
                        {idx > 0 && <Divider className="my-2.5" />}
                        <div className="flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-[#0F172A] truncate">{tx.inventoryItem?.materialName || "Material Item"}</div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              {tx.note && ` · ${tx.note}`}
                            </div>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <span
                              style={{
                                color: isIn ? C.success : C.error,
                                background: isIn ? "#ECFDF5" : "#FEF2F2"
                              }}
                              className="px-2.5 py-1 rounded font-bold text-xs inline-block"
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
            </div>
          </div>

          {/* Recent Activity (OWNER/MANAGER only) */}
          {isOwnerOrManager && (
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div>
                <span className="text-sm font-bold uppercase tracking-wider block text-[#0F172A]">
                  Recent Activity
                </span>
              </div>
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                className="p-6 flex flex-col gap-4 h-[350px] overflow-y-auto border-slate-300 rounded-xl"
              >
                {txLoading ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-slate-500 font-medium">
                    Loading activity...
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 text-slate-500">
                      <CheckCircle2 size={24} />
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A]">
                      No recent activity
                    </span>
                    <span className="text-xs text-slate-500 max-w-[210px]">
                      Stock and delivery updates will appear here.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {recentActivity.map((activity, index) => {
                      const isStockIn = activity.type === "stock-in";
                      const isStockOut = activity.type === "stock-out";
                      const isDelivered = activity.type === "delivered";

                      return (
                        <div key={activity.id}>
                          {index > 0 && <Divider className="my-2.5" />}

                          <div className="flex items-start gap-4 py-1.5">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isStockIn
                                ? "bg-emerald-50 text-[#16A34A]"
                                : isStockOut
                                  ? "bg-rose-50 text-[#DC2626]"
                                  : isDelivered
                                    ? "bg-blue-50 text-[#0F172A]"
                                    : "bg-amber-50 text-[#CA8A04]"
                                }`}
                            >
                              {isStockIn ? (
                                <ArrowDownToLine size={18} />
                              ) : isStockOut ? (
                                <ArrowUpFromLine size={18} />
                              ) : isDelivered ? (
                                <CheckCircle2 size={18} />
                              ) : (
                                <Truck size={18} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-[#0F172A]">
                                {activity.title}
                              </div>

                              <div className="text-xs text-slate-500 mt-1 truncate font-medium">
                                {activity.message}
                              </div>

                              <div className="text-[11px] text-slate-450 mt-1 opacity-80 font-medium">
                                {new Date(activity.createdAt).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;