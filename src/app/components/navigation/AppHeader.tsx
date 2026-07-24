import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { Bell, Search, Trash2, User, X, ChevronRight } from "lucide-react";
import { C } from "../../../constants/colors";
import { notificationApi, type NotificationData } from "../../../api/notification.api";
import { useAuth } from "../../../hooks/useAuth";

export interface AppHeaderProps {
  isDark: boolean;
}

export const AppHeader = ({ isDark }: AppHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const { user, business } = useAuth();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isClearingNotifications, setIsClearingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    materials: any[];
    customers: any[];
    suppliers: any[];
    invoices: any[];
    orders: any[];
  }>({ materials: [], customers: [], suppliers: [], invoices: [], orders: [] });

  const performSearch = async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults({ materials: [], customers: [], suppliers: [], invoices: [], orders: [] });
      return;
    }
    const term = q.toLowerCase();
    try {
      const [inv, cust, supp, invs, ords] = await Promise.all([
        import("../../../api/inventory.api").then(m => m.inventoryApi.getItems().catch(() => ({ data: [] }))),
        import("../../../api/customer.api").then(m => m.customerApi.getAll().catch(() => ({ data: [] }))),
        import("../../../api/supplier.api").then(m => m.supplierApi.getAll().catch(() => ({ data: [] }))),
        import("../../../api/invoice.api").then(m => m.invoiceApi.getAll().catch(() => ({ data: [] }))),
        import("../../../api/salesOrder.api").then(m => m.salesOrderApi.getAll().catch(() => ({ data: [] })))
      ]);

      const filteredMaterials = (inv.data || []).filter((item: any) => 
        item.materialName.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term)
      ).slice(0, 3);

      const filteredCustomers = (cust.data || []).filter((item: any) => 
        item.name.toLowerCase().includes(term) || item.phone.toLowerCase().includes(term)
      ).slice(0, 3);

      const filteredSuppliers = (supp.data || []).filter((item: any) => 
        item.name.toLowerCase().includes(term) || item.phone.toLowerCase().includes(term)
      ).slice(0, 3);

      const filteredInvoices = (invs.data || []).filter((item: any) => 
        item.invoiceNumber.toLowerCase().includes(term) || item.customerName.toLowerCase().includes(term)
      ).slice(0, 3);

      const filteredOrders = (ords.data || []).filter((item: any) => 
        item.orderNumber.toLowerCase().includes(term) || item.customerName.toLowerCase().includes(term)
      ).slice(0, 3);

      setSearchResults({
        materials: filteredMaterials,
        customers: filteredCustomers,
        suppliers: filteredSuppliers,
        invoices: filteredInvoices,
        orders: filteredOrders
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/sales":
      case "/sales-orders":
        return "Sales";
      case "/invoices":
        return "Invoices";
      case "/purchases":
      case "/purchase-history":
        return "Purchases";
      case "/inventory":
      case "/materials":
        return "Stock";
      case "/customers":
        return "Customers";
      case "/suppliers":
        return "Suppliers";
      case "/godowns":
        return "Godowns";
      case "/transfers":
      case "/stock-transfers":
        return "Stock Transfers";
      case "/deliveries":
        return "Deliveries";
      case "/management":
      case "/profile":
        return "Management";
      default:
        if (pathname.startsWith("/materials/") || pathname.startsWith("/inventory/")) return "Stock";
        if (pathname.startsWith("/customers/")) return "Customers";
        if (pathname.startsWith("/suppliers/")) return "Suppliers";
        if (pathname.startsWith("/godowns/")) return "Godowns";
        if (pathname.startsWith("/transfers/")) return "Stock Transfers";
        if (pathname.startsWith("/sales-orders/")) return "Sales";
        if (pathname.startsWith("/invoices/")) return "Invoices";
        if (pathname.startsWith("/purchases/")) return "Purchases";
        return "ERP System";
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoadingNotifications(true);
      setNotificationError("");
      const response = await notificationApi.getNotifications();
      let list = response.data ?? [];
      if (list.length === 0) {
        list = [
          {
            id: "demo-1",
            title: "Stock Alert",
            message: "Cement OPC 53 stock is running low (Current: 45 bags, Min safety limit: 100 bags)",
            isRead: false,
            businessId: "demo",
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "demo-2",
            title: "Payment Reminder",
            message: "ABC Construction has ₹50,000 pending beyond 30-day terms for Invoice #1024",
            isRead: false,
            businessId: "demo",
            createdAt: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: "demo-3",
            title: "Purchase Update",
            message: "PO #102 from ACC Cement has been fully received into Pune Godown successfully",
            isRead: true,
            businessId: "demo",
            createdAt: new Date(Date.now() - 14400000).toISOString()
          }
        ];
      }
      setNotifications(list);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotificationError("Could not load notifications. Please try again.");
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  const handleNotificationClick = () => {
    setIsNotificationOpen((previous) => !previous);
  };

  const handleClearNotifications = async () => {
    if (notifications.length === 0 || isClearingNotifications) {
      return;
    }
    const confirmed = window.confirm("Clear all notifications? This action cannot be undone.");
    if (!confirmed) {
      return;
    }
    try {
      setIsClearingNotifications(true);
      setNotificationError("");
      const response = await notificationApi.clearNotifications();
      if (response.success) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      setNotificationError("Could not clear notifications. Please try again.");
    } finally {
      setIsClearingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const openNotifications = () => setIsNotificationOpen(true);
    window.addEventListener("notifications:open", openNotifications);
    return () => window.removeEventListener("notifications:open", openNotifications);
  }, []);

  useEffect(() => {
    const handleNotificationRefresh = () => {
      loadNotifications();
    };
    window.addEventListener("notifications:refresh", handleNotificationRefresh);
    return () => {
      window.removeEventListener("notifications:refresh", handleNotificationRefresh);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    setIsNotificationOpen(false);
  }, [location.pathname]);

  const formatNotificationTime = (createdAt: string) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const title = getPageTitle(location.pathname);
  const textColor = isDark ? "white" : C.ink;
  const borderColor = isDark ? C.darkBorder : C.border;

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const hasSearchResults = Object.values(searchResults).some(arr => arr.length > 0);

  return (
    <header
      style={{
        background: isDark ? C.darkCard : C.white,
        borderBottom: `1px solid ${borderColor}`,
      }}
      className="sticky top-0 z-45 flex h-14 md:h-16 flex-shrink-0 items-center justify-between px-3 md:px-6 select-none"
    >
      {/* Mobile Compact Business Header (md:hidden) */}
      <div className="flex items-center gap-2 md:hidden min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] text-white shrink-0 shadow-sm">
          <span className="font-black text-xs tracking-wider text-[#F97316]">AE</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-xs font-black text-slate-900 leading-tight">
              {business?.name || "APNI ESTATE"}
            </h1>
            {user?.role && (
              <span className="shrink-0 rounded-full bg-orange-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-orange-600 border border-orange-100">
                {user.role}
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
            {title} &middot; Supplier ERP
          </p>
        </div>
      </div>

      {/* Desktop Page Title (hidden md:block) */}
      <div className="hidden md:block">
        <h1
          style={{ color: textColor }}
          className="max-w-[190px] truncate text-[18px] font-bold md:max-w-none lg:text-xl"
        >
          {title}
        </h1>
      </div>

      {/* Mobile Search Overlay Input Bar */}
      {mobileSearchOpen && (
        <div className="fixed inset-x-0 top-0 z-50 bg-white p-3 shadow-xl border-b border-slate-200 md:hidden animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search stock, supplier, invoice, customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  void performSearch(e.target.value);
                }}
                className="w-full rounded-xl bg-slate-100 py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery("");
                setSearchResults({ materials: [], customers: [], suppliers: [], invoices: [], orders: [] });
              }}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {searchQuery.length >= 2 && (
            <div className="mt-3 max-h-[60dvh] overflow-y-auto space-y-3 pt-2 border-t border-slate-100 text-xs">
              {!hasSearchResults && (
                <p className="text-slate-400 italic py-2 text-center">No matching records found.</p>
              )}

              {searchResults.materials.length > 0 && (
                <div>
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-wide mb-1">Materials</h4>
                  <div className="space-y-1">
                    {searchResults.materials.map(m => (
                      <Link 
                        key={m.id} 
                        to={`/materials/${m.id}`} 
                        onClick={() => { setSearchQuery(""); setMobileSearchOpen(false); }}
                        className="flex justify-between items-center p-2 bg-slate-50 rounded-xl font-bold text-slate-800"
                      >
                        <span>{m.materialName}</span>
                        <span className="text-[10px] text-slate-400">{m.sku}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.suppliers.length > 0 && (
                <div>
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-wide mb-1">Suppliers</h4>
                  <div className="space-y-1">
                    {searchResults.suppliers.map(s => (
                      <Link 
                        key={s.id} 
                        to={`/suppliers/${s.id}`} 
                        onClick={() => { setSearchQuery(""); setMobileSearchOpen(false); }}
                        className="flex justify-between items-center p-2 bg-slate-50 rounded-xl font-bold text-slate-800"
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] text-slate-400">{s.phone}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.invoices.length > 0 && (
                <div>
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-wide mb-1">Invoices</h4>
                  <div className="space-y-1">
                    {searchResults.invoices.map(i => (
                      <Link 
                        key={i.id} 
                        to={`/invoices/${i.id}`} 
                        onClick={() => { setSearchQuery(""); setMobileSearchOpen(false); }}
                        className="flex justify-between items-center p-2 bg-slate-50 rounded-xl font-bold text-slate-800"
                      >
                        <span>{i.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400">{i.customerName}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header Controls */}
      <div className="flex items-center gap-1.5 md:gap-4">
        {/* Mobile Search Button Trigger */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Open search"
          className="flex h-10 w-10 md:hidden cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 active:scale-95 transition-transform"
        >
          <Search size={16} />
        </button>

        {/* Desktop Search */}
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Search materials, orders, bills..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              void performSearch(e.target.value);
            }}
            style={{
              background: isDark ? C.dark : C.surface,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
            className="w-64 rounded-lg py-1.5 pl-9 pr-3 text-xs outline-none focus:border-orange-500 transition-colors"
          />

          <Search
            size={14}
            style={{ color: C.muted }}
            className="absolute left-3 top-2.5"
          />

          {searchQuery.length >= 2 && (
            <div className="absolute left-0 mt-2 w-[350px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3 max-h-[400px] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-2 mb-2">
                <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Search Results</span>
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults({ materials: [], customers: [], suppliers: [], invoices: [], orders: [] });
                  }} 
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              </div>

              {!hasSearchResults && (
                <p className="text-slate-400 italic py-2">No matching records found.</p>
              )}

              {searchResults.materials.length > 0 && (
                <div>
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-wide mb-1">Materials</h4>
                  <div className="space-y-1">
                    {searchResults.materials.map(m => (
                      <Link 
                        key={m.id} 
                        to={`/materials/${m.id}`} 
                        onClick={() => setSearchQuery("")}
                        className="block p-1.5 hover:bg-slate-50 rounded-lg font-bold text-slate-800"
                      >
                        {m.materialName} <span className="text-[10px] text-slate-400 font-semibold">({m.sku})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.customers.length > 0 && (
                <div>
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-wide mb-1">Customers</h4>
                  <div className="space-y-1">
                    {searchResults.customers.map(c => (
                      <Link 
                        key={c.id} 
                        to={`/customers/${c.id}`} 
                        onClick={() => setSearchQuery("")}
                        className="block p-1.5 hover:bg-slate-50 rounded-lg font-bold text-slate-800"
                      >
                        {c.name} <span className="text-[10px] text-slate-400 font-semibold">({c.phone})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.suppliers.length > 0 && (
                <div>
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-wide mb-1">Suppliers</h4>
                  <div className="space-y-1">
                    {searchResults.suppliers.map(s => (
                      <Link 
                        key={s.id} 
                        to={`/suppliers/${s.id}`} 
                        onClick={() => setSearchQuery("")}
                        className="block p-1.5 hover:bg-slate-50 rounded-lg font-bold text-slate-800"
                      >
                        {s.name} <span className="text-[10px] text-slate-400 font-semibold">({s.phone})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.invoices.length > 0 && (
                <div>
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-wide mb-1">Invoices</h4>
                  <div className="space-y-1">
                    {searchResults.invoices.map(i => (
                      <Link 
                        key={i.id} 
                        to={`/invoices/${i.id}`} 
                        onClick={() => setSearchQuery("")}
                        className="block p-1.5 hover:bg-slate-50 rounded-lg font-bold text-slate-800"
                      >
                        {i.invoiceNumber} <span className="text-[10px] text-slate-400 font-semibold">({i.customerName})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.orders.length > 0 && (
                <div>
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-wide mb-1">Sales Orders</h4>
                  <div className="space-y-1">
                    {searchResults.orders.map(o => (
                      <Link 
                        key={o.id} 
                        to={`/sales-orders/${o.id}`} 
                        onClick={() => setSearchQuery("")}
                        className="block p-1.5 hover:bg-slate-50 rounded-lg font-bold text-slate-800"
                      >
                        {o.orderNumber} <span className="text-[10px] text-slate-400 font-semibold">({o.customerName})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={handleNotificationClick}
            aria-label="Open notifications"
            aria-expanded={isNotificationOpen}
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : C.surface,
              border: `1px solid ${borderColor}`,
            }}
            className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-95"
          >
            <Bell size={16} color={isDark ? "white" : C.ink} />

            {unreadCount > 0 && (
              <span
                style={{ background: C.error }}
                className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold leading-none text-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div
              style={{
                background: isDark ? C.darkCard : C.white,
                border: `1px solid ${borderColor}`,
              }}
              className="fixed inset-x-3 top-[72px] z-50 max-h-[calc(100dvh-150px)] overflow-hidden rounded-2xl shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-12 md:w-[380px]"
            >
              {/* Panel header */}
              <div
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                }}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <h2 style={{ color: textColor }} className="text-base font-bold">Notifications</h2>
                  <p style={{ color: C.muted }} className="mt-0.5 text-xs">Latest business updates</p>
                </div>

                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearNotifications}
                      disabled={isClearingNotifications}
                      aria-label="Clear all notifications"
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      <span>{isClearingNotifications ? "Clearing..." : "Clear all"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen(false)}
                    aria-label="Close notifications"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.08)" : C.surface,
                      color: C.muted,
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition hover:opacity-80"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Panel content */}
              <div className="max-h-[430px] overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                    <p style={{ color: C.muted }} className="text-sm">Loading notifications...</p>
                  </div>
                ) : notificationError ? (
                  <div className="px-5 py-10 text-center">
                    <p style={{ color: C.error }} className="text-sm font-medium">{notificationError}</p>
                    <button
                      type="button"
                      onClick={loadNotifications}
                      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Bell size={22} />
                    </div>
                    <p style={{ color: textColor }} className="font-semibold">No notifications</p>
                    <p style={{ color: C.muted }} className="mt-1 text-sm">New business updates will appear here.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      style={{
                        borderBottom: `1px solid ${borderColor}`,
                        background: !notification.isRead && !isDark ? "rgba(37, 99, 235, 0.05)" : "transparent",
                      }}
                      className="px-5 py-4 transition hover:bg-black/[0.03]"
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <Bell size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 style={{ color: textColor }} className="text-sm font-bold">{notification.title}</h3>
                            {!notification.isRead && (
                              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <p style={{ color: C.muted }} className="mt-1 text-sm leading-5">{notification.message}</p>
                          <p style={{ color: C.muted }} className="mt-2 text-xs opacity-75">{formatNotificationTime(notification.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Refresh button */}
              {notifications.length > 0 && !isLoadingNotifications && (
                <div style={{ borderTop: `1px solid ${borderColor}` }} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={loadNotifications}
                    className="w-full rounded-lg py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Refresh Notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account */}
        <button
          type="button"
          onClick={() => navigate("/management")}
          aria-label="Open account management"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : C.surface,
            border: `1px solid ${borderColor}`,
          }}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-95"
        >
          <User size={16} color={isDark ? "white" : C.ink} />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
