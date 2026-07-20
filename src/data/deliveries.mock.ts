import { C } from "../constants/colors";
import { Delivery, StatusMetaItem } from "../types/delivery.types";

export const deliveries: Delivery[] = [
  { id: 1, status: "on_way", customer: "Ram Traders", site: "Hadapsar Site, Pune", material: "OPC Cement 200 Bags", driver: "Prakash Yadav", vehicle: "MH-12 AB 7890", eta: "14:45", contact: "+91 98765 43210", exception: "8-min delay — NH16 traffic" },
  { id: 2, status: "loading", customer: "Mehta Construction", site: "Wakad Plot No. 47", material: "Fe500 TMT 2.5T + Sand 40 Cu.Ft", driver: "Ramesh Gawde", vehicle: "MH-14 GH 2341", eta: "16:20", contact: "+91 87654 32109", exception: null },
  { id: 3, status: "awaiting", customer: "Suresh Infra Pvt Ltd", site: "Pimpri Industrial Area", material: "Red Bricks 15,000 Pcs", driver: null, vehicle: null, eta: "18:00", contact: "+91 76543 21098", exception: null },
  { id: 4, status: "delivered", customer: "Shyam Hardware", site: "Kothrud Depot", material: "20mm Aggregate 5T", driver: "Vijay Kamble", vehicle: "MH-12 PQ 5512", eta: "11:30", contact: "+91 65432 10987", exception: null },
];

export const statusMeta: Record<Delivery["status"], StatusMetaItem> = {
  awaiting: { label: "Awaiting Assignment", color: C.muted, bg: "rgba(255,255,255,0.08)" },
  loading: { label: "Loading", color: C.warning, bg: "rgba(255,179,0,0.15)" },
  on_way: { label: "On the Way", color: C.blue, bg: "rgba(42,76,214,0.15)" },
  arrived: { label: "Arrived", color: C.success, bg: "rgba(16,185,129,0.15)" },
  delivered: { label: "Delivered", color: C.success, bg: "rgba(16,185,129,0.15)" },
  exception: { label: "Exception", color: C.error, bg: "rgba(239,68,68,0.15)" },
};
