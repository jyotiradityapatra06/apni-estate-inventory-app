import type { LucideIcon } from "lucide-react";
import { PackageMinus, PackagePlus } from "lucide-react";
import type { User } from "../context/AuthContext";
import { hasPermission } from "../utils/permissions";

export interface QuickAction { id: string; label: string; path: string; icon: LucideIcon; requiredPermission: string; }

export const quickActions: QuickAction[] = [
  { id: "stock-in", label: "Stock In", path: "/materials?action=stock-in", icon: PackagePlus, requiredPermission: "stock:in" },
  { id: "stock-out", label: "Stock Out", path: "/materials?action=stock-out", icon: PackageMinus, requiredPermission: "stock:out" },
];

export const getVisibleQuickActions = (user: User | null) => quickActions.filter((action) => hasPermission(user, action.requiredPermission));
