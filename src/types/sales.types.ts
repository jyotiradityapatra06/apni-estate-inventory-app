export interface Receivable {
  id: number;
  name: string;
  gstin: string;
  terms: string;
  total: number;
  paid: number;
  due: string;
  overdue: number;
  risk: "low" | "medium" | "high";
}

export interface Payable {
  id: number;
  name: string;
  gstin?: string;
  terms: string;
  total: number;
  paid: number;
  due: string;
  overdue: number;
  risk: "low" | "medium" | "high";
}

export interface InvoiceItem {
  material: string;
  unit: string;
  qty: number;
  rate: number;
  discount: number;
  loading: number;
  total: number;
}
