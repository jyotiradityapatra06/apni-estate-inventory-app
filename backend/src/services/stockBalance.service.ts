import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError";

export const getOrCreateDefaultGodown = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  preferredName?: string
) => {
  if (preferredName) {
    const matching = await tx.godown.findFirst({
      where: { businessId, name: preferredName, isActive: true },
    });
    if (matching) return matching;
  }

  const existing = await tx.godown.findFirst({
    where: { businessId, isActive: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (existing) return existing;

  return tx.godown.create({
    data: {
      businessId,
      godownCode: "GD-001",
      name: preferredName || "Main Godown",
      isDefault: true,
    },
  });
};

export const assertGodownAccess = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  godownId: string
) => {
  const godown = await tx.godown.findFirst({ where: { id: godownId, businessId, isActive: true } });
  if (!godown) throw new ApiError(404, "Godown not found.");
  return godown;
};

export const syncMaterialAggregate = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  inventoryItemId: string
) => {
  const aggregate = await tx.godownStock.aggregate({
    where: { businessId, inventoryItemId },
    _sum: { quantity: true },
  });
  const quantity = aggregate._sum.quantity || 0;
  return tx.inventoryItem.update({ where: { id: inventoryItemId }, data: { quantity } });
};
