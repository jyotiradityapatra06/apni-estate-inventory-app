import { Home, Package, Truck, User } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  requiredPermission?: string;
  allowedRoles?: string[];
}

export const tabs: TabItem[] = [
  { id: "home", label: "Dashboard", icon: Home, path: "/dashboard", requiredPermission: "dashboard:view" },
  { id: "stock", label: "Stock", icon: Package, path: "/inventory", requiredPermission: "inventory:view" },
  { id: "delivery", label: "Deliveries", icon: Truck, path: "/deliveries", requiredPermission: "deliveries:view" },
  { id: "management", label: "Management", icon: User, path: "/management" },
];

export const driverTabs: TabItem[] = [];

export const badges: Record<string, number> = {
  "/inventory": 8,
  "/deliveries": 3,
};
