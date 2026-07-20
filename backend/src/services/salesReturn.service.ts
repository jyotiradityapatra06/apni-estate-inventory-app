import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createSalesReturnSchema } from "../validations/return.validation";
import { nextDocumentNumber } from "./numberSequence.service";
import { syncMaterialAggregate } from "./stockBalance.service";
import { postLedgerEntry } from "./ledger.service";
import { Prisma } from "@prisma/client";

const include = {
  customer: { select: { id: true, name: true, phone: true } },
  invoice: { select: { id: true, invoiceNumber: true, status: true, invoiceType: true, balanceDue: true } },
  createdBy: { select: { id: true, name: true } },
  completedBy: { select: { id: true, name: true } },
  cancelledBy: { select: { id: true, name: true } },
  items: { include: { inventoryItem: { select: { id: true, materialName: true, sku: true, unit: true } }, godown: { select: { id: true, name: true } } } },
};

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const getAll = (businessId: string, q: Record<string, unknown> = {}) => {
  const where: Prisma.SalesReturnWhereInput = { businessId };
  if (typeof q.status === "string" && q.status) where.status = q.status.toUpperCase();
  if (typeof q.customerId === "string" && q.customerId) where.customerId = q.customerId;
  if (typeof q.invoiceId === "string" && q.invoiceId) where.invoiceId = q.invoiceId;
  if (typeof q.returnNumber === "string" && q.returnNumber) {
    where.returnNumber = { contains: q.returnNumber };
  }
  return prisma.salesReturn.findMany({ where, include, orderBy: { createdAt: "desc" } });
};

export const getById = async (businessId: string, id: string) => {
  const ret = await prisma.salesReturn.findFirst({ where: { id, businessId }, include });
  if (!ret) throw new ApiError(404, "Sales Return not found.");
  return ret;
};

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createSalesReturnSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    // 1. Check duplicate idempotency key
    const duplicate = await tx.salesReturn.findFirst({ where: { businessId, idempotencyKey: data.idempotencyKey } });
    if (duplicate) return tx.salesReturn.findUniqueOrThrow({ where: { id: duplicate.id }, include });

    // 2. Fetch Invoice
    const invoice = await tx.invoice.findFirst({
      where: { id: data.invoiceId, businessId },
      include: { items: true },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    if (invoice.status !== "ISSUED") {
      throw new ApiError(400, "Returns can only be created against issued invoices.");
    }

    // 3. Verify godowns
    const godownIds = [...new Set(data.items.map((i) => i.godownId))];
    const godowns = await tx.godown.findMany({
      where: { id: { in: godownIds }, businessId, isActive: true },
    });
    if (godowns.length !== godownIds.length) {
      throw new ApiError(400, "One or more destination godowns are invalid or inactive.");
    }

    // 4. Calculate items, totals and validate quantities
    let subtotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let taxTotal = 0;

    const returnItemsData = [];

    for (const itemInput of data.items) {
      const invItem = invoice.items.find((x) => x.id === itemInput.invoiceItemId);
      if (!invItem) throw new ApiError(400, "Invoice Item not found on this invoice.");

      // Calculate already returned quantity
      const completedReturns = await tx.salesReturnItem.findMany({
        where: {
          invoiceItemId: itemInput.invoiceItemId,
          salesReturn: { status: "COMPLETED", businessId },
        },
        select: { quantity: true },
      });
      const returnedQty = completedReturns.reduce((sum, item) => sum + Number(item.quantity.toString()), 0);
      const remaining = Number(invItem.quantity.toString()) - returnedQty;

      if (itemInput.quantity > remaining + 1e-9) {
        throw new ApiError(400, `Return quantity of ${invItem.materialName} exceeds remaining returnable quantity (${remaining}).`);
      }

      // Calculations
      const qty = itemInput.quantity;
      const rate = Number(invItem.rate.toString());
      const discountRate = Number(invItem.discountRate.toString());
      const gstRate = Number(invItem.gstRate.toString());

      const gross = round(qty * rate);
      const discount = round((gross * discountRate) / 100);
      const taxable = round(gross - discount);

      let cgst = 0, sgst = 0, igst = 0;
      if (invoice.invoiceType === "GST") {
        const tax = round((taxable * gstRate) / 100);
        if (Number(invItem.igstRate.toString()) > 0) {
          igst = tax;
        } else {
          cgst = round(tax / 2);
          sgst = round(tax - cgst);
        }
      }

      const itemTaxTotal = round(cgst + sgst + igst);
      const lineTotal = round(taxable + itemTaxTotal);

      subtotal += gross;
      discountTotal += discount;
      taxableTotal += taxable;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;
      taxTotal += itemTaxTotal;

      returnItemsData.push({
        inventoryItemId: invItem.inventoryItemId,
        godownId: itemInput.godownId,
        quantity: qty,
        rate,
        discountRate,
        gstRate,
        cgstRate: Number(invItem.cgstRate.toString()),
        sgstRate: Number(invItem.sgstRate.toString()),
        igstRate: Number(invItem.igstRate.toString()),
        lineTotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        taxTotal: itemTaxTotal,
        invoiceItemId: itemInput.invoiceItemId,
      });
    }

    const totalAmount = round(taxableTotal + taxTotal);
    const returnNumber = await nextDocumentNumber(tx, businessId, "SALES_RETURN", "SR");

    return tx.salesReturn.create({
      data: {
        returnNumber,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        businessId,
        createdById: userId,
        reason: data.reason,
        notes: data.notes,
        status: "DRAFT",
        subtotal: round(subtotal),
        discountTotal: round(discountTotal),
        taxableTotal: round(taxableTotal),
        cgstTotal: round(cgstTotal),
        sgstTotal: round(sgstTotal),
        igstTotal: round(igstTotal),
        taxTotal: round(taxTotal),
        totalAmount: round(totalAmount),
        idempotencyKey: data.idempotencyKey,
        items: {
          create: returnItemsData,
        },
      },
      include,
    });
  });
};

