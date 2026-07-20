import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createGodownSchema, updateGodownSchema } from "../validations/godown.validation";
import { nextDocumentNumber } from "./numberSequence.service";

const include = { stockBalances: { include: { inventoryItem: { select: { id: true, materialName: true, sku: true, unit: true, minimumStockLevel: true } } } } };

export const getAll = (businessId: string) => prisma.godown.findMany({ where: { businessId }, include, orderBy: [{ isDefault: "desc" }, { name: "asc" }] });

export const getById = async (businessId: string, id: string) => {
  const godown = await prisma.godown.findFirst({ where: { id, businessId }, include });
  if (!godown) throw new ApiError(404, "Godown not found.");
  return godown;
};

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createGodownSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const godowns = await tx.godown.findMany({ where: { businessId } });
    const normalizedName = data.name.toLowerCase();
    if (godowns.some((g) => g.name.toLowerCase() === normalizedName)) {
      throw new ApiError(400, "A Godown with this name already exists.");
    }
    const godownCode = (data.godownCode || (await nextDocumentNumber(tx, businessId, "GODOWN", "GD", 3))).toUpperCase();
    if (godowns.some((g) => g.godownCode.toUpperCase() === godownCode)) {
      throw new ApiError(400, "A Godown with this code already exists.");
    }
    const existingCount = await tx.godown.count({ where: { businessId, isActive: true } });
    const makeDefault = data.isDefault || existingCount === 0;
    if (makeDefault) await tx.godown.updateMany({ where: { businessId }, data: { isDefault: false } });
    return tx.godown.create({
      data: {
        ...data,
        godownCode,
        isDefault: makeDefault,
        businessId,
        createdById: userId,
        updatedById: userId,
      },
      include,
    });
  });
};

export const update = async (businessId: string, userId: string, id: string, input: unknown) => {
  const data = updateGodownSchema.parse(input);
  const godown = await prisma.godown.findFirst({ where: { id, businessId } });
  if (!godown) throw new ApiError(404, "Godown not found.");
  return prisma.$transaction(async (tx) => {
    const godowns = await tx.godown.findMany({ where: { businessId, NOT: { id } } });
    if (data.name) {
      const normalizedName = data.name.toLowerCase();
      if (godowns.some((g) => g.name.toLowerCase() === normalizedName)) {
        throw new ApiError(400, "A Godown with this name already exists.");
      }
    }
    if (data.godownCode) {
      const godownCode = data.godownCode.toUpperCase();
      if (godowns.some((g) => g.godownCode.toUpperCase() === godownCode)) {
        throw new ApiError(400, "A Godown with this code already exists.");
      }
    }
    if (data.isDefault) await tx.godown.updateMany({ where: { businessId, NOT: { id } }, data: { isDefault: false } });
    if (data.isActive === false) {
      if (godown.isDefault) {
        throw new ApiError(400, "Choose another default godown before deactivating this one.");
      }
      const stockBalances = await tx.godownStock.findMany({ where: { godownId: id, businessId } });
      if (stockBalances.some((b) => b.quantity > 0)) {
        throw new ApiError(400, "Cannot deactivate a Godown containing stock.");
      }
    }
    return tx.godown.update({
      where: { id },
      data: {
        ...data,
        godownCode: data.godownCode ? data.godownCode.toUpperCase() : undefined,
        updatedById: userId,
      },
      include,
    });
  });
};

export const remove = async (businessId: string, id: string) => {
  const godown = await prisma.godown.findFirst({ where: { id, businessId }, include: { stockBalances: true } });
  if (!godown) throw new ApiError(404, "Godown not found.");
  if (godown.isDefault) throw new ApiError(400, "Choose another default godown before deactivating this one.");
  if (godown.stockBalances.some((balance) => balance.quantity !== 0)) {
    throw new ApiError(400, "Cannot deactivate a Godown containing stock.");
  }
  return prisma.godown.update({ where: { id }, data: { isActive: false } });
};
