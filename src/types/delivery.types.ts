export interface Delivery {
  id: number;
  status: "on_way" | "loading" | "awaiting" | "delivered" | "arrived" | "exception";
  customer: string;
  site: string;
  material: string;
  driver: string | null;
  vehicle: string | null;
  eta: string | null;
  contact: string;
  exception: string | null;
}

export interface StatusMetaItem {
  label: string;
  color: string;
  bg: string;
}
