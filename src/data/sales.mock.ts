import { Receivable, Payable, InvoiceItem } from "../types/sales.types";

export const receivables: Receivable[] = [
  {
    id: 1,
    name: "Ram Traders",
    gstin: "27AABFR5987M1ZP",
    terms: "30-day Credit",
    total: 485000,
    paid: 200000,
    due: "2025-07-18",
    overdue: 0,
    risk: "low",
    phone: "+91 98765 43210",
    creditTerms: "30-day Credit",
    totalInvoiced: 485000,
    amountPaid: 200000,
    remainingBalance: 285000,
    overdueDays: 0,
    riskLevel: "low",
    transactions: [
      { id: "TX-1001", date: "2025-06-18", type: "invoice", reference: "INV-2025-0301", description: "OPC 53 Grade Cement - 1000 Bags", debit: 385000, credit: 0, runningBalance: 385000, status: "completed" },
      { id: "TX-1002", date: "2025-06-25", type: "payment", reference: "PAY-2025-0152", description: "NEFT Payment received", debit: 0, credit: 200000, runningBalance: 185000, status: "completed" },
      { id: "TX-1003", date: "2025-07-02", type: "invoice", reference: "INV-2025-0342", description: "TMT Bars Fe500 12mm - 1.5 Tonnes", debit: 100000, credit: 0, runningBalance: 285000, status: "pending" }
    ]
  },
  {
    id: 2,
    name: "Shyam Hardware",
    gstin: "27AADCS2341K1ZR",
    terms: "15-day Credit",
    total: 320000,
    paid: 120000,
    due: "2025-07-05",
    overdue: 5,
    risk: "medium",
    phone: "+91 91234 56789",
    creditTerms: "15-day Credit",
    totalInvoiced: 320000,
    amountPaid: 120000,
    remainingBalance: 200000,
    overdueDays: 5,
    riskLevel: "medium",
    transactions: [
      { id: "TX-2001", date: "2025-06-20", type: "invoice", reference: "INV-2025-0315", description: "M-Sand delivery - 5 Brass", debit: 120000, credit: 0, runningBalance: 120000, status: "completed" },
      { id: "TX-2002", date: "2025-06-21", type: "payment", reference: "PAY-2025-0168", description: "UPI Transfer from owner", debit: 0, credit: 120000, runningBalance: 0, status: "completed" },
      { id: "TX-2003", date: "2025-07-05", type: "invoice", reference: "INV-2025-0359", description: "TMT Bars Fe500 10mm - 3 Tonnes", debit: 200000, credit: 0, runningBalance: 200000, status: "pending" }
    ]
  },
  {
    id: 3,
    name: "Patel Cement Store",
    gstin: "27AAHFP6219N1ZK",
    terms: "Cash on Delivery",
    total: 287500,
    paid: 50000,
    due: "2025-06-25",
    overdue: 15,
    risk: "high",
    phone: "+91 88888 77777",
    creditTerms: "Cash on Delivery",
    totalInvoiced: 287500,
    amountPaid: 50000,
    remainingBalance: 237500,
    overdueDays: 15,
    riskLevel: "high",
    transactions: [
      { id: "TX-3001", date: "2025-06-10", type: "invoice", reference: "INV-2025-0288", description: "Aggregate 20mm - 4 Brass", debit: 87500, credit: 0, runningBalance: 87500, status: "completed" },
      { id: "TX-3002", date: "2025-06-15", type: "payment", reference: "PAY-2025-0121", description: "Cash deposit at counter", debit: 0, credit: 50000, runningBalance: 37500, status: "completed" },
      { id: "TX-3003", date: "2025-06-25", type: "invoice", reference: "INV-2025-0320", description: "OPC 53 Grade Cement - 500 Bags", debit: 200000, credit: 0, runningBalance: 237500, status: "pending" }
    ]
  },
  {
    id: 4,
    name: "Mehta Construction",
    gstin: "27AADCM4719L1ZS",
    terms: "30-day Credit",
    total: 640000,
    paid: 400000,
    due: "2025-07-22",
    overdue: 0,
    risk: "low",
    phone: "+91 77777 66666",
    creditTerms: "30-day Credit",
    totalInvoiced: 640000,
    amountPaid: 400000,
    remainingBalance: 240000,
    overdueDays: 0,
    riskLevel: "low",
    transactions: [
      { id: "TX-4001", date: "2025-06-22", type: "invoice", reference: "INV-2025-0329", description: "Crushed Sand - 10 Brass", debit: 240000, credit: 0, runningBalance: 240000, status: "completed" },
      { id: "TX-4002", date: "2025-06-28", type: "invoice", reference: "INV-2025-0348", description: "OPC 43 Grade Cement - 1000 Bags", debit: 400000, credit: 0, runningBalance: 640000, status: "completed" },
      { id: "TX-4003", date: "2025-07-10", type: "payment", reference: "PAY-2025-0201", description: "RTGS Payment received", debit: 0, credit: 400000, runningBalance: 240000, status: "completed" }
    ]
  },
  {
    id: 5,
    name: "Suresh Infra Pvt Ltd",
    gstin: "27AAFS8891B1ZC",
    terms: "15-day Credit",
    total: 195000,
    paid: 80000,
    due: "2025-07-08",
    overdue: 2,
    risk: "medium",
    phone: "+91 99999 88888",
    creditTerms: "15-day Credit",
    totalInvoiced: 195000,
    amountPaid: 80000,
    remainingBalance: 115000,
    overdueDays: 2,
    riskLevel: "medium",
    transactions: [
      { id: "TX-5001", date: "2025-06-24", type: "invoice", reference: "INV-2025-0335", description: "OPC 53 Grade Cement - 300 Bags", debit: 115000, credit: 0, runningBalance: 115000, status: "completed" },
      { id: "TX-5002", date: "2025-07-02", type: "invoice", reference: "INV-2025-0352", description: "TMT Bars Fe500 8mm - 1 Tonne", debit: 80000, credit: 0, runningBalance: 195000, status: "completed" },
      { id: "TX-5003", date: "2025-07-08", type: "payment", reference: "PAY-2025-0195", description: "Cheque cleared", debit: 0, credit: 80000, runningBalance: 115000, status: "completed" }
    ]
  }
];

