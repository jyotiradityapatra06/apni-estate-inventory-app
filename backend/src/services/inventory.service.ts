import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import {
  createInventorySchema,
  updateInventorySchema,
  stockAdjustmentSchema,
} from "../validations/inventory.validation";
import {
  assertGodownAccess,
  getOrCreateDefaultGodown,
  syncMaterialAggregate,
} from "./stockBalance.service";

const materialInclude = {
  defaultSupplier: { select: { id: true, name: true, supplierCode: true } },
  supplierMaterials: {
    include: { supplier: { select: { id: true, name: true, supplierCode: true } } },
  },
  godownStocks: {
    include: { godown: { select: { id: true, name: true, godownCode: true } } },
  },
};

export const getAll = async (
  businessId: string,
  filters: { search?: string; category?: string; location?: string; stockStatus?: string }
) => {
  const whereClause: any = { businessId };
  if (filters.search) {
    whereClause.OR = [
      { materialName: { contains: filters.search } },
      { sku: { contains: filters.search } },
      { brand: { contains: filters.search } },
    ];
  }
  if (filters.category && filters.category !== "All") whereClause.category = filters.category;
  if (filters.location && filters.location !== "All") {
    whereClause.godownStocks = { some: { godown: { name: filters.location } } };
  }

  const items = await prisma.inventoryItem.findMany({
    where: whereClause,
    include: materialInclude,
    orderBy: { createdAt: "desc" },
  });
  if (filters.stockStatus === "low") {
    return items.filter((item) => item.quantity < item.minimumStockLevel);
  }
  return items;
};

export const getById = async (businessId: string, id: string) => {
  const item = await prisma.inventoryItem.findFirst({ where: { id, businessId }, include: materialInclude });
  if (!item) throw new ApiError(404, "Inventory item not found.");
  return item;
};

const verifySuppliers = async (businessId: string, supplierIds: string[]) => {
  if (!supplierIds.length) return;
  const count = await prisma.supplier.count({ where: { businessId, id: { in: supplierIds } } });
  if (count !== supplierIds.length) throw new ApiError(400, "One or more selected suppliers are invalid.");
};

export const create = async (businessId: string, userId: string, input: any) => {
  const data = createInventorySchema.parse(input);
  const existingSku = await prisma.inventoryItem.findFirst({ where: { sku: data.sku, businessId } });
  if (existingSku) throw new ApiError(409, `An item with SKU '${data.sku}' already exists in your inventory.`);

  const supplierIds = Array.from(new Set([...(data.supplierIds || []), ...(data.defaultSupplierId ? [data.defaultSupplierId] : [])]));
  await verifySuppliers(businessId, supplierIds);
  const openingStock = data.openingStock ?? data.quantity ?? 0;
  const minimumStockLevel = data.minimumStockLevel ?? data.reorderLevel ?? 0;

  return prisma.$transaction(async (tx) => {
    const godown = data.godownId
      ? await assertGodownAccess(tx, businessId, data.godownId)
      : await getOrCreateDefaultGodown(tx, businessId, data.location);
    const { supplierIds: _supplierIds, godownId: _godownId, ...itemData } = data;
    const item = await tx.inventoryItem.create({
      data: {
        ...itemData,
        openingStock,
        minimumStockLevel,
        reorderLevel: minimumStockLevel,
        quantity: openingStock,
        location: godown.name,
        businessId,
      },
    });
    await tx.godownStock.create({
      data: { businessId, godownId: godown.id, inventoryItemId: item.id, quantity: openingStock },
    });
    if (openingStock > 0) {
      await tx.stockTransaction.create({
        data: {
          type: "IN",
          quantity: openingStock,
          note: "Opening stock",
          reason: "OPENING_STOCK",
          referenceType: "MATERIAL",
          referenceId: item.id,
          inventoryItemId: item.id,
          godownId: godown.id,
          userId,
          businessId,
        },
      });
    }
    if (supplierIds.length) {
      await tx.supplierMaterial.createMany({
        data: supplierIds.map((supplierId) => ({ supplierId, inventoryItemId: item.id, isPreferred: supplierId === data.defaultSupplierId })),
      });
    }
    return tx.inventoryItem.findUniqueOrThrow({ where: { id: item.id }, include: materialInclude });
  });
};

