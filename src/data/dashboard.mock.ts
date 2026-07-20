import { Package, Truck, IndianRupee } from "lucide-react";
import { WeekData, InvData, Alert } from "../types/dashboard.types";

export const weekData: WeekData[] = [
  { day: "Mon", sales: 1240000, col: 980000 },
  { day: "Tue", sales: 890000, col: 1120000 },
  { day: "Wed", sales: 1560000, col: 740000 },
  { day: "Thu", sales: 2100000, col: 1380000 },
  { day: "Fri", sales: 1780000, col: 1650000 },
  { day: "Sat", sales: 980000, col: 820000 },
  { day: "Today", sales: 1450000, col: 610000 },
];

export const invData: InvData[] = [
  { name: "Cement", value: 42, color: "#2A4CD6" },
  { name: "TMT Bars", value: 26, color: "#10B981" },
  { name: "Sand", value: 17, color: "#FFB300" },
  { name: "Bricks & Agg.", value: 15, color: "#EF4444" },
];

export const alerts: Alert[] = [
  {
    id: 1,
    severity: "error",
    icon: Package,
    title: "8 items below reorder level",
    impact: "Risk of stockout in 2-3 days",
    action: "Review Stock",
    tag: "CRITICAL",
  },
  {
    id: 2,
    severity: "warning",
    icon: Truck,
    title: "3 delivery runs unassigned",
    impact: "₹4,20,000 orders pending dispatch",
    action: "Assign Drivers",
    tag: "URGENT",
  },
  {
    id: 3,
    severity: "warning",
    icon: IndianRupee,
    title: "2 accounts overdue >15 days",
    impact: "₹2,87,500 at collection risk",
    action: "Call Customers",
    tag: "FOLLOW-UP",
  },
];
