import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { financialQuerySchema } from "../validations/financial.validation";

const n = (v: unknown) => Number(v || 0);
const days = (d: Date) => Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
const bucket = (age: number) => (age <= 30 ? "0-30" : age <= 60 ? "31-60" : age <= 90 ? "61-90" : "90+");

export const receivables = async (businessId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: { businessId, status: { in: ["ISSUED", "PARTIALLY_PAID"] }, balanceDue: { gt: 0 } },
    include: {
      customer: {
        select: {
          id: true,
          customerCode: true,
          name: true,
          phone: true,
          email: true,
          creditLimit: true,
          creditDays: true,
          allowCredit: true,
        },
      },
    },
    orderBy: { invoiceDate: "asc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = invoices.map((x) => ({
    id: x.id,
    reference: x.invoiceNumber,
    date: x.invoiceDate,
    dueDate: x.dueDate,
    party: x.customer,
    amount: n(x.totalAmount),
    paid: n(x.amountPaid),
    amountDue: n(x.balanceDue),
    ageDays: days(x.invoiceDate),
    bucket: bucket(days(x.invoiceDate)),
    overdue: !!x.dueDate && x.dueDate < today,
  }));

  const grouped = new Map<string, any>();
  for (const r of rows) {
    const v = grouped.get(r.party.id) || {
      ...r.party,
      totalSales: 0,
      paidAmount: 0,
      amountDue: 0,
      invoices: [],
      maxAgeDays: 0,
      hasOverdue: false,
      hasDueToday: false,
    };
    v.totalSales += r.amount;
    v.paidAmount += r.paid;
    v.amountDue += r.amountDue;
    if (r.ageDays > v.maxAgeDays) v.maxAgeDays = r.ageDays;
    if (r.overdue) v.hasOverdue = true;
    if (r.dueDate && new Date(r.dueDate).toDateString() === today.toDateString()) v.hasDueToday = true;
    v.invoices.push(r);
    grouped.set(r.party.id, v);
  }

  const customersList = [...grouped.values()].map((c) => {
    let collectionStatus: "CURRENT" | "DUE" | "OVERDUE" | "HIGH_RISK" = "CURRENT";
    const creditLimit = Number(c.creditLimit || 0);

    if (c.maxAgeDays > 90 || (creditLimit > 0 && c.amountDue > creditLimit)) {
      collectionStatus = "HIGH_RISK";
    } else if (c.hasOverdue) {
      collectionStatus = "OVERDUE";
    } else if (c.hasDueToday || c.invoices.length > 0) {
      collectionStatus = "DUE";
    }

    return {
      ...c,
      collectionStatus,
    };
  });

  const totalReceivable = rows.reduce((a, r) => a + r.amountDue, 0);
  const overdueTotal = rows.filter((r) => r.overdue).reduce((a, r) => a + r.amountDue, 0);
  const dueTodayTotal = rows.filter((r) => r.dueDate && new Date(r.dueDate).toDateString() === today.toDateString()).reduce((a, r) => a + r.amountDue, 0);
  const overdueCustomersCount = customersList.filter((c) => c.collectionStatus === "OVERDUE" || c.collectionStatus === "HIGH_RISK").length;
  const overduePercentage = totalReceivable > 0 ? Math.round((overdueTotal / totalReceivable) * 100) : 0;

  return {
    summary: {
      totalReceivable,
      dueToday: dueTodayTotal,
      overdue: overdueTotal,
      customersPending: customersList.length,
      overdueCustomersCount,
      overduePercentage,
    },
    customers: customersList,
    ageing: rows,
  };
};

export const payables = async (businessId: string) => {
  const orders = await prisma.purchaseOrder.findMany({
    where: { businessId, status: { not: "CANCELLED" }, balanceDue: { gt: 0 } },
    include: { supplier: { select: { id: true, name: true, phone: true, paymentTerms: true } } },
    orderBy: { orderDate: "asc" },
  });
  const rows = orders.map((x) => {
    const age = days(x.orderDate);
    const term = Number(x.supplier.paymentTerms?.match(/\d+/)?.[0] || 30);
    const due = new Date(x.orderDate.getTime() + term * 86400000);
    return {
      id: x.id,
      reference: x.purchaseOrderNumber,
      date: x.orderDate,
      dueDate: due,
      party: x.supplier,
      amount: n(x.receivedAmount),
      paid: n(x.amountPaid),
      amountDue: n(x.balanceDue),
      ageDays: age,
      bucket: bucket(age),
      overdue: due < new Date(),
    };
  });
  const grouped = new Map<string, any>();
  for (const r of rows) {
    const v = grouped.get(r.party.id) || { ...r.party, totalPurchases: 0, paidAmount: 0, amountDue: 0, orders: [] };
    v.totalPurchases += r.amount;
    v.paidAmount += r.paid;
    v.amountDue += r.amountDue;
    v.orders.push(r);
    grouped.set(r.party.id, v);
  }
  const week = new Date(Date.now() + 7 * 86400000);
  return {
    summary: {
      totalPayable: rows.reduce((a, r) => a + r.amountDue, 0),
      dueThisWeek: rows.filter((r) => r.dueDate <= week).reduce((a, r) => a + r.amountDue, 0),
      overdue: rows.filter((r) => r.overdue).reduce((a, r) => a + r.amountDue, 0),
      suppliersPending: grouped.size,
    },
    suppliers: [...grouped.values()],
    ageing: rows,
  };
};

