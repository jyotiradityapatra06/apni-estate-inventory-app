import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createPurchaseReturnSchema } from "../validations/return.validation";
import { nextDocumentNumber } from "./numberSequence.service";
import { syncMaterialAggregate } from "./stockBalance.service";
import { postLedgerEntry } from "./ledger.service";
import { Prisma } from "@prisma/client";

const include = {
  supplier: { select: { id: true, name: true, phone: true } },
  purchaseOrder: { select: { id: true, purchaseOrderNumber: true, status: true, balanceDue: true } },
  createdBy: { select: { id: true, name: true } },
  completedBy: { select: { id: true, name: true } },
  cancelledBy: { select: { id: true, name: true } },
  items: { include: { inventoryItem: { select: { id: true, materialName: true, sku: true, unit: true } }, godown: { select: { id: true, name: true } } } },
};

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const getAll = (businessId: string, q: Record<string, unknown> = {}) => {
  const where: Prisma.PurchaseReturnWhereInput = { businessId };
  if (typeof q.status === "string" && q.status) where.status = q.status.toUpperCase();
  if (typeof q.supplierId === "string" && q.supplierId) where.supplierId = q.supplierId;
  if (typeof q.purchaseOrderId === "string" && q.purchaseOrderId) where.purchaseOrderId = q.purchaseOrderId;
  if (typeof q.returnNumber === "string" && q.returnNumber) {
    where.returnNumber = { contains: q.returnNumber };
  }
  return prisma.purchaseReturn.findMany({ where, include, orderBy: { createdAt: "desc" } });
};