export const post = async (businessId: string, userId: string, id: string) => {
  return prisma.$transaction(async (tx) => {
    const ret = await tx.salesReturn.findFirst({
      where: { id, businessId },
      include: { items: { include: { invoiceItem: true } }, invoice: true },
    });
    if (!ret) throw new ApiError(404, "Sales Return not found.");
    if (ret.status !== "DRAFT") {
      throw new ApiError(400, "Only draft returns can be completed.");
    }

    // Re-verify quantities
    for (const item of ret.items) {
      const completedReturns = await tx.salesReturnItem.findMany({
        where: {
          invoiceItemId: item.invoiceItemId,
          salesReturn: { status: "COMPLETED", businessId },
        },
        select: { quantity: true },
      });
      const returnedQty = completedReturns.reduce((sum, x) => sum + Number(x.quantity.toString()), 0);
      const remaining = Number(item.invoiceItem.quantity.toString()) - returnedQty;

      if (Number(item.quantity.toString()) > remaining + 1e-9) {
        throw new ApiError(400, `Return quantity of ${item.invoiceItem.materialName} exceeds remaining returnable quantity.`);
      }
    }

    // 1. Update stock
    for (const item of ret.items) {
      await tx.godownStock.upsert({
        where: {
          businessId_godownId_inventoryItemId: {
            businessId,
            godownId: item.godownId,
            inventoryItemId: item.inventoryItemId,
          },
        },
        create: {
          businessId,
          godownId: item.godownId,
          inventoryItemId: item.inventoryItemId,
          quantity: Number(item.quantity.toString()),
          reservedQuantity: 0,
        },
        update: {
          quantity: { increment: Number(item.quantity.toString()) },
        },
      });

      await syncMaterialAggregate(tx, businessId, item.inventoryItemId);

      // Create Stock Transaction
      await tx.stockTransaction.create({
        data: {
          type: "SALES_RETURN",
          quantity: Number(item.quantity.toString()),
          reason: "SALES_RETURN",
          note: ret.notes || `Sales return ${ret.returnNumber} against ${ret.invoice.invoiceNumber}`,
          referenceType: "SALES_RETURN",
          referenceId: ret.id,
          inventoryItemId: item.inventoryItemId,
          godownId: item.godownId,
          userId,
          businessId,
          idempotencyKey: `SR_COMPLETED:${ret.id}:${item.id}`,
        },
      });
    }

    // 2. Adjust customer outstanding
    const returnAmt = Number(ret.totalAmount.toString());
    await tx.customer.update({
      where: { id: ret.customerId },
      data: { outstandingBalance: { decrement: returnAmt } },
    });

    // 3. Adjust Invoice balance due
    const newInvoiceBalance = Math.max(0, round(Number(ret.invoice.balanceDue.toString()) - returnAmt));
    await tx.invoice.update({
      where: { id: ret.invoiceId },
      data: { balanceDue: newInvoiceBalance },
    });

    // 4. Post Ledger Entry
    await postLedgerEntry(tx, {
      businessId,
      partyType: "CUSTOMER",
      partyId: ret.customerId,
      transactionType: "SALES_RETURN",
      referenceType: "SALES_RETURN",
      referenceId: ret.id,
      amount: ret.totalAmount,
      creditAmount: ret.totalAmount,
      debitAmount: 0,
      description: `Sales return ${ret.returnNumber} credit against invoice ${ret.invoice.invoiceNumber}`,
      createdById: userId,
      idempotencyKey: `SALES_RETURN_POSTED:${ret.id}`,
    });

    // 5. Update status
    return tx.salesReturn.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedById: userId,
        completedAt: new Date(),
      },
      include,
    });
  });
};

export const cancel = async (businessId: string, userId: string, id: string, reason?: string) => {
  const ret = await prisma.salesReturn.findFirst({ where: { id, businessId } });
  if (!ret) throw new ApiError(404, "Sales Return not found.");
  if (ret.status !== "DRAFT") {
    throw new ApiError(400, "Only draft returns can be cancelled.");
  }
  return prisma.salesReturn.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledById: userId,
      cancelledAt: new Date(),
      cancellationReason: reason || "Draft cancelled",
    },
    include,
  });
};