export const ledger = async (businessId: string, raw: unknown) => {
  const q = financialQuerySchema.parse(raw);
  const where: Prisma.LedgerEntryWhereInput = {
    businessId,
    ...(q.partyType ? { partyType: q.partyType } : {}),
    ...(q.partyId ? { partyId: q.partyId } : {}),
    ...(q.transactionType ? { transactionType: q.transactionType } : {}),
    ...(q.from || q.to
      ? {
          transactionDate: {
            ...(q.from ? { gte: q.from } : {}),
            ...(q.to ? { lte: q.to } : {}),
          },
        }
      : {}),
  };
  const entries = await prisma.ledgerEntry.findMany({
    where,
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { transactionDate: "desc" },
  });
  const customerIds = entries.filter((x) => x.partyType === "CUSTOMER").map((x) => x.partyId);
  const supplierIds = entries.filter((x) => x.partyType === "SUPPLIER").map((x) => x.partyId);
  const [c, s, business] = await Promise.all([
    prisma.customer.findMany({ where: { businessId, id: { in: customerIds } }, select: { id: true, name: true, phone: true } }),
    prisma.supplier.findMany({ where: { businessId, id: { in: supplierIds } }, select: { id: true, name: true, phone: true } }),
    prisma.business.findUnique({ where: { id: businessId }, select: { id: true, name: true } }),
  ]);
  const names = new Map([...c, ...s, ...(business ? [business] : [])].map((x) => [x.id, x]));
  return entries.map((x) => ({ ...x, party: names.get(x.partyId) }));
};

export const payments = async (businessId: string, raw: unknown) => {
  const q = financialQuerySchema.parse(raw);
  const date = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  const [customers, suppliers] = await Promise.all([
    prisma.customerPayment.findMany({
      where: {
        businessId,
        ...(q.partyType === "SUPPLIER" ? { id: "__none__" } : {}),
        ...(q.partyId ? { customerId: q.partyId } : {}),
        ...(q.paymentMode ? { paymentMethod: q.paymentMode } : {}),
        ...(q.from || q.to ? { paymentDate: date } : {}),
      },
      include: { customer: true, invoice: true, receivedBy: { select: { name: true } } },
    }),
    prisma.purchasePayment.findMany({
      where: {
        businessId,
        ...(q.partyType === "CUSTOMER" ? { id: "__none__" } : {}),
        ...(q.partyId ? { supplierId: q.partyId } : {}),
        ...(q.paymentMode ? { paymentMode: q.paymentMode } : {}),
        ...(q.from || q.to ? { paymentDate: date } : {}),
      },
      include: { supplier: true, purchaseOrder: true, recordedBy: { select: { name: true } }, reversedBy: { select: { name: true } } },
    }),
  ]);
  return [
    ...customers.map((x) => ({
      id: x.id,
      date: x.paymentDate,
      partyType: "CUSTOMER",
      party: x.customer,
      type: "Received",
      reference: x.invoice?.invoiceNumber || x.paymentNumber,
      amount: n(x.amount),
      paymentMode: x.paymentMethod,
      createdBy: x.receivedBy,
      status: x.status,
    })),
    ...suppliers.map((x) => ({
      id: x.id,
      date: x.paymentDate,
      partyType: "SUPPLIER",
      party: x.supplier,
      type: "Paid",
      reference: x.purchaseOrder.purchaseOrderNumber,
      purchaseOrderId: x.purchaseOrderId,
      paymentNumber: x.paymentNumber,
      amount: n(x.amount),
      paymentMode: x.paymentMode,
      createdBy: x.recordedBy,
      status: x.status,
      reversedAt: x.reversedAt,
      reversalReason: x.reversalReason,
      reversedBy: x.reversedBy,
    })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));
};
