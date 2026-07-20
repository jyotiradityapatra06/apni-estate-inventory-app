import { StockItem } from "../types/inventory.types";

export const stockItems: StockItem[] = [
  { id: 1, material: "OPC 53 Grade Cement", grade: "Premium", qty: 840, reserved: 200, reorder: 500, unit: "Bags", location: "Godown A", daysLeft: 3, trend: "down", updated: "2h ago" },
  { id: 2, material: "Fe500 TMT Bar 12mm", grade: "IS:1786", qty: 18.5, reserved: 5, reorder: 10, unit: "Tonnes", location: "Main Yard", daysLeft: 6, trend: "stable", updated: "4h ago" },
  { id: 3, material: "M-Sand (Zone II)", grade: "Zone II", qty: 320, reserved: 80, reorder: 400, unit: "Cu.Ft", location: "Main Yard", daysLeft: 2, trend: "down", updated: "1h ago" },
  { id: 4, material: "Red Bricks (Wire Cut)", grade: "Class A", qty: 45000, reserved: 10000, reorder: 20000, unit: "Pcs", location: "Godown B", daysLeft: 8, trend: "stable", updated: "6h ago" },
  { id: 5, material: "20mm Aggregate", grade: "Crushed", qty: 85, reserved: 20, reorder: 60, unit: "Tonnes", location: "Main Yard", daysLeft: 5, trend: "up", updated: "3h ago" },
];
