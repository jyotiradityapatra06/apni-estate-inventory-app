import { LucideIcon } from "lucide-react";

export interface Alert {
  id: number;
  severity: "error" | "warning";
  icon: LucideIcon;
  title: string;
  impact: string;
  action: string;
  tag: string;
}

export interface WeekData {
  day: string;
  sales: number;
  col: number;
}

export interface InvData {
  name: string;
  value: number;
  color: string;
}
