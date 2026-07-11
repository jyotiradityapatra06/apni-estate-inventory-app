import { Home, BarChart2, Package, Truck, User, Users } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  requiredPermission?: string;
  allowedRoles?: string[];
}

export const tabs: TabItem[] = [
  { id: "home", label: "Home", icon: Home, path: "/dashboard", requiredPermission: "dashboard:view" },
  { id: "finance", label: "Finance", icon: BarChart2, path: "/sales", requiredPermission: "sales:view" },
  { id: "stock", label: "Stock", icon: Package, path: "/inventory", requiredPermission: "inventory:view" },
  { id: "delivery", label: "Delivery", icon: Truck, path: "/deliveries", requiredPermission: "deliveries:view" },
  { id: "team", label: "Team", icon: Users, path: "/team", requiredPermission: "team:manage" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

export const driverTabs: TabItem[] = [
  { id: "driver-home", label: "Home", icon: Home, path: "/driver" },
  { id: "driver-trips", label: "My Trips", icon: Truck, path: "/driver" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

export const badges: Record<string, number> = {
  "/sales": 2,
  "/inventory": 8,
  "/deliveries": 3,
};
