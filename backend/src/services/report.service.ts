import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import { ApiError } from "../utils/apiError";
import { reportQuerySchema } from "../validations/report.validation";

const n = (v: unknown) => Number(v || 0);
const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const sum = (a: number[]) => round(a.reduce((x, y) => x + y, 0));

type Q = ReturnType<typeof reportQuerySchema.parse>;

const dates = (q: Q, current = false) => {
  if (current && !q.from && !q.to) return {};
  const now = new Date(),
    from = q.from || new Date(now.getFullYear(), now.getMonth(), 1),
    to = q.to || now;
  to.setHours(23, 59, 59, 999);
  return { gte: from, lte: to };
};

const metadata = (q: Q, warnings: string[] = [], estimated = false) => {
  const now = new Date(),
    from = q.from || new Date(now.getFullYear(), now.getMonth(), 1),
    to = q.to || now;
  return {
    dateFrom: from.toISOString(),
    dateTo: to.toISOString(),
    generatedAt: new Date().toISOString(),
    currency: "INR",
    isEstimated: estimated,
    warnings,
  };
};

const pagination = (q: Q, total: number) => ({
  page: q.page,
  limit: q.limit,
  total,
  pages: Math.max(1, Math.ceil(total / q.limit)),
});

const group = (rows: any[], key: (x: any) => string, value: (x: any) => number) => {
  const m = new Map<string, number>();
  for (const row of rows) {
    m.set(key(row), round((m.get(key(row)) || 0) + value(row)));
  }
  return [...m]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
};

const validateId = async (
  businessId: string,
  type: "customer" | "supplier" | "inventoryItem" | "expenseCategory",
  id?: string
) => {
  if (!id) return;
  const model = (prisma as any)[type],
    row = await model.findFirst({ where: { id, businessId }, select: { id: true } });
  if (!row) throw new ApiError(404, "Report filter not found.");
};

const base = async (businessId: string, raw: unknown, ids: (q: Q) => Promise<void>) => {
  const q = reportQuerySchema.parse(raw);
  await ids(q);
  return q;
};

export const sales = async (businessId: string, raw: unknown) => {
  const q = await base(businessId, raw, async (q) => validateId(businessId, "customer", q.customerId)),
    range = dates(q),
    where: Prisma.InvoiceWhereInput = {
      businessId,
      invoiceDate: range,
      status: q.status ? q.status : { notIn: ["DRAFT", "CANCELLED"] },
      ...(q.customerId ? { customerId: q.customerId } : {}),
      ...(q.invoiceType ? { invoiceType: q.invoiceType } : {}),
    };

  const [all, total, detail, returns] = await Promise.all([
    prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        invoiceType: true,
        status: true,
        customerId: true,
        customerName: true,
        taxableTotal: true,
        taxTotal: true,
        totalAmount: true,
        amountPaid: true,
        balanceDue: true,
        items: { select: { materialName: true, quantity: true, lineTotal: true, taxableAmount: true } },
      },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        invoiceType: true,
        status: true,
        customerName: true,
        taxableTotal: true,
        taxTotal: true,
        totalAmount: true,
        amountPaid: true,
        balanceDue: true,
      },
      orderBy: { invoiceDate: "desc" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.salesReturn.findMany({
      where: {
        businessId,
        returnDate: range,
        status: "COMPLETED",
        ...(q.customerId ? { customerId: q.customerId } : {}),
        invoice: q.invoiceType ? { invoiceType: q.invoiceType } : undefined,
      },
      include: { invoice: true },
    }),
  ]);

  const returnTotalAmount = sum(returns.map((r) => n(r.totalAmount)));
  const returnTaxableTotal = sum(returns.map((r) => n(r.taxableTotal)));
  const returnTaxTotal = sum(returns.map((r) => n(r.taxTotal)));
  const returnGstTotal = sum(returns.filter((r) => r.invoice.invoiceType === "GST").map((r) => n(r.totalAmount)));
  const returnNonGstTotal = sum(returns.filter((r) => r.invoice.invoiceType !== "GST").map((r) => n(r.totalAmount)));

  const totalSales = round(sum(all.map((x) => n(x.totalAmount))) - returnTotalAmount);
  const gst = all.filter((x) => x.invoiceType === "GST");

  return {
    summary: {
      totalSales,
      gstSales: round(sum(gst.map((x) => n(x.totalAmount))) - returnGstTotal),
      nonGstSales: round(sum(all.filter((x) => x.invoiceType !== "GST").map((x) => n(x.totalAmount))) - returnNonGstTotal),
      taxableAmount: round(sum(all.map((x) => n(x.taxableTotal))) - returnTaxableTotal),
      gstCollected: round(sum(all.map((x) => n(x.taxTotal))) - returnTaxTotal),
      amountReceived: sum(all.map((x) => n(x.amountPaid))),
      outstandingAmount: sum(all.map((x) => n(x.balanceDue))),
      invoiceCount: all.length,
      averageInvoiceValue: all.length ? round(totalSales / all.length) : 0,
    },
    breakdowns: {
      customerWise: group(all, (x) => x.customerName, (x) => n(x.totalAmount)),
      materialWise: group(all.flatMap((x) => x.items), (x) => x.materialName, (x) => n(x.lineTotal)),
      status: group(all, (x) => x.status, () => 1),
      gstVsNonGst: group(all, (x) => x.invoiceType, (x) => n(x.totalAmount)),
      trend: group(all, (x) => x.invoiceDate.toISOString().slice(0, 7), (x) => n(x.totalAmount)),
    },
    rows: detail,
    pagination: pagination(q, total),
    metadata: metadata(q),
  };
};

