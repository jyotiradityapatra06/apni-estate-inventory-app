import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Boxes,
  ClipboardList,
  Factory,
  FileClock,
  FileText,
  Home,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
  Landmark,
  BookOpen,
  ReceiptIndianRupee,
  WalletCards,
  BarChart3,
  Undo2,
  CornerUpLeft,
  ArrowLeftRight,
  SlidersHorizontal,
  DollarSign,
  Truck
} from "lucide-react";
import type { User } from "../context/AuthContext";
import { hasPermission, hasRole } from "../utils/permissions";

export type NavigationGroup = "Dashboard" | "Inventory" | "Sales" | "Purchase" | "Finance" | "Reports" | "Management" | "Account";

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  group: NavigationGroup;
  requiredPermission?: string;
  allowedRoles?: string[];
  aliases?: string[];
}

export const navigationItems: NavigationItem[] = [
  // 1. Dashboard Group
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: Home, group: "Dashboard", requiredPermission: "dashboard:view" },

  // 2. Inventory Group
  { id: "materials", label: "Materials", path: "/materials", icon: Package, group: "Inventory", requiredPermission: "inventory:view" },
  { id: "stock-overview", label: "Stock Overview", path: "/inventory", icon: Boxes, group: "Inventory", requiredPermission: "inventory:view", aliases: ["/inventory"] },
  { id: "godowns", label: "Godowns & Warehouses", path: "/godowns", icon: Warehouse, group: "Inventory", requiredPermission: "godowns:view" },
  { id: "stock-transfer", label: "Stock Transfer", path: "/transfers", icon: ArrowLeftRight, group: "Inventory", requiredPermission: "godowns:view", aliases: ["/transfers", "/stock-transfers"] },
  { id: "stock-adjustments", label: "Stock Adjustments", path: "/materials?action=adjust", icon: SlidersHorizontal, group: "Inventory", requiredPermission: "inventory:view" },

  // 3. Sales Group
  { id: "customers", label: "Customers", path: "/customers", icon: Users, group: "Sales", requiredPermission: "customers:view" },
  { id: "sales-orders", label: "Sales Orders", path: "/sales-orders", icon: ShoppingCart, group: "Sales", requiredPermission: "sales:view", aliases: ["/sales-orders"] },
  { id: "invoices", label: "Invoices", path: "/invoices", icon: FileText, group: "Sales", requiredPermission: "sales:view" },
  { id: "sales-returns", label: "Sales Returns", path: "/sales-returns", icon: Undo2, group: "Sales", requiredPermission: "sales-returns:view" },

  // 4. Purchase Group
  { id: "suppliers", label: "Suppliers", path: "/suppliers", icon: Factory, group: "Purchase", requiredPermission: "suppliers:view" },
  { id: "purchases", label: "Purchase Orders", path: "/purchases", icon: ClipboardList, group: "Purchase", requiredPermission: "purchases:view" },
  { id: "goods-receipt", label: "Goods Receipt", path: "/purchase-history", icon: FileClock, group: "Purchase", requiredPermission: "purchases:view" },
  { id: "purchase-returns", label: "Purchase Returns", path: "/purchase-returns", icon: CornerUpLeft, group: "Purchase", requiredPermission: "purchase-returns:view" },

  // 5. Finance Group
  { id: "payments", label: "Payments", path: "/financials/payments", icon: DollarSign, group: "Finance", requiredPermission: "financials:view" },
  { id: "receivables", label: "Receivables", path: "/financials/receivables", icon: ReceiptIndianRupee, group: "Finance", requiredPermission: "financials:view" },
  { id: "payables", label: "Payables", path: "/financials/payables", icon: Landmark, group: "Finance", requiredPermission: "financials:view" },
  { id: "expenses", label: "Expenses", path: "/expenses", icon: WalletCards, group: "Finance", requiredPermission: "expenses:view" },
  { id: "ledger", label: "Payments & Transactions", path: "/financials/ledger", icon: BookOpen, group: "Finance", requiredPermission: "financials:view" },

  // 6. Reports Group
  { id: "report-sales", label: "Sales Reports", path: "/reports/sales", icon: BarChart3, group: "Reports", requiredPermission: "reports:operational" },
  { id: "report-purchases", label: "Purchase Reports", path: "/reports/purchases", icon: BarChart3, group: "Reports", requiredPermission: "reports:operational" },
  { id: "report-inventory", label: "Inventory Reports", path: "/reports/inventory", icon: BarChart3, group: "Reports", requiredPermission: "reports:operational" },
  { id: "report-gst", label: "GST Summary", path: "/reports/gst", icon: BarChart3, group: "Reports", requiredPermission: "reports:financial" },
  { id: "report-profit-loss", label: "Profit & Loss", path: "/reports/profit-loss", icon: BarChart3, group: "Reports", requiredPermission: "reports:financial" },

  // 7. Management Group
  { id: "team-members", label: "Team Members", path: "/management/team", icon: Users, group: "Management", allowedRoles: ["OWNER", "MANAGER"] },
  { id: "business-profile", label: "Business Profile", path: "/management", icon: Settings, group: "Management", allowedRoles: ["OWNER", "MANAGER"] }
];

export const canViewNavigationItem = (item: NavigationItem, user: User | null) => {
  if (!user) return false;
  if (item.allowedRoles && !hasRole(user, item.allowedRoles)) return false;
  return !item.requiredPermission || hasPermission(user, item.requiredPermission);
};

export const getVisibleNavigation = (user: User | null) => navigationItems.filter((item) => canViewNavigationItem(item, user));
export const getDesktopNavigation = (user: User | null) => getVisibleNavigation(user);

export const getMobileNavigation = (user: User | null): NavigationItem[] => {
  if (user?.role?.toUpperCase() === "DRIVER") {
    return [
      { id: "driver-trips", label: "My Trips", path: "/driver/trips", icon: Truck, group: "Dashboard" },
    ];
  }
  const navs: NavigationItem[] = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: Home, group: "Dashboard" },
    { id: "inventory", label: "Inventory", path: "/materials", icon: Package, group: "Inventory" },
    { id: "sales", label: "Sales", path: "/sales-orders", icon: ShoppingCart, group: "Sales" },
    { id: "finance", label: "Finance", path: "/financials/payments", icon: Landmark, group: "Finance" }
  ];
  return navs;
};

export const isNavigationItemActive = (item: NavigationItem, pathname: string) =>
  item.path.startsWith("/") && (pathname === item.path || pathname.startsWith(`${item.path}/`) || (item.aliases ?? []).some((alias) => pathname === alias || pathname.startsWith(`${alias}/`)));

// Compatibility exports
export type TabItem = NavigationItem;
export const tabs = navigationItems;
export const moreItems = navigationItems;
export const driverTabs: NavigationItem[] = [];
export const badges: Record<string, number> = {};
export const moreNavigationItem = { id: "more", label: "More", path: "#more", icon: Boxes, group: "Account" };
