import { Receivable, Payable, InvoiceItem } from "../types/sales.types";

export const receivables: Receivable[] = [
  { id: 1, name: "Ram Traders", gstin: "27AABFR5987M1ZP", terms: "30-day Credit", total: 485000, paid: 200000, due: "2025-07-18", overdue: 0, risk: "low" },
  { id: 2, name: "Shyam Hardware", gstin: "27AADCS2341K1ZR", terms: "15-day Credit", total: 320000, paid: 120000, due: "2025-07-05", overdue: 5, risk: "medium" },
  { id: 3, name: "Patel Cement Store", gstin: "27AAHFP6219N1ZK", terms: "Cash on Delivery", total: 287500, paid: 50000, due: "2025-06-25", overdue: 15, risk: "high" },
  { id: 4, name: "Mehta Construction", gstin: "27AADCM4719L1ZS", terms: "30-day Credit", total: 640000, paid: 400000, due: "2025-07-22", overdue: 0, risk: "low" },
  { id: 5, name: "Suresh Infra Pvt Ltd", gstin: "27AACFS8891B1ZC", terms: "15-day Credit", total: 195000, paid: 80000, due: "2025-07-08", overdue: 2, risk: "medium" },
];

export const payables: Payable[] = [
  { id: 1, name: "UltraTech Cement Ltd", terms: "30-day Credit", total: 890000, paid: 500000, due: "2025-07-20", overdue: 0, risk: "low" },
  { id: 2, name: "TATA Steel (TMT)", terms: "15-day Credit", total: 1240000, paid: 900000, due: "2025-07-12", overdue: 0, risk: "low" },
  { id: 3, name: "Mahavir Sand Suppliers", terms: "Cash on Delivery", total: 156000, paid: 156000, due: "2025-07-01", overdue: 0, risk: "low" },
];

export const invoiceItems: InvoiceItem[] = [
  { material: "OPC 53 Grade Cement", unit: "Bags", qty: 200, rate: 385, discount: 5, loading: 2000, total: 73150 },
  { material: "Fe500 TMT Bar 12mm", unit: "Tonnes", qty: 2.5, rate: 68000, discount: 0, loading: 1500, total: 171500 },
];
