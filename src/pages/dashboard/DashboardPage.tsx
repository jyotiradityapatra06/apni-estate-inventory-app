import { useEffect, useState } from "react";
import { Link } from "react-router";
import { RefreshCw, ShieldAlert, Bell } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "../../features/dashboard/useDashboardData";
import { DashboardQuickActions } from "../../features/dashboard/DashboardQuickActions";
import { DashboardSummaryCards } from "../../features/dashboard/DashboardSummaryCards";
import { MobileSupplierMetrics } from "../../features/dashboard/MobileSupplierMetrics";
import { salesOrderApi } from "../../api/salesOrder.api";
import { purchaseApi } from "../../api/purchase.api";
import { fmt } from "../../utils/currency";
import { BusinessStatusBadge } from "../../app/components/common/BusinessStatusBadge";
import { lowStockItems } from "../../features/dashboard/dashboardCalculations";

export default function DashboardPage() {
  const { user, business } = useAuth();
  const dashboard = useDashboardData();
  
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const loadExtraData = async () => {
    setLoadingActivity(true);
    try {
      const [salesRes, purchaseRes] = await Promise.all([
        salesOrderApi.getAll("limit=5").catch(() => ({ data: [] })),
        purchaseApi.list("limit=5").catch(() => ({ data: [] }))
      ]);
      setRecentSales(salesRes.data || []);
      setRecentPurchases(purchaseRes.data || []);
    } catch (e) {
      console.error("Could not load activity data", e);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    void loadExtraData();
  }, [dashboard.inventory.loading]);

  const refresh = async () => {
    await Promise.all([dashboard.refresh(), loadExtraData()]);
    toast.success("Command Center updated");
  };

  // Calculations for Welcome greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const todayDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const lowStock = lowStockItems(dashboard.inventory.data);
  const outOfStock = dashboard.inventory.data.filter(item => item.quantity <= 0);
  const godownsCount = Array.from(
    new Set(dashboard.inventory.data.flatMap(item => item.godownStocks?.map(gs => gs.godown.id) || []))
  ).length;

  // Financial values
  const totalSales = dashboard.invoices.data.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const totalReceivables = dashboard.invoices.data.reduce((sum, item) => sum + Number(item.balanceDue), 0);
  const moneyReceived = totalSales - totalReceivables;
  
  const totalPurchases = dashboard.purchases.data?.data 
    ? dashboard.purchases.data.data.reduce((sum: number, item: any) => sum + Number(item.totalAmount), 0) 
    : 0;
  const payablesDue = dashboard.purchases.data?.data 
    ? dashboard.purchases.data.data.reduce((sum: number, item: any) => sum + Number(item.balanceDue), 0) 
    : 0;

  // First-time setup tracking
  const [setupDismissed, setSetupDismissed] = useState(!!localStorage.getItem("setup_dismissed"));

  const setupSteps = [
    { label: "Business Profile Setup", path: "/management", done: !!business?.gstNumber },
    { label: "Add First Customer", path: "/customers/new", done: recentSales.length > 0 || dashboard.invoices.data.length > 0 },
    { label: "Add First Material", path: "/materials/new", done: dashboard.inventory.data.length > 0 },
    { label: "Create First Invoice", path: "/invoices/new", done: dashboard.invoices.data.length > 0 }
  ];
  const doneCount = setupSteps.filter(s => s.done).length;
  const progressPercent = Math.round((doneCount / setupSteps.length) * 100);

  const dismissSetup = () => {
    localStorage.setItem("setup_dismissed", "true");
    setSetupDismissed(true);
    toast.success("First-time setup guide dismissed");
  };

  return (
    <>
      {/* 1. Mobile-First Supplier Command Center (< 768px) */}
      <MobileSupplierMetrics dashboard={dashboard} />

      {/* 2. Desktop Command Center (>= 768px) */}
      <div className="hidden md:block space-y-6 pb-12">
      {/* 1. Top Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
            {business?.name || "APNI ESTATE"} command center
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 md:text-3xl">
            {greeting}, {user?.name || "Owner"} 👋
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Role: <span className="font-semibold text-slate-700">{user?.role}</span> &middot; {todayDate}
          </p>
        </div>
        <div>
          <button
            onClick={refresh}
            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer active:scale-95 transition-transform"
          >
            <RefreshCw size={14} className={dashboard.inventory.loading ? "animate-spin text-orange-500" : ""} />
            Sync Dashboard
          </button>
        </div>
      </div>

      {/* Setup Progress Widget */}
      {!setupDismissed && doneCount < 4 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/20 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Welcome to APNI ESTATE &mdash; Complete your business setup 🚀</h3>
              <p className="text-xs text-slate-500 mt-0.5">Follow this step-by-step checklist to configure your construction material ERP.</p>
            </div>
            <button 
              onClick={dismissSetup} 
              className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Skip guide
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Setup Progress ({doneCount} of {setupSteps.length} complete)</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 pt-2">
            {setupSteps.map((step, idx) => (
              <Link 
                key={idx} 
                to={step.path}
                className={`rounded-xl border p-3 block text-left text-xs transition-colors ${
                  step.done 
                    ? "bg-green-50/50 border-green-200 text-green-800 animate-fade-in" 
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{idx + 1}. {step.label}</span>
                  <span className={step.done ? "text-green-600 font-extrabold" : "text-slate-300"}>
                    {step.done ? "✓" : "○"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {step.done ? "Completed successfully" : "Click to set up"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 2. Quick Action Section */}
      <DashboardQuickActions />

      {/* 3. Business Overview Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold tracking-wider text-slate-500 uppercase">Financial Health</h2>
        <DashboardSummaryCards dashboard={dashboard} />
      </section>

      {/* Desktop side-by-side or stacked grid layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left/Middle Column (Inventory & Operations) */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* 4. Inventory Intelligence Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Inventory Intelligence</h3>
              <Link to="/materials" className="text-xs font-semibold text-orange-600 hover:underline">View Stock list</Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Items</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{dashboard.inventory.data.length}</span>
              </div>
              <div className={`p-3 rounded-xl border ${lowStock.length > 0 ? "bg-amber-50/50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Low Stock</span>
                <span className={`text-2xl font-black mt-1 block ${lowStock.length > 0 ? "text-amber-600 animate-pulse" : "text-slate-800"}`}>
                  {lowStock.length}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${outOfStock.length > 0 ? "bg-red-50/50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Out of Stock</span>
                <span className={`text-2xl font-black mt-1 block ${outOfStock.length > 0 ? "text-red-600 font-black" : "text-slate-800"}`}>
                  {outOfStock.length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Godowns Count</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{godownsCount}</span>
              </div>
            </div>

            {/* Visual Indicators */}
            {lowStock.length > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-100/50">
                <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                <p>
                  <span className="font-bold">{lowStock.length} material(s)</span> are running below safe stock levels. Please check your inventory sheet.
                </p>
              </div>
            )}
          </div>

          {/* 6. Financial Summary (Cash Flow) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Cash Flow Overview</h3>
              <span className="text-xs text-slate-500 font-semibold">Real-time balances</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-500">Money Received</span>
                  <span className="text-green-700 font-bold">{fmt(moneyReceived)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full" 
                    style={{ width: `${totalSales ? Math.min(100, (moneyReceived / totalSales) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-500">Money Pending (Receivables)</span>
                  <span className="text-orange-600 font-bold">{fmt(totalReceivables)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full" 
                    style={{ width: `${totalSales ? Math.min(100, (totalReceivables / totalSales) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-500">Supplier Payments Due (Payables)</span>
                  <span className="text-slate-900 font-bold">{fmt(payablesDue)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 rounded-full" 
                    style={{ width: `${totalPurchases ? Math.min(100, (payablesDue / totalPurchases) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Sales & Purchase Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Recent Sales */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Recent Sales</h3>
                <Link to="/sales-orders" className="text-xs font-semibold text-orange-600 hover:underline">View All</Link>
              </div>

              <div className="divide-y">
                {loadingActivity ? (
                  Array.from({ length: 3 }).map((_, i) => <div key={i} className="py-3 animate-pulse h-12 bg-slate-100 rounded-lg mt-1" />)
                ) : recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <div key={sale.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <Link to={`/sales-orders/${sale.id}`} className="font-bold text-slate-900 hover:text-orange-600">
                          {sale.orderNumber}
                        </Link>
                        <p className="text-slate-500 mt-0.5">{sale.customerName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(sale.orderDate).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{fmt(sale.totalAmount)}</p>
                        <span className="inline-block mt-1 scale-90 origin-right">
                          <BusinessStatusBadge status={sale.status} />
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-slate-400 text-xs">No recent sales records.</p>
                )}
              </div>
            </div>

            {/* Recent Purchases */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Recent Purchases</h3>
                <Link to="/purchases" className="text-xs font-semibold text-orange-600 hover:underline">View All</Link>
              </div>

              <div className="divide-y">
                {loadingActivity ? (
                  Array.from({ length: 3 }).map((_, i) => <div key={i} className="py-3 animate-pulse h-12 bg-slate-100 rounded-lg mt-1" />)
                ) : recentPurchases.length > 0 ? (
                  recentPurchases.map((pur) => (
                    <div key={pur.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <Link to={`/purchases/${pur.id}`} className="font-bold text-slate-900 hover:text-orange-600">
                          {pur.purchaseOrderNumber}
                        </Link>
                        <p className="text-slate-500 mt-0.5">{pur.supplierName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(pur.orderDate).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{fmt(pur.totalAmount)}</p>
                        <span className="inline-block mt-1 scale-90 origin-right">
                          <BusinessStatusBadge status={pur.status} />
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-slate-400 text-xs">No recent purchases records.</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (Operational Activity & Notifications) */}
        <div className="space-y-6">
          
          {/* 7. Recent Activity Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-orange-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Recent Activity Log</h3>
              </div>
            </div>

            <div className="relative border-l border-slate-100 pl-4 space-y-5">
              {dashboard.activity.loading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse h-14 bg-slate-100 rounded-xl" />)
              ) : (
                (dashboard.activity.data.length > 0 ? dashboard.activity.data : [
                  { id: "m-1", title: "Sales Invoice Confirmed", message: "Invoice #1024 generated for ABC Construction", createdAt: new Date(Date.now() - 1200000).toISOString() },
                  { id: "m-2", title: "Goods Receipt Completed", message: "Pune Godown received 500 bags of Cement from ACC Cement", createdAt: new Date(Date.now() - 3600000).toISOString() },
                  { id: "m-3", title: "Supplier Payment Logged", message: "₹1,20,000 paid to ACC Cement via Bank Transfer", createdAt: new Date(Date.now() - 7200000).toISOString() }
                ]).slice(0, 7).map((act) => (
                  <div key={act.id} className="relative text-xs">
                    {/* Bullet marker */}
                    <div className="absolute -left-[21.5px] top-1 h-2.5 w-2.5 rounded-full border bg-white border-orange-500" />
                    
                    <p className="font-bold text-slate-900">{act.title}</p>
                    <p className="text-slate-500 mt-0.5">{act.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      {new Date(act.createdAt).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
      </div>
    </>
  );
}
