import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createInvoiceSchema, listInvoiceQuerySchema } from "../validations/invoice.validation";
import { calculateInvoice } from "./invoiceCalculation.service";
import { stateCodeFromGstin } from "./gstCalculation.service";
import { nextDocumentNumber } from "./numberSequence.service";
import { postLedgerEntry } from "./ledger.service";

const detailInclude = {
  customer: { select: { id: true, customerCode: true, name: true, phone: true } },
  salesOrder: { select: { id: true, orderNumber: true, status: true } },
  createdBy: { select: { id: true, name: true } },
  items: { include: { inventoryItem: { select: { id: true, materialName: true } } } },
  payments: { where: { status: "POSTED" }, orderBy: { paymentDate: "desc" as const } },
};

export const getAll = async (businessId: string, rawQuery: unknown) => {
  const query = listInvoiceQuerySchema.parse(rawQuery);
  const where: Prisma.InvoiceWhereInput = { businessId };
  if (query.status) where.status = query.status.toUpperCase();
  if (query.customerId) where.customerId = query.customerId;
  if (query.salesOrderId) where.salesOrderId = query.salesOrderId;
  return prisma.invoice.findMany({ where, include: detailInclude, orderBy: { invoiceDate: "desc" } });
};

export const getById = async (businessId: string, id: string) => {
  const invoice = await prisma.invoice.findFirst({ where: { id, businessId }, include: detailInclude });
  if (!invoice) throw new ApiError(404, "Invoice not found.");
  return invoice;
};

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createInvoiceSchema.parse(input);
  const [business, order] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.salesOrder.findFirst({ where: { id: data.salesOrderId, businessId }, include: { customer: true, items: true, invoices: { where: { status: "DRAFT" } } } }),
  ]);
  if (!business) throw new ApiError(404, "Business not found.");
  if (!order) throw new ApiError(404, "Sales Order not found.");
  if (!["CONFIRMED", "PARTIALLY_INVOICED"].includes(order.status)) throw new ApiError(400, "Only confirmed Sales Orders can be invoiced.");
  if (order.invoices.length) throw new ApiError(409, "This Sales Order already has an active draft invoice.");

  const requestedMap = new Map((data.items || []).map((line) => [line.salesOrderItemId, line]));
  if (data.items && requestedMap.size !== data.items.length) throw new ApiError(400, "An order line can appear only once on an invoice.");
  const selectedItems = data.items
    ? order.items.filter((item) => requestedMap.has(item.id))
    : order.items.filter((item) => item.quantity.gt(item.invoicedQuantity));
  if (!selectedItems.length || (data.items && selectedItems.length !== data.items.length)) throw new ApiError(400, "Select valid uninvoiced Sales Order items.");

  const invoiceType = data.invoiceType || (order.taxMode as "GST" | "NON_GST");
  const sellerStateCode = data.sellerStateCode || stateCodeFromGstin(business.gstNumber);
  const placeOfSupplyCode = data.placeOfSupplyCode || order.placeOfSupplyCode;
  const calculation = calculateInvoice(selectedItems.map((item) => {
    const requested = requestedMap.get(item.id);
    const remaining = item.quantity.minus(item.invoicedQuantity);
    const quantity = requested?.quantity ?? remaining;
    if (new Prisma.Decimal(quantity).gt(remaining)) throw new ApiError(400, `Invoice quantity exceeds remaining quantity for ${item.materialName}.`);
    return {
      key: item.id, quantity, rate: requested?.rate ?? item.rate,
      discountRate: requested?.discountRate ?? item.discountRate, gstRate: item.gstRate,
      invoiceType, sellerStateCode, placeOfSupplyCode,
    };
  }), data.roundToRupee);

  return prisma.$transaction(async (tx) => {
    const invoiceNumber = await nextDocumentNumber(tx, businessId, "INVOICE", "INV");
    return tx.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        invoiceType,
        salesOrderId: order.id,
        customerId: order.customerId,
        businessName: business.name,
        businessGstin: business.gstNumber,
        businessAddress: business.address,
        businessPhone: business.phone,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerGstin: order.customerGstin,
        billingAddress: order.billingAddress,
        deliveryAddress: order.deliveryAddress,
        sellerStateCode,
        placeOfSupplyCode,
        supplyType: calculation.calculatedLines[0]?.supplyType,
        subtotal: calculation.subtotal,
        discountTotal: calculation.discountTotal,
        taxableTotal: calculation.taxableTotal,
        cgstTotal: calculation.cgstTotal,
        sgstTotal: calculation.sgstTotal,
        igstTotal: calculation.igstTotal,
        taxTotal: calculation.taxTotal,
        roundOff: calculation.roundOff,
        totalAmount: calculation.totalAmount,
        balanceDue: calculation.totalAmount,
        notes: data.notes,
        terms: data.terms,
        businessId,
        createdById: userId,
        items: {
          create: selectedItems.map((item, index) => {
            const line = calculation.calculatedLines[index];
            return {
              salesOrderItemId: item.id, inventoryItemId: item.inventoryItemId,
              materialName: item.materialName, sku: item.sku, hsnCode: item.hsnCode, unit: item.unit,
              quantity: line.quantity, rate: line.rate, grossAmount: line.grossAmount,
              discountRate: line.discountRate, discountAmount: line.discountAmount, taxableAmount: line.taxableAmount,
              gstRate: line.gstRate, cgstRate: line.cgstRate, sgstRate: line.sgstRate, igstRate: line.igstRate,
              cgstAmount: line.cgstAmount, sgstAmount: line.sgstAmount, igstAmount: line.igstAmount, lineTotal: line.lineTotal,
            };
          }),
        },
      },
      include: detailInclude,
    });
  });
};

