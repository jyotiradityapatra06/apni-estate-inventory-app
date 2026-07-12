import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import {
  createInventorySchema,
  updateInventorySchema,
  stockAdjustmentSchema,
} from "../validations/inventory.validation";

export const getAll = async (
  businessId: string,
  filters: { search?: string; category?: string; location?: string; stockStatus?: string }
) => {
  const whereClause: any = {
    businessId,
  };

  if (filters.search) {
    whereClause.OR = [
      { materialName: { contains: filters.search } },
      { sku: { contains: filters.search } },
    ];
  }

  if (filters.category && filters.category !== "All") {
    whereClause.category = filters.category;
  }

  if (filters.location && filters.location !== "All") {
    whereClause.location = filters.location;
  }

  const items = await prisma.inventoryItem.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  if (filters.stockStatus === "low") {
    return items.filter((item) => item.quantity < item.reorderLevel);
  }

  return items;
};

export const getById = async (businessId: string, id: string) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
  });

  if (!item || item.businessId !== businessId) {
    throw new ApiError(404, "Inventory item not found.");
  }

  return item;
};

export const create = async (businessId: string, input: any) => {
  const data = createInventorySchema.parse(input);

  const existingSku = await prisma.inventoryItem.findFirst({
    where: { sku: data.sku, businessId },
  });

  if (existingSku) {
    throw new ApiError(409, `An item with SKU '${data.sku}' already exists in your inventory.`);
  }

  const newItem = await prisma.inventoryItem.create({
    data: {
      ...data,
      businessId,
    },
  });

  return newItem;
};

export const update = async (businessId: string, id: string, input: any) => {
  const data = updateInventorySchema.parse(input);

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
  });

  if (!item || item.businessId !== businessId) {
    throw new ApiError(404, "Inventory item not found.");
  }

  if (data.sku && data.sku !== item.sku) {
    const existingSku = await prisma.inventoryItem.findFirst({
      where: { sku: data.sku, businessId },
    });
    if (existingSku) {
      throw new ApiError(409, `An item with SKU '${data.sku}' already exists in your inventory.`);
    }
  }

  const updatedItem = await prisma.inventoryItem.update({
    where: { id },
    data,
  });

  return updatedItem;
};

export const remove = async (businessId: string, id: string) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
  });

  if (!item || item.businessId !== businessId) {
    throw new ApiError(404, "Inventory item not found.");
  }

  await prisma.inventoryItem.delete({
    where: { id },
  });

  return { id };
};

export const adjustStock = async (
  businessId: string,
  userId: string,
  itemId: string,
  input: any
) => {
  const data = stockAdjustmentSchema.parse(input);

  return await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.businessId !== businessId) {
      throw new ApiError(404, "Inventory item not found.");
    }

    let newQuantity = item.quantity;

    if (data.type === "IN") {
      newQuantity += data.quantity;
    } else {
      if (item.quantity - data.quantity < 0) {
        throw new ApiError(400, `Stock adjustment failed. Cannot deduct ${data.quantity} ${item.unit} from available stock of ${item.quantity} ${item.unit}.`);
      }
      newQuantity -= data.quantity;
    }

    const updatedItem = await tx.inventoryItem.update({
      where: { id: itemId },
      data: { quantity: newQuantity },
    });

    await tx.stockTransaction.create({
      data: {
        type: data.type,
        quantity: data.quantity,
        note: data.note || null,
        inventoryItemId: itemId,
        userId,
      },
    });

    return updatedItem;
  });
};

export const getTransactions = async (businessId: string, itemId: string) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.businessId !== businessId) {
    throw new ApiError(404, "Inventory item not found.");
  }

  const transactions = await prisma.stockTransaction.findMany({
    where: { inventoryItemId: itemId },
    orderBy: { createdAt: "desc" },
  });

  return transactions;
};

export const getAllTransactions = async (businessId: string) => {
  return await prisma.stockTransaction.findMany({
    where: {
      inventoryItem: {
        businessId,
      },
    },
    include: {
      inventoryItem: {
        select: {
          materialName: true,
          unit: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
};