export const payables: Payable[] = [
  {
    id: 1,
    name: "UltraTech Cement Ltd",
    terms: "30-day Credit",
    total: 890000,
    paid: 500000,
    due: "2025-07-20",
    overdue: 0,
    risk: "low",
    phone: "+91 22 5678 1234",
    creditTerms: "30-day Credit",
    totalInvoiced: 890000,
    amountPaid: 500000,
    remainingBalance: 390000,
    overdueDays: 0,
    riskLevel: "low",
    transactions: [
      { id: "TX-P101", date: "2025-06-20", type: "invoice", reference: "SUP-2025-0012", description: "Cement Purchase Invoice", debit: 890000, credit: 0, runningBalance: 890000, status: "completed" },
      { id: "TX-P102", date: "2025-06-30", type: "payment", reference: "PAY-2025-P005", description: "NEFT Payment to supplier", debit: 0, credit: 500000, runningBalance: 390000, status: "completed" }
    ]
  },
  {
    id: 2,
    name: "TATA Steel (TMT)",
    terms: "15-day Credit",
    total: 1240000,
    paid: 900000,
    due: "2025-07-12",
    overdue: 0,
    risk: "low",
    phone: "+91 33 2288 5678",
    creditTerms: "15-day Credit",
    totalInvoiced: 1240000,
    amountPaid: 900000,
    remainingBalance: 340000,
    overdueDays: 0,
    riskLevel: "low",
    transactions: [
      { id: "TX-P201", date: "2025-06-28", type: "invoice", reference: "SUP-2025-0018", description: "TMT Steel Rods Purchase", debit: 1240000, credit: 0, runningBalance: 1240000, status: "completed" },
      { id: "TX-P202", date: "2025-07-05", type: "payment", reference: "PAY-2025-P009", description: "Bank Transfer payment", debit: 0, credit: 900000, runningBalance: 340000, status: "completed" }
    ]
  },
  {
    id: 3,
    name: "Mahavir Sand Suppliers",
    terms: "Cash on Delivery",
    total: 156000,
    paid: 156000,
    due: "2025-07-01",
    overdue: 0,
    risk: "low",
    creditTerms: "Cash on Delivery",
    totalInvoiced: 156000,
    amountPaid: 156000,
    remainingBalance: 0,
    overdueDays: 0,
    riskLevel: "low",
    transactions: [
      { id: "TX-P301", date: "2025-07-01", type: "invoice", reference: "SUP-2025-0021", description: "River Sand delivery", debit: 156000, credit: 0, runningBalance: 156000, status: "completed" },
      { id: "TX-P302", date: "2025-07-01", type: "payment", reference: "PAY-2025-P010", description: "Paid cash on receipt", debit: 0, credit: 156000, runningBalance: 0, status: "completed" }
    ]
  }
];

export const invoiceItems: InvoiceItem[] = [
  { material: "OPC 53 Grade Cement", unit: "Bags", qty: 200, rate: 385, discount: 5, loading: 2000, total: 73150 },
  { material: "Fe500 TMT Bar 12mm", unit: "Tonnes", qty: 2.5, rate: 68000, discount: 0, loading: 1500, total: 171500 }
];