export const issue = async (businessId: string, id: string) => prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.findFirst({ where: { id, businessId }, include: { items: true } });
  if (!invoice) throw new ApiError(404, "Invoice not found.");
  if (invoice.status !== "DRAFT") throw new ApiError(400, "Only draft invoices can be issued.");
  if (!invoice.salesOrderId) throw new ApiError(400, "This invoice is not linked to a Sales Order.");
  const order = await tx.salesOrder.findFirst({ where: { id: invoice.salesOrderId, businessId }, include: { items: true } });
  if (!order || !["CONFIRMED", "PARTIALLY_INVOICED"].includes(order.status)) throw new ApiError(400, "The linked Sales Order cannot be invoiced.");

  for (const line of invoice.items) {
    const orderLine = order.items.find((item) => item.id === line.salesOrderItemId);
    if (!orderLine || orderLine.invoicedQuantity.plus(line.quantity).gt(orderLine.quantity)) throw new ApiError(400, `Invoice quantity exceeds the Sales Order quantity for ${line.materialName}.`);
  }
  for (const line of invoice.items) {
    await tx.salesOrderItem.update({ where: { id: line.salesOrderItemId! }, data: { invoicedQuantity: { increment: line.quantity } } });
  }
  const allInvoiced = order.items.every((orderLine) => {
    const invoiceLine = invoice.items.find((line) => line.salesOrderItemId === orderLine.id);
    return orderLine.invoicedQuantity.plus(invoiceLine?.quantity || 0).gte(orderLine.quantity);
  });
  await tx.salesOrder.update({ where: { id: order.id }, data: { status: allInvoiced ? "INVOICED" : "PARTIALLY_INVOICED" } });
  await tx.customer.update({ where: { id: invoice.customerId }, data: { outstandingBalance: { increment: Number(invoice.totalAmount.toString()) } } });
  await tx.invoice.update({ where: { id }, data: { status: "ISSUED", issuedAt: new Date() } });
  await postLedgerEntry(tx,{businessId,partyType:"CUSTOMER",partyId:invoice.customerId,transactionType:"SALES_INVOICE",referenceType:"INVOICE",referenceId:invoice.id,amount:invoice.totalAmount,debitAmount:invoice.totalAmount,creditAmount:0,description:`Invoice ${invoice.invoiceNumber} issued`,transactionDate:invoice.invoiceDate,createdById:invoice.createdById,idempotencyKey:`INVOICE_ISSUED:${invoice.id}`});
  return tx.invoice.findUniqueOrThrow({ where: { id }, include: detailInclude });
});

export const cancel = async (businessId: string, id: string) => prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.findFirst({ where: { id, businessId }, include: { items: true, payments: { where: { status: "POSTED" } } } });
  if (!invoice) throw new ApiError(404, "Invoice not found.");
  if (invoice.status === "CANCELLED") throw new ApiError(400, "Invoice is already cancelled.");
  if (invoice.payments.length || invoice.amountPaid.gt(0)) throw new ApiError(400, "Reverse invoice payments before cancellation.");

  if (invoice.status !== "DRAFT") {
    for (const line of invoice.items) {
      if (line.salesOrderItemId) await tx.salesOrderItem.update({ where: { id: line.salesOrderItemId }, data: { invoicedQuantity: { decrement: line.quantity } } });
    }
    await postLedgerEntry(tx,{businessId,partyType:"CUSTOMER",partyId:invoice.customerId,transactionType:"SALES_INVOICE_REVERSAL",referenceType:"INVOICE",referenceId:invoice.id,amount:invoice.totalAmount,debitAmount:0,creditAmount:invoice.totalAmount,description:`Invoice ${invoice.invoiceNumber} cancelled`,createdById:invoice.createdById,idempotencyKey:`INVOICE_CANCELLED:${invoice.id}`});
    await tx.customer.update({ where: { id: invoice.customerId }, data: { outstandingBalance: { decrement: Number(invoice.balanceDue.toString()) } } });
    if (invoice.salesOrderId) {
      const orderItems = await tx.salesOrderItem.findMany({ where: { salesOrderId: invoice.salesOrderId } });
      const hasInvoiced = orderItems.some((item) => item.invoicedQuantity.gt(0));
      await tx.salesOrder.update({ where: { id: invoice.salesOrderId }, data: { status: hasInvoiced ? "PARTIALLY_INVOICED" : "CONFIRMED" } });
    }
  }
  return tx.invoice.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date(), balanceDue: 0 }, include: detailInclude });
});