export const update = async (businessId: string, userId: string, id: string, input: any) => {
  const data = updateInventorySchema.parse(input);
  const item = await prisma.inventoryItem.findFirst({ where: { id, businessId } });
  if (!item) throw new ApiError(404, "Inventory item not found.");
  if (data.sku && data.sku !== item.sku) {
    const existingSku = await prisma.inventoryItem.findFirst({ where: { sku: data.sku, businessId, NOT: { id } } });
    if (existingSku) throw new ApiError(409, `An item with SKU '${data.sku}' already exists in your inventory.`);
  }

  const supplierIds = data.supplierIds
    ? Array.from(new Set([...(data.supplierIds || []), ...(data.defaultSupplierId ? [data.defaultSupplierId] : [])]))
    : undefined;
  if (supplierIds) await verifySuppliers(businessId, supplierIds);

  return prisma.$transaction(async (tx) => {
    const { supplierIds: _supplierIds, godownId, quantity, ...updateData } = data;
    if (updateData.minimumStockLevel !== undefined) updateData.reorderLevel = updateData.minimumStockLevel;
    if (updateData.reorderLevel !== undefined && updateData.minimumStockLevel === undefined) {
      updateData.minimumStockLevel = updateData.reorderLevel;
    }
    if (godownId) {
      const godown = await assertGodownAccess(tx, businessId, godownId);
      updateData.location = godown.name;
    }
    await tx.inventoryItem.update({ where: { id }, data: updateData });

    if (quantity !== undefined && quantity !== item.quantity) {
      const balance = await tx.godownStock.findFirst({
        where: { businessId, inventoryItemId: id, ...(godownId ? { godownId } : {}) },
        orderBy: { quantity: "desc" },
      });
      const godown = balance
        ? await tx.godown.findUniqueOrThrow({ where: { id: balance.godownId } })
        : await getOrCreateDefaultGodown(tx, businessId, item.location);
      const delta = quantity - item.quantity;
      if (balance) {
        if (balance.quantity + delta < 0) throw new ApiError(400, "The selected godown does not have enough stock.");
        await tx.godownStock.update({ where: { id: balance.id }, data: { quantity: { increment: delta } } });
      } else {
        await tx.godownStock.create({ data: { businessId, godownId: godown.id, inventoryItemId: id, quantity } });
      }
      await tx.stockTransaction.create({
        data: {
          type: delta >= 0 ? "IN" : "OUT",
          quantity: Math.abs(delta),
          note: "Quantity corrected while editing material",
          reason: "MATERIAL_EDIT",
          referenceType: "MATERIAL",
          referenceId: id,
          inventoryItemId: id,
          godownId: godown.id,
          userId,
          businessId,
        },
      });
      await syncMaterialAggregate(tx, businessId, id);
    }

    if (supplierIds) {
      await tx.supplierMaterial.deleteMany({ where: { inventoryItemId: id } });
      if (supplierIds.length) {
        await tx.supplierMaterial.createMany({
          data: supplierIds.map((supplierId) => ({ supplierId, inventoryItemId: id, isPreferred: supplierId === data.defaultSupplierId })),
        });
      }
    }
    return tx.inventoryItem.findUniqueOrThrow({ where: { id }, include: materialInclude });
  });
};

export const remove = async (businessId: string, id: string) => {
  const item = await prisma.inventoryItem.findFirst({ where: { id, businessId } });
  if (!item) throw new ApiError(404, "Inventory item not found.");
  await prisma.inventoryItem.delete({ where: { id } });
  return { id };
};

export const adjustStock = async (businessId: string, userId: string, itemId: string, input: any) => {
  const data = stockAdjustmentSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findFirst({ where: { id: itemId, businessId } });
    if (!item) throw new ApiError(404, "Inventory item not found.");

    const existingTransaction = await tx.stockTransaction.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existingTransaction) {
      if (existingTransaction.businessId !== businessId || existingTransaction.inventoryItemId !== itemId) {
        throw new ApiError(409, "This stock request key has already been used.");
      }
      return tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId }, include: materialInclude });
    }

    let balance = data.godownId
      ? await tx.godownStock.findFirst({ where: { businessId, inventoryItemId: itemId, godownId: data.godownId } })
      : await tx.godownStock.findFirst({
          where: { businessId, inventoryItemId: itemId, ...(data.type === "OUT" ? { quantity: { gte: data.quantity } } : {}) },
          orderBy: [{ godown: { isDefault: "desc" } }, { quantity: "desc" }],
        });
    const godown = data.godownId
      ? await assertGodownAccess(tx, businessId, data.godownId)
      : balance
        ? await tx.godown.findUniqueOrThrow({ where: { id: balance.godownId } })
        : await getOrCreateDefaultGodown(tx, businessId, item.location);

    if (data.type === "OUT" && (!balance || balance.quantity < data.quantity)) {
      throw new ApiError(400, `Selected godown does not have ${data.quantity} ${item.unit} available.`);
    }
    if (!balance) {
      balance = await tx.godownStock.create({ data: { businessId, godownId: godown.id, inventoryItemId: itemId, quantity: 0 } });
    }
    await tx.godownStock.update({
      where: { id: balance.id },
      data: { quantity: data.type === "IN" ? { increment: data.quantity } : { decrement: data.quantity } },
    });
    await tx.stockTransaction.create({
      data: {
        type: data.type,
        quantity: data.quantity,
        note: data.note || null,
        reason: data.reason || "MANUAL_ADJUSTMENT",
        idempotencyKey: data.idempotencyKey,
        inventoryItemId: itemId,
        godownId: godown.id,
        userId,
        businessId,
      },
    });
    await syncMaterialAggregate(tx, businessId, itemId);
    return tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId }, include: materialInclude });
  });
};

export const getTransactions = async (businessId: string, itemId: string) => {
  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, businessId } });
  if (!item) throw new ApiError(404, "Inventory item not found.");
  return prisma.stockTransaction.findMany({
    where: { businessId, inventoryItemId: itemId },
    include: { godown: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const getAllTransactions = async (businessId: string) => prisma.stockTransaction.findMany({
  where: { businessId },
  include: {
    inventoryItem: { select: { materialName: true, unit: true } },
    godown: { select: { id: true, name: true } },
    user: { select: { id: true, name: true } },
  },
  orderBy: { createdAt: "desc" },
  take: 20,
});
