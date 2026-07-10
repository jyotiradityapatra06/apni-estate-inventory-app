export interface Transaction {
  id: string;
  date: string;
  reference: string;
  type: "invoice" | "payment" | "credit note";
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status: "pending" | "paid" | "partially paid" | "completed";
}

export interface Party {
  id: number;
  name: string;
  phone?: string;
  creditTerms?: string;
  totalInvoiced?: number;
  amountPaid?: number;
  remainingBalance?: number;
  overdueDays?: number;
  riskLevel?: "low" | "medium" | "high";
  transactions?: Transaction[];
}

export interface Receivable extends Party {
  gstin: string;
  terms: string;
  total: number;
  paid: number;
  due: string;
  overdue: number;
  risk: "low" | "medium" | "high";
}

export interface Payable extends Party {
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
