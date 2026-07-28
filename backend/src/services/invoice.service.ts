import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createInvoiceSchema, listInvoiceQuerySchema } from "../validations/invoice.validation";
import { calculateInvoice } from "./invoiceCalculation.service";
import { stateCodeFromGstin } from "./gstCalculation.service";
import { nextDocumentNumber } from "./numberSequence.service";
import { postLedgerEntry } from "./ledger.service";
import { generatePublicToken } from "../utils/token";

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
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new ApiError(404, "Business not found.");

  let order: any = null;
  let customer: any;
  let selectedItems: Array<{
    key: string; salesOrderItemId: string | null; inventoryItemId: string; materialName: string;
    sku: string; hsnCode: string | null; unit: string; quantity: Prisma.Decimal;
    rate: Prisma.Decimal; discountRate: Prisma.Decimal; gstRate: Prisma.Decimal;
  }> = [];

  if (data.invoiceMode === "SALES_ORDER") {
    order = await prisma.salesOrder.findFirst({
      where: { id: data.salesOrderId!, businessId },
      include: { customer: true, items: true, invoices: { where: { status: "DRAFT" } } },
    });
    if (!order) throw new ApiError(404, "Sales Order not found.");
    if (!["CONFIRMED", "PARTIALLY_INVOICED"].includes(order.status)) throw new ApiError(400, "Only confirmed Sales Orders can be invoiced.");
    if (order.invoices.length) throw new ApiError(409, "This Sales Order already has an active draft invoice.");
    customer = order.customer;
    const requestedMap = new Map((data.items || []).map((line) => [line.salesOrderItemId, line]));
    if (data.items && requestedMap.size !== data.items.length) throw new ApiError(400, "An order line can appear only once on an invoice.");
    const orderItems = data.items ? order.items.filter((item: any) => requestedMap.has(item.id)) : order.items.filter((item: any) => item.quantity.gt(item.invoicedQuantity));
    if (!orderItems.length || (data.items && orderItems.length !== data.items.length)) throw new ApiError(400, "Select valid uninvoiced Sales Order items.");
    selectedItems = orderItems.map((item: any) => {
      const requested = requestedMap.get(item.id);
      const remaining = item.quantity.minus(item.invoicedQuantity);
      const quantity = new Prisma.Decimal(requested?.quantity ?? remaining);
      if (quantity.gt(remaining)) throw new ApiError(400, `Invoice quantity exceeds remaining quantity for ${item.materialName}.`);
      return {
        key: item.id, salesOrderItemId: item.id, inventoryItemId: item.inventoryItemId,
        materialName: item.materialName, sku: item.sku, hsnCode: item.hsnCode, unit: item.unit,
        quantity, rate: new Prisma.Decimal(requested?.rate ?? item.rate),
        discountRate: new Prisma.Decimal(requested?.discountRate ?? item.discountRate),
        gstRate: new Prisma.Decimal(item.gstRate),
      };
    });
  } else {
    const directLines = data.directItems!;
    const uniqueIds = [...new Set(directLines.map((line) => line.inventoryItemId))];
    if (uniqueIds.length !== directLines.length) throw new ApiError(400, "An inventory item can appear only once on an invoice.");
    const [foundCustomer, inventoryItems] = await Promise.all([
      prisma.customer.findFirst({ where: { id: data.customerId!, businessId, isActive: true } }),
      prisma.inventoryItem.findMany({ where: { id: { in: uniqueIds }, businessId, isActive: true } }),
    ]);
    if (!foundCustomer) throw new ApiError(404, "Customer not found.");
    if (inventoryItems.length !== uniqueIds.length) throw new ApiError(400, "Select valid active inventory items.");
    customer = foundCustomer;
    const itemMap = new Map(inventoryItems.map((item) => [item.id, item]));
    selectedItems = directLines.map((line) => {
      const item = itemMap.get(line.inventoryItemId)!;
      return {
        key: item.id, salesOrderItemId: null, inventoryItemId: item.id,
        materialName: item.materialName, sku: item.sku, hsnCode: item.hsnCode, unit: item.unit,
        quantity: new Prisma.Decimal(line.quantity), rate: new Prisma.Decimal(line.rate),
        discountRate: new Prisma.Decimal(line.discountRate ?? 0), gstRate: new Prisma.Decimal(item.taxRate ?? 0),
      };
    });
  }

  const invoiceType = data.invoiceType || (order!.taxMode as "GST" | "NON_GST");
  const sellerStateCode = data.sellerStateCode || stateCodeFromGstin(business.gstNumber);
  const placeOfSupplyCode = data.placeOfSupplyCode || order?.placeOfSupplyCode || customer.stateCode;
  const calculation = calculateInvoice(selectedItems.map((item) => ({
      key: item.key, quantity: item.quantity, rate: item.rate,
      discountRate: item.discountRate, gstRate: item.gstRate,
      invoiceType, sellerStateCode, placeOfSupplyCode,
  })), data.roundToRupee);

  if (invoiceType === "GST") {
    for (const item of selectedItems) {
      const hasHsn = Boolean(item.hsnCode && item.hsnCode.trim().length > 0);
      const hasGst = item.gstRate !== null && item.gstRate !== undefined;
      if (!hasHsn || !hasGst) {
        throw new ApiError(400, "Cannot create GST invoice. GST/HSN configuration missing for selected material.");
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const invoiceNumber = await nextDocumentNumber(tx, businessId, "INVOICE", "INV");
    return tx.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        invoiceType,
        invoiceMode: data.invoiceMode,
        salesOrderId: order?.id || null,
        customerId: customer.id,
        businessName: business.name,
        businessGstin: business.gstNumber,
        businessAddress: business.address,
        businessPhone: business.phone,
        businessLogoUrl: business.logoUrl,
        businessEmail: business.email,
        businessWebsite: business.website,
        businessRegistrationType: business.registrationType,
        bankName: business.bankName,
        bankAccountNumber: business.accountNumber,
        bankIfscCode: business.ifscCode,
        bankBranch: business.branch,
        businessUpiId: business.upiId,
        invoiceFooter: business.invoiceFooter,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerGstin: customer.gstin,
        billingAddress: order?.billingAddress || customer.billingAddress,
        deliveryAddress: order?.deliveryAddress || customer.shippingAddress || customer.billingAddress,
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
        terms: data.terms ?? business.invoiceTerms,
        businessId,
        createdById: userId,
        items: {
          create: selectedItems.map((item, index) => {
            const line = calculation.calculatedLines[index];
            return {
              salesOrderItemId: item.salesOrderItemId, inventoryItemId: item.inventoryItemId,
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
  if (invoice.invoiceMode === "SALES_ORDER") {
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
  }
  await tx.customer.update({ where: { id: invoice.customerId }, data: { outstandingBalance: { increment: Number(invoice.totalAmount.toString()) } } });
  const publicToken = invoice.publicToken || generatePublicToken();
  await tx.invoice.update({ where: { id }, data: { status: "ISSUED", issuedAt: new Date(), publicToken } });
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

export const share = async (businessId: string, id: string, userId: string, phone?: string) => {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id, businessId } });
    if (!invoice) throw new ApiError(404, "Invoice not found.");

    const publicToken = invoice.publicToken || generatePublicToken();
    if (!invoice.publicToken) {
      await tx.invoice.update({ where: { id }, data: { publicToken } });
    }

    await tx.invoiceShare.create({
      data: {
        invoiceId: invoice.id,
        channel: "WHATSAPP",
        phone: phone || invoice.customerPhone || null,
        sharedById: userId,
      },
    });

    return { publicToken, publicUrl: `/i/${publicToken}` };
  });
};

export const getSharesByCustomer = async (businessId: string, customerId: string) => {
  return prisma.invoiceShare.findMany({
    where: {
      invoice: {
        customerId,
        businessId,
      },
    },
    include: {
      invoice: { select: { invoiceNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
};
