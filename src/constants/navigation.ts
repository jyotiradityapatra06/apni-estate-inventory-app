import { Home, BarChart2, Package, Truck, User } from "lucide-react";

export const tabs = [
  { id: "home", label: "Home", icon: Home, path: "/dashboard" },
  { id: "finance", label: "Finance", icon: BarChart2, path: "/sales" },
  { id: "stock", label: "Stock", icon: Package, path: "/inventory" },
  { id: "delivery", label: "Delivery", icon: Truck, path: "/deliveries" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

export const badges: Record<string, number> = {
  "/sales": 2,
  "/inventory": 8,
  "/deliveries": 3,
};
