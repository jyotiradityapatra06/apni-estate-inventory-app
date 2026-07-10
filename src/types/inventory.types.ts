export interface StockItem {
  id: number;
  material: string;
  grade: string;
  qty: number;
  reserved: number;
  reorder: number;
  unit: string;
  location: string;
  daysLeft: number;
  trend: "up" | "down" | "stable";
  updated: string;
}
