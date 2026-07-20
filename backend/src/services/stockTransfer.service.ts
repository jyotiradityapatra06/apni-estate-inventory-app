import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createTransferSchema } from "../validations/godown.validation";
import { nextDocumentNumber } from "./numberSequence.service";
import { syncMaterialAggregate } from "./stockBalance.service";

const include = {
  sourceGodown: { select: { id: true, name: true, godownCode: true } },
  destinationGodown: { select: { id: true, name: true, godownCode: true } },
  createdBy: { select: { id: true, name: true } },
  items: { include: { inventoryItem: { select: { id: true, materialName: true, sku: true, unit: true } } } },
};

export const getAll = (businessId: string) => prisma.stockTransfer.findMany({ where: { businessId }, include, orderBy: { createdAt: "desc" } });

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createTransferSchema.parse(input);
  if (new Set(data.items.map((item) => item.inventoryItemId)).size !== data.items.length) {
    throw new ApiError(400, "A material can only appear once in a transfer.");
  }
  const godownCount = await prisma.godown.count({
    where: { businessId, id: { in: [data.sourceGodownId, data.destinationGodownId] }, isActive: true }
  });
  if (godownCount !== 2) {
    throw new ApiError(400, "Select valid active source and destination godowns.");
  }
  const materialCount = await prisma.inventoryItem.count({
    where: { businessId, id: { in: data.items.map((item) => item.inventoryItemId) } }
  });
  if (materialCount !== data.items.length) {
    throw new ApiError(400, "One or more transfer materials are invalid.");
  }
  return prisma.$transaction(async (tx) => {
    const transferNumber = await nextDocumentNumber(tx, businessId, "STOCK_TRANSFER", "TRF");
    return tx.stockTransfer.create({
      data: {
        transferNumber,
        transferDate: data.transferDate ? new Date(data.transferDate) : new Date(),
        notes: data.notes,
        sourceGodownId: data.sourceGodownId,
        destinationGodownId: data.destinationGodownId,
        createdById: userId,
        businessId,
        items: { create: data.items },
      },
      include,
    });
  });
};

export const post = async (businessId: string, userId: string, id: string) => prisma.$transaction(async (tx) => {
  const transfer = await tx.stockTransfer.findFirst({ where: { id, businessId }, include: { items: true } });
  if (!transfer) throw new ApiError(404, "Stock transfer not found.");
  if (transfer.status !== "DRAFT") throw new ApiError(400, "Only draft transfers can be posted.");

  // Re-read stock inside transaction to prevent race conditions
  for (const line of transfer.items) {
    const source = await tx.godownStock.findUnique({
      where: { businessId_godownId_inventoryItemId: { businessId, godownId: transfer.sourceGodownId, inventoryItemId: line.inventoryItemId } },
    });
    if (!source || source.quantity < line.quantity) {
      throw new ApiError(400, "Insufficient stock in the source godown for one or more materials.");
    }
  }

  for (const line of transfer.items) {
    await tx.godownStock.update({
      where: { businessId_godownId_inventoryItemId: { businessId, godownId: transfer.sourceGodownId, inventoryItemId: line.inventoryItemId } },
      data: { quantity: { decrement: line.quantity } },
    });
    await tx.godownStock.upsert({
      where: { businessId_godownId_inventoryItemId: { businessId, godownId: transfer.destinationGodownId, inventoryItemId: line.inventoryItemId } },
      update: { quantity: { increment: line.quantity } },
      create: { businessId, godownId: transfer.destinationGodownId, inventoryItemId: line.inventoryItemId, quantity: line.quantity },
    });
    await tx.stockTransaction.createMany({
      data: [
        { type: "TRANSFER_OUT", quantity: line.quantity, reason: "GODOWN_TRANSFER", referenceType: "STOCK_TRANSFER", referenceId: id, inventoryItemId: line.inventoryItemId, godownId: transfer.sourceGodownId, userId, businessId },
        { type: "TRANSFER_IN", quantity: line.quantity, reason: "GODOWN_TRANSFER", referenceType: "STOCK_TRANSFER", referenceId: id, inventoryItemId: line.inventoryItemId, godownId: transfer.destinationGodownId, userId, businessId },
      ]
    });
    await syncMaterialAggregate(tx, businessId, line.inventoryItemId);
  }

  await tx.stockTransfer.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedById: userId,
      completedAt: new Date(),
    }
  });

  return tx.stockTransfer.findUniqueOrThrow({ where: { id }, include });
});

export const cancel = async (businessId: string, userId: string, id: string, reason?: string) => {
  const transfer = await prisma.stockTransfer.findFirst({ where: { id, businessId } });
  if (!transfer) throw new ApiError(404, "Stock transfer not found.");
  if (transfer.status !== "DRAFT") throw new ApiError(400, "Only draft transfers can be cancelled.");
  return prisma.stockTransfer.update({
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