export const purchases = async (businessId: string, raw: unknown) => {
  const q = await base(businessId, raw, async (q) => validateId(businessId, "supplier", q.supplierId)),
    where: Prisma.PurchaseOrderWhereInput = {
      businessId,
      status: q.status ? q.status : { not: "CANCELLED" },
      orderDate: dates(q),
      ...(q.supplierId ? { supplierId: q.supplierId } : {}),
    };

  const [all, total, rows, returns] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      select: {
        id: true,
        purchaseOrderNumber: true,
        orderDate: true,
        status: true,
        supplierName: true,
        totalAmount: true,
        receivedAmount: true,
        amountPaid: true,
        balanceDue: true,
        items: { select: { materialName: true, lineTotal: true, receivedQuantity: true, quantity: true } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      select: {
        id: true,
        purchaseOrderNumber: true,
        orderDate: true,
        status: true,
        supplierName: true,
        totalAmount: true,
        receivedAmount: true,
        amountPaid: true,
        balanceDue: true,
      },
      orderBy: { orderDate: "desc" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.purchaseReturn.findMany({
      where: {
        businessId,
        returnDate: dates(q),
        status: "COMPLETED",
        ...(q.supplierId ? { supplierId: q.supplierId } : {}),
      },
    }),
  ]);

  const returnTotalAmount = sum(returns.map((r) => n(r.totalAmount)));
  const ordered = sum(all.map((x) => n(x.totalAmount)));
  const received = round(sum(all.map((x) => n(x.receivedAmount))) - returnTotalAmount);

  return {
    summary: {
      orderedPurchaseValue: ordered,
      receivedPurchaseValue: received,
      pendingPurchaseValue: round(ordered - received),
      amountPaid: sum(all.map((x) => n(x.amountPaid))),
      supplierPayable: sum(all.map((x) => n(x.balanceDue))),
      purchaseOrderCount: all.length,
    },
    breakdowns: {
      supplierWise: group(all, (x) => x.supplierName, (x) => n(x.receivedAmount)),
      materialWise: group(
        all.flatMap((x) => x.items),
        (x) => x.materialName,
        (x) => n(x.lineTotal) * Math.min(1, n(x.receivedQuantity) / Math.max(1, n(x.quantity)))
      ),
      status: group(all, (x) => x.status, () => 1),
      trend: group(all, (x) => x.orderDate.toISOString().slice(0, 7), (x) => n(x.receivedAmount)),
    },
    rows,
    pagination: pagination(q, total),
    metadata: metadata(q),
  };
};

export const inventory = async (businessId: string, raw: unknown) => {
  const q = await base(businessId, raw, async (q) => validateId(businessId, "inventoryItem", q.materialId)),
    items = await prisma.inventoryItem.findMany({
      where: { businessId, ...(q.materialId ? { id: q.materialId } : {}) },
      select: { id: true, materialName: true, sku: true, unit: true, quantity: true, reorderLevel: true },
    }),
    movements = await prisma.stockTransaction.findMany({
      where: { businessId, createdAt: dates(q), ...(q.materialId ? { inventoryItemId: q.materialId } : {}) },
      select: { inventoryItemId: true, type: true, quantity: true, reason: true },
    }),
    by = new Map<string, any>();

  for (const m of movements) {
    const v = by.get(m.inventoryItemId) || { stockIn: 0, stockOut: 0, adjustments: 0 };
    const qty = n(m.quantity);
    if (m.reason === "MANUAL_ADJUSTMENT") {
      v.adjustments += m.type === "OUT" ? -qty : qty;
    } else if (["IN", "TRANSFER_IN", "SALES_RETURN"].includes(m.type)) {
      v.stockIn += qty;
    } else if (["OUT", "TRANSFER_OUT", "PURCHASE_RETURN"].includes(m.type)) {
      v.stockOut += qty;
    }
    by.set(m.inventoryItemId, v);
  }

  const all = items.map((i) => {
    const m = by.get(i.id) || { stockIn: 0, stockOut: 0, adjustments: 0 },
      closing = n(i.quantity),
      opening = round(closing - m.stockIn + m.stockOut - m.adjustments),
      calculated = round(opening + m.stockIn - m.stockOut + m.adjustments);
    return {
      ...i,
      openingQuantity: opening,
      ...m,
      closingQuantity: closing,
      stockStatus: closing <= 0 ? "OUT_OF_STOCK" : closing <= n(i.reorderLevel) ? "LOW_STOCK" : "IN_STOCK",
      discrepancy: round(closing - calculated),
    };
  }),
    filtered = q.status ? all.filter((x) => x.stockStatus === q.status) : all,
    rows = filtered.slice((q.page - 1) * q.limit, q.page * q.limit);

  return {
    summary: {
      totalMaterials: filtered.length,
      totalQuantityOnHand: sum(filtered.map((x) => x.closingQuantity)),
      lowStockItems: filtered.filter((x) => x.stockStatus === "LOW_STOCK").length,
      outOfStockItems: filtered.filter((x) => x.stockStatus === "OUT_OF_STOCK").length,
      stockInDuringPeriod: sum(filtered.map((x) => x.stockIn)),
      stockOutDuringPeriod: sum(filtered.map((x) => x.stockOut)),
    },
    breakdowns: { status: group(filtered, (x) => x.stockStatus, () => 1) },
    rows,
    pagination: pagination(q, filtered.length),
    metadata: metadata(
      q,
      filtered.some((x) => x.discrepancy !== 0) ? ["Some stock rows do not reconcile with recorded movements."] : []
    ),
  };
};

export const valuation = async (businessId: string, raw: unknown) => {
  const q = await base(businessId, raw, async (q) => validateId(businessId, "inventoryItem", q.materialId)),
    all = await prisma.inventoryItem.findMany({
      where: { businessId, ...(q.materialId ? { id: q.materialId } : {}) },
      select: {
        id: true,
        materialName: true,
        sku: true,
        unit: true,
        quantity: true,
        reorderLevel: true,
        costPrice: true,
        purchaseOrderItems: {
          where: { receivedQuantity: { gt: 0 } },
          select: { rate: true, receivedQuantity: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

  const values = all.map((x) => {
    const rate = x.costPrice === null ? null : n(x.costPrice),
      value = rate === null ? null : round(n(x.quantity) * rate);
    return {
      id: x.id,
      materialName: x.materialName,
      sku: x.sku,
      unit: x.unit,
      quantity: n(x.quantity),
      valuationRate: rate,
      valuationMethod: "LAST_PURCHASE_COST",
      stockValue: value,
      lastPurchaseDate: x.purchaseOrderItems[0]?.updatedAt || null,
      missingCost: rate === null,
      lowStock: n(x.quantity) <= n(x.reorderLevel),
    };
  }),
    rows = values.slice((q.page - 1) * q.limit, q.page * q.limit),
    missing = values.filter((x) => x.missingCost);

  return {
    summary: {
      totalStockValue: sum(values.filter((x) => x.stockValue !== null).map((x) => x.stockValue!)),
      valuedItems: values.length - missing.length,
      missingCostItems: missing.length,
      lowStockValue: sum(values.filter((x) => x.lowStock && x.stockValue !== null).map((x) => x.stockValue!)),
      outOfStockItems: values.filter((x) => x.quantity <= 0).length,
    },
    breakdowns: {},
    rows,
    pagination: pagination(q, values.length),
    metadata: metadata(
      q,
      missing.length ? [`${missing.length} materials are excluded because cost is unavailable.`] : [],
      true
    ),
  };
};

const ageBucket = (days: number) =>
  days <= 0 ? "Current" : days <= 30 ? "1-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";

export const customerOutstanding = async (businessId: string, raw: unknown) => {
  const q = await base(businessId, raw, async (q) => validateId(businessId, "customer", q.customerId)),
    invoices = await prisma.invoice.findMany({
      where: {
        businessId,
        status: { notIn: ["DRAFT", "CANCELLED"] },
        balanceDue: { gt: 0 },
        ...(q.customerId ? { customerId: q.customerId } : {}),
      },
      include: { customer: { select: { id: true, name: true, phone: true, creditLimit: true } } },
    }),
    map = new Map<string, any>();

  for (const x of invoices) {
    const age = Math.max(0, Math.floor((Date.now() - (x.dueDate || x.invoiceDate).getTime()) / 86400000)),
      v = map.get(x.customerId) || {
        id: x.customer.id,
        name: x.customer.name,
        contact: x.customer.phone,
        totalInvoiced: 0,
        totalPaid: 0,
        outstanding: 0,
        creditLimit: n(x.customer.creditLimit),
        oldestUnpaidInvoiceDate: x.invoiceDate,
        overdueDays: 0,
        aging: { Current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 },
      };
    v.totalInvoiced += n(x.totalAmount);
    v.totalPaid += n(x.amountPaid);
    v.outstanding += n(x.balanceDue);
    if (x.invoiceDate < v.oldestUnpaidInvoiceDate) v.oldestUnpaidInvoiceDate = x.invoiceDate;
    v.overdueDays = Math.max(v.overdueDays, age);
    v.aging[ageBucket(age)] += n(x.balanceDue);
    map.set(x.customerId, v);
  }

  const all = [...map.values()].map((v) => ({
    ...v,
    availableCredit: round(v.creditLimit - v.outstanding),
    creditStatus: v.creditLimit && v.outstanding > v.creditLimit ? "OVER_LIMIT" : "OK",
  })),
    rows = all.slice((q.page - 1) * q.limit, q.page * q.limit),
    total = sum(all.map((x) => x.outstanding)),
    limits = sum(all.map((x) => x.creditLimit));

  return {
    summary: {
      totalReceivable: total,
      overdueReceivable: sum(all.filter((x) => x.overdueDays > 0).map((x) => x.outstanding)),
      customersWithOutstanding: all.length,
      highestOutstandingCustomer: all.sort((a, b) => b.outstanding - a.outstanding)[0]?.name || null,
      totalCreditLimit: limits,
      creditLimitUtilization: limits ? round((total / limits) * 100) : 0,
    },
    breakdowns: {
      aging: Object.entries(
        all.reduce((a, x) => {
          for (const [k, v] of Object.entries(x.aging)) a[k] = (a[k] || 0) + n(v);
          return a;
        }, {} as Record<string, number>)
      ).map(([name, total]) => ({ name, total })),
    },
    rows,
    pagination: pagination(q, all.length),
    metadata: metadata(q),
  };
};

export const supplierOutstanding = async (businessId: string, raw: unknown) => {
  const q = await base(businessId, raw, async (q) => validateId(businessId, "supplier", q.supplierId)),
    orders = await prisma.purchaseOrder.findMany({
      where: {
        businessId,
        status: { not: "CANCELLED" },
        balanceDue: { gt: 0 },
        ...(q.supplierId ? { supplierId: q.supplierId } : {}),
      },
      include: { supplier: { select: { id: true, name: true, phone: true, paymentTerms: true } } },
    }),
    map = new Map<string, any>();

  for (const x of orders) {
    const term = n(x.supplier.paymentTerms?.match(/\d+/)?.[0] || 30),
      due = new Date(x.orderDate.getTime() + term * 86400000),
      age = Math.max(0, Math.floor((Date.now() - due.getTime()) / 86400000)),
      v = map.get(x.supplierId) || {
        id: x.supplier.id,
        name: x.supplier.name,
        contact: x.supplier.phone,
        purchaseValue: 0,
        paid: 0,
        outstanding: 0,
        oldestUnpaidPurchaseDate: x.orderDate,
        overdueDays: 0,
        aging: { Current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 },
      };
    v.purchaseValue += n(x.receivedAmount);
    v.paid += n(x.amountPaid);
    v.outstanding += n(x.balanceDue);
    v.overdueDays = Math.max(v.overdueDays, age);
    v.aging[ageBucket(age)] += n(x.balanceDue);
    map.set(x.supplierId, v);
  }

  const all = [...map.values()],
    payments = await prisma.purchasePayment.aggregate({
      where: { businessId, status: "POSTED", paymentDate: dates(q) },
      _sum: { amount: true },
    }),
    rows = all.slice((q.page - 1) * q.limit, q.page * q.limit);

  return {
    summary: {
      totalPayable: sum(all.map((x) => x.outstanding)),
      overduePayable: sum(all.filter((x) => x.overdueDays > 0).map((x) => x.outstanding)),
      suppliersWithBalance: all.length,
      highestPayableSupplier: all.sort((a, b) => b.outstanding - a.outstanding)[0]?.name || null,
      totalPaidDuringPeriod: n(payments._sum.amount),
    },
    breakdowns: {
      aging: Object.entries(
        all.reduce((a, x) => {
          for (const [k, v] of Object.entries(x.aging)) a[k] = (a[k] || 0) + n(v);
          return a;
        }, {} as Record<string, number>)
      ).map(([name, total]) => ({ name, total })),
    },
    rows,
    pagination: pagination(q, all.length),
    metadata: metadata(q),
  };
};

export const expenses = async (businessId: string, raw: unknown) => {
  const q = await base(businessId, raw, async (q) => validateId(businessId, "expenseCategory", q.categoryId)),
    where: Prisma.ExpenseWhereInput = {
      businessId,
      expenseDate: dates(q),
      paymentStatus: q.status ? q.status : { not: "CANCELLED" },
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.paymentMode ? { paymentMode: q.paymentMode } : {}),
    };

  const [all, total, rows] = await Promise.all([
    prisma.expense.findMany({ where, include: { category: true } }),
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { expenseDate: "desc" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
  ]);

  const highest = group(all, (x) => x.category.name, (x) => n(x.totalAmount))[0];

  return {
    summary: {
      totalExpenses: sum(all.map((x) => n(x.totalAmount))),
      paidExpenses: sum(all.filter((x) => x.paymentStatus === "PAID").map((x) => n(x.totalAmount))),
      pendingExpenses: sum(all.filter((x) => x.paymentStatus === "PENDING").map((x) => n(x.totalAmount))),
      gstOnExpenses: sum(all.map((x) => n(x.gstAmount))),
      expenseCount: all.length,
      highestExpenseCategory: highest?.name || null,
    },
    breakdowns: {
      categoryWise: group(all, (x) => x.category.name, (x) => n(x.totalAmount)),
      paymentMode: group(all, (x) => x.paymentMode || "Not selected", (x) => n(x.totalAmount)),
      status: group(all, (x) => x.paymentStatus, (x) => n(x.totalAmount)),
      trend: group(all, (x) => x.expenseDate.toISOString().slice(0, 7), (x) => n(x.totalAmount)),
      gstVsNonGst: group(all, (x) => (x.gstApplicable ? "GST" : "NON_GST"), (x) => n(x.totalAmount)),
    },
    rows,
    pagination: pagination(q, total),
    metadata: metadata(q),
  };
};

export const gst = async (businessId: string, raw: unknown) => {
  const q = reportQuerySchema.parse(raw),
    range = dates(q),
    [invoices, receipts, expenseRows, salesReturns, purchaseReturns] = await Promise.all([
      prisma.invoice.findMany({
        where: { businessId, invoiceDate: range, status: { notIn: ["DRAFT", "CANCELLED"] } },
        include: { items: true },
      }),
      prisma.purchaseReceipt.findMany({
        where: { businessId, receiptDate: range, purchaseOrder: { status: { not: "CANCELLED" } } },
        include: { purchaseOrder: { include: { items: true } } },
      }),
      prisma.expense.findMany({ where: { businessId, expenseDate: range, paymentStatus: { not: "CANCELLED" } } }),
      prisma.salesReturn.findMany({
        where: { businessId, returnDate: range, status: "COMPLETED" },
        include: { invoice: true },
      }),
      prisma.purchaseReturn.findMany({ where: { businessId, returnDate: range, status: "COMPLETED" } }),
    ]),
    returnTaxableSales = sum(salesReturns.map((r) => n(r.taxableTotal))),
    returnOutputGst = sum(salesReturns.map((r) => n(r.taxTotal))),
    returnTaxablePurchases = sum(purchaseReturns.map((r) => n(r.taxableTotal))),
    returnInputGst = sum(purchaseReturns.map((r) => n(r.taxTotal))),
    returnGstSalesTotal = sum(salesReturns.filter((x) => x.invoice.invoiceType === "GST").map((x) => n(x.totalAmount))),
    returnNonGstSalesTotal = sum(salesReturns.filter((x) => x.invoice.invoiceType !== "GST").map((x) => n(x.totalAmount)));

  const salesTaxable = round(sum(invoices.map((x) => n(x.taxableTotal))) - returnTaxableSales),
    output = round(sum(invoices.map((x) => n(x.taxTotal))) - returnOutputGst),
    expenseTaxable = sum(expenseRows.filter((x) => x.gstApplicable).map((x) => n(x.amount))),
    expenseInput = sum(expenseRows.map((x) => n(x.gstAmount))),
    purchaseInputVal = sum(
      receipts.map((r) => {
        const po = r.purchaseOrder;
        return n(po.totalAmount) ? (n(r.totalAmount) * n(po.taxTotal)) / n(po.totalAmount) : 0;
      })
    ),
    purchaseInput = round(purchaseInputVal - returnInputGst),
    purchaseTaxable = round(sum(receipts.map((r) => n(r.totalAmount))) - purchaseInputVal - returnTaxablePurchases),
    input = round(purchaseInput + expenseInput);

  return {
    summary: {
      salesGst: {
        taxableSales: salesTaxable,
        outputGst: output,
        gstInvoiceCount: invoices.filter((x) => x.invoiceType === "GST").length,
      },
      purchaseGst: { taxablePurchases: purchaseTaxable, inputGst: purchaseInput },
      expenseGst: { taxableExpenses: expenseTaxable, inputGst: expenseInput },
      netGst: {
        outputGst: output,
        eligibleInputGst: input,
        estimatedNetGstPayable: round(output - input),
      },
      gstSalesTotal: round(sum(invoices.filter((x) => x.invoiceType === "GST").map((x) => n(x.totalAmount))) - returnGstSalesTotal),
      nonGstSalesTotal: round(sum(invoices.filter((x) => x.invoiceType !== "GST").map((x) => n(x.totalAmount))) - returnNonGstSalesTotal),
    },
    breakdowns: {
      salesByRate: group(
        invoices.flatMap((x) => x.items),
        (x) => `${n(x.gstRate)}%`,
        (x) => n(x.cgstAmount) + n(x.sgstAmount) + n(x.igstAmount)
      ),
      expenseByRate: group(
        expenseRows,
        (x) => `${n(x.gstRate)}%`,
        (x) => n(x.gstAmount)
      ),
    },
    rows: [],
    pagination: pagination(q, 0),
    metadata: metadata(
      q,
      [
        "Operational estimate only; not an official GST return.",
        "Purchase input GST is proportionally estimated from received value minus completed returns.",
      ],
      true
    ),
  };
};

export const profitLoss = async (businessId: string, raw: unknown) => {
  const q = reportQuerySchema.parse(raw),
    range = dates(q),
    [invoices, expenseRows, salesReturns, salesReturnItems] = await Promise.all([
      prisma.invoice.findMany({
        where: { businessId, invoiceDate: range, status: { notIn: ["DRAFT", "CANCELLED"] } },
        include: { items: { include: { inventoryItem: { select: { costPrice: true } } } } },
      }),
      prisma.expense.findMany({ where: { businessId, expenseDate: range, paymentStatus: "PAID" } }),
      prisma.salesReturn.findMany({ where: { businessId, returnDate: range, status: "COMPLETED" } }),
      prisma.salesReturnItem.findMany({ where: { salesReturn: { businessId, status: "COMPLETED", returnDate: range } } }),
    ]);

  const returnedMap = new Map<string, number>();
  for (const item of salesReturnItems) {
    returnedMap.set(item.invoiceItemId, (returnedMap.get(item.invoiceItemId) || 0) + Number(item.quantity.toString()));
  }

  const items = invoices.flatMap((x) => x.items),
    returnRevenue = sum(salesReturns.map((r) => n(r.taxableTotal))),
    revenue = round(sum(invoices.map((x) => n(x.taxableTotal))) - returnRevenue),
    costed = items.filter((x) => x.inventoryItem.costPrice !== null),
    cogs = round(
      sum(
        costed.map((x) => {
          const qty = Math.max(0, n(x.quantity) - (returnedMap.get(x.id) || 0));
          return qty * n(x.inventoryItem.costPrice);
        })
      )
    ),
    operating = sum(expenseRows.map((x) => n(x.amount))),
    gross = round(revenue - cogs),
    net = round(gross - operating),
    missing = items.filter((x) => x.inventoryItem.costPrice === null);

  return {
    summary: {
      revenue,
      estimatedCogs: cogs,
      grossProfit: gross,
      operatingExpenses: operating,
      netOperatingProfit: net,
      grossMarginPercent: revenue ? round((gross / revenue) * 100) : 0,
      netMarginPercent: revenue ? round((net / revenue) * 100) : 0,
      missingCostItems: missing.length,
    },
    breakdowns: {},
    rows: [],
    pagination: pagination(q, 0),
    metadata: metadata(
      q,
      [
        "Management estimate, not an audited statement.",
        "COGS uses current last purchase cost because historical weighted-average cost is unavailable.",
        ...(missing.length ? [`${missing.length} sold lines are excluded from COGS because cost is unavailable.`] : []),
      ],
      true
    ),
  };
};

export const overview = async (businessId: string, raw: unknown) => {
  const q = reportQuerySchema.parse(raw),
    [s, p, e, v, c, su, pl, deliveries] = await Promise.all([
      sales(businessId, q),
      purchases(businessId, q),
      expenses(businessId, q),
      valuation(businessId, q),
      customerOutstanding(businessId, {}),
      supplierOutstanding(businessId, {}),
      profitLoss(businessId, q),
      prisma.delivery.count({ where: { businessId, status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    ]);

  return {
    summary: {
      sales: s.summary.totalSales,
      purchases: p.summary.receivedPurchaseValue,
      expenses: e.summary.totalExpenses,
      grossProfitEstimate: pl.summary.grossProfit,
      netProfitEstimate: pl.summary.netOperatingProfit,
      receivables: c.summary.totalReceivable,
      payables: su.summary.totalPayable,
      inventoryValue: v.summary.totalStockValue,
      lowStockCount: v.rows.filter((x: any) => x.lowStock).length,
      pendingDeliveries: deliveries,
      topCustomer: s.breakdowns.customerWise[0]?.name || null,
      topSupplier: p.breakdowns.supplierWise[0]?.name || null,
      topSellingMaterial: s.breakdowns.materialWise[0]?.name || null,
      highestExpenseCategory: e.summary.highestExpenseCategory,
    },
    breakdowns: {
      trend: { sales: s.breakdowns.trend, purchases: p.breakdowns.trend, expenses: e.breakdowns.trend },
    },
    rows: [],
    pagination: pagination(q, 0),
    metadata: metadata(q, [...pl.metadata.warnings, ...v.metadata.warnings], true),
  };
};