export const getById = async (businessId: string, id: string) => {
  const ret = await prisma.purchaseReturn.findFirst({ where: { id, businessId }, include });
  if (!ret) throw new ApiError(404, "Purchase Return not found.");
  return ret;
};

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createPurchaseReturnSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    // 1. Check duplicate idempotency key
    const duplicate = await tx.purchaseReturn.findFirst({ where: { businessId, idempotencyKey: data.idempotencyKey } });
    if (duplicate) return tx.purchaseReturn.findUniqueOrThrow({ where: { id: duplicate.id }, include });

    // 2. Fetch Purchase Order
    const po = await tx.purchaseOrder.findFirst({
      where: { id: data.purchaseOrderId, businessId },
      include: { items: true },
    });
    if (!po) throw new ApiError(404, "Purchase Order not found.");
    if (!["RECEIVED", "PARTIALLY_RECEIVED"].includes(po.status)) {
      throw new ApiError(400, "Returns can only be created against received or partially received purchase orders.");
    }

    // 3. Verify godowns
    const godownIds = [...new Set(data.items.map((i) => i.godownId))];
    const godowns = await tx.godown.findMany({
      where: { id: { in: godownIds }, businessId, isActive: true },
    });
    if (godowns.length !== godownIds.length) {
      throw new ApiError(400, "One or more source godowns are invalid or inactive.");
    }

    // 4. Calculate items, totals and validate quantities
    let subtotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let taxTotal = 0;

    const returnItemsData = [];

    for (const itemInput of data.items) {
      const poItem = po.items.find((x) => x.id === itemInput.purchaseOrderItemId);
      if (!poItem) throw new ApiError(400, "Purchase Item not found on this Purchase Order.");

      // Calculate already returned quantity
      const completedReturns = await tx.purchaseReturnItem.findMany({
        where: {
          purchaseOrderItemId: itemInput.purchaseOrderItemId,
          purchaseReturn: { status: "COMPLETED", businessId },
        },
        select: { quantity: true },
      });
      const returnedQty = completedReturns.reduce((sum, item) => sum + Number(item.quantity.toString()), 0);
      const remaining = Number(poItem.receivedQuantity.toString()) - returnedQty;

      if (itemInput.quantity > remaining + 1e-9) {
        throw new ApiError(400, `Return quantity of ${poItem.materialName} exceeds remaining returnable quantity (${remaining}).`);
      }

      // Calculations
      const qty = itemInput.quantity;
      const rate = Number(poItem.rate.toString());
      const discountRate = Number(poItem.discountRate.toString());
      const gstRate = Number(poItem.gstRate.toString());

      const gross = round(qty * rate);
      const discount = round((gross * discountRate) / 100);
      const taxable = round(gross - discount);
      const itemTaxTotal = round((taxable * gstRate) / 100);
      const lineTotal = round(taxable + itemTaxTotal);

      subtotal += gross;
      discountTotal += discount;
      taxableTotal += taxable;
      taxTotal += itemTaxTotal;

      returnItemsData.push({
        inventoryItemId: poItem.inventoryItemId,
        godownId: itemInput.godownId,
        quantity: qty,
        rate,
        discountRate,
        gstRate,
        lineTotal,
        taxAmount: itemTaxTotal,
        purchaseOrderItemId: itemInput.purchaseOrderItemId,
      });
    }

    const totalAmount = round(taxableTotal + taxTotal);
    const returnNumber = await nextDocumentNumber(tx, businessId, "PURCHASE_RETURN", "PR");

    return tx.purchaseReturn.create({
      data: {
        returnNumber,
        purchaseOrderId: po.id,
        supplierId: po.supplierId,
        businessId,
        createdById: userId,
        reason: data.reason,
        notes: data.notes,
        status: "DRAFT",
        subtotal: round(subtotal),
        discountTotal: round(discountTotal),
        taxableTotal: round(taxableTotal),
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
    const ret = await tx.purchaseReturn.findFirst({
      where: { id, businessId },
      include: { items: { include: { purchaseOrderItem: true } }, purchaseOrder: true },
    });
    if (!ret) throw new ApiError(404, "Purchase Return not found.");
    if (ret.status !== "DRAFT") {
      throw new ApiError(400, "Only draft returns can be completed.");
    }

    // Re-verify quantities and physical stock availability in source godown
    for (const item of ret.items) {
      // 1. Validate remaining returnable qty
      const completedReturns = await tx.purchaseReturnItem.findMany({
        where: {
          purchaseOrderItemId: item.purchaseOrderItemId,
          purchaseReturn: { status: "COMPLETED", businessId },
        },
        select: { quantity: true },
      });
      const returnedQty = completedReturns.reduce((sum, x) => sum + Number(x.quantity.toString()), 0);
      const remaining = Number(item.purchaseOrderItem.receivedQuantity.toString()) - returnedQty;

      if (Number(item.quantity.toString()) > remaining + 1e-9) {
        throw new ApiError(400, `Return quantity of ${item.purchaseOrderItem.materialName} exceeds remaining returnable quantity.`);
      }

      // 2. Validate physical stock exists in source godown
      const stock = await tx.godownStock.findUnique({
        where: {
          businessId_godownId_inventoryItemId: {
            businessId,
            godownId: item.godownId,
            inventoryItemId: item.inventoryItemId,
          },
        },
      });
      const availableStock = stock ? stock.quantity : 0;
      if (Number(item.quantity.toString()) > availableStock + 1e-9) {
        throw new ApiError(400, `Insufficient physical stock in source godown for ${item.purchaseOrderItem.materialName}.`);
      }
    }

    // 1. Deduct stock
    for (const item of ret.items) {
      await tx.godownStock.update({
        where: {
          businessId_godownId_inventoryItemId: {
            businessId,
            godownId: item.godownId,
            inventoryItemId: item.inventoryItemId,
          },
        },
        data: {
          quantity: { decrement: Number(item.quantity.toString()) },
        },
      });

      await syncMaterialAggregate(tx, businessId, item.inventoryItemId);

      // Create Stock Transaction
      await tx.stockTransaction.create({
        data: {
          type: "PURCHASE_RETURN",
          quantity: Number(item.quantity.toString()),
          reason: "PURCHASE_RETURN",
          note: ret.notes || `Purchase return ${ret.returnNumber} against ${ret.purchaseOrder.purchaseOrderNumber}`,
          referenceType: "PURCHASE_RETURN",
          referenceId: ret.id,
          inventoryItemId: item.inventoryItemId,
          godownId: item.godownId,
          userId,
          businessId,
          idempotencyKey: `PR_COMPLETED:${ret.id}:${item.id}`,
        },
      });
    }

    // 2. Adjust supplier outstanding/pending payments
    const returnAmt = Number(ret.totalAmount.toString());
    await tx.supplier.update({
      where: { id: ret.supplierId },
      data: { pendingPayments: { decrement: returnAmt } },
    });

    // 3. Adjust PO balance due
    const newPOBalance = Math.max(0, round(Number(ret.purchaseOrder.balanceDue.toString()) - returnAmt));
    await tx.purchaseOrder.update({
      where: { id: ret.purchaseOrderId },
      data: { balanceDue: newPOBalance },
    });

    // 4. Post Ledger Entry (debit supplier balance to reduce liability)
    await postLedgerEntry(tx, {
      businessId,
      partyType: "SUPPLIER",
      partyId: ret.supplierId,
      transactionType: "PURCHASE_RETURN",
      referenceType: "PURCHASE_RETURN",
      referenceId: ret.id,
      amount: ret.totalAmount,
      debitAmount: ret.totalAmount,
      creditAmount: 0,
      description: `Purchase return ${ret.returnNumber} debit against PO ${ret.purchaseOrder.purchaseOrderNumber}`,
      createdById: userId,
      idempotencyKey: `PURCHASE_RETURN_POSTED:${ret.id}`,
    });

    // 5. Update status
    return tx.purchaseReturn.update({
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
  const ret = await prisma.purchaseReturn.findFirst({ where: { id, businessId } });
  if (!ret) throw new ApiError(404, "Purchase Return not found.");
  if (ret.status !== "DRAFT") {
    throw new ApiError(400, "Only draft returns can be cancelled.");
  }
  return prisma.purchaseReturn.update({
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
