import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createSupplierSchema, updateSupplierSchema } from "../validations/supplier.validation";
import { nextDocumentNumber } from "./numberSequence.service";

const include = { suppliedMaterials: { include: { inventoryItem: { select: { id: true, materialName: true, sku: true, unit: true } } } } };
export const getAll = (businessId: string, filters: { search?: string; active?: string }) => {
  const where: any = { businessId };
  if (filters.search) where.OR = [
    { name: { contains: filters.search } }, { phone: { contains: filters.search } },
    { gstin: { contains: filters.search } }, { supplierCode: { contains: filters.search } },
  ];
  if (filters.active !== undefined) where.isActive = filters.active === "true";
  return prisma.supplier.findMany({ where, include, orderBy: { name: "asc" } });
};

export const getById = async (businessId: string, id: string) => {
  const supplier = await prisma.supplier.findFirst({ where: { id, businessId }, include: { ...include, purchaseOrders: { include: { items: true }, orderBy: { orderDate: "desc" } }, purchasePayments: { orderBy: { paymentDate: "desc" } } } });
  if (!supplier) throw new ApiError(404, "Supplier not found.");
  return { ...supplier, purchaseHistory: supplier.purchaseOrders };
};

const verifyMaterials = async (businessId: string, materialIds: string[]) => {
  if (!materialIds.length) return;
  const count = await prisma.inventoryItem.count({ where: { businessId, id: { in: materialIds } } });
  if (count !== materialIds.length) throw new ApiError(400, "One or more selected materials are invalid.");
};

export const create = async (businessId: string, input: unknown) => {
  const data = createSupplierSchema.parse(input);
  const materialIds = Array.from(new Set(data.materialIds || []));
  await verifyMaterials(businessId, materialIds);
  return prisma.$transaction(async (tx) => {
    const supplierCode = await nextDocumentNumber(tx, businessId, "SUPPLIER", "SUP");
    const { materialIds: _materialIds, ...supplierData } = data;
    return tx.supplier.create({
      data: {
        ...supplierData,
        supplierCode,
        pendingPayments: data.openingPayable,
        businessId,
        suppliedMaterials: materialIds.length ? { create: materialIds.map((inventoryItemId) => ({ inventoryItemId })) } : undefined,
      },
      include,
    });
  });
};

export const update = async (businessId: string, id: string, input: unknown) => {
  const data = updateSupplierSchema.parse(input);
  const supplier = await prisma.supplier.findFirst({ where: { id, businessId } });
  if (!supplier) throw new ApiError(404, "Supplier not found.");
  const materialIds = data.materialIds ? Array.from(new Set(data.materialIds)) : undefined;
  if (materialIds) await verifyMaterials(businessId, materialIds);
  return prisma.$transaction(async (tx) => {
    const { materialIds: _materialIds, ...supplierData } = data;
    const payableDelta = data.openingPayable === undefined ? 0 : data.openingPayable - supplier.openingPayable;
    await tx.supplier.update({
      where: { id },
      data: { ...supplierData, ...(payableDelta ? { pendingPayments: { increment: payableDelta } } : {}) },
    });
    if (materialIds) {
      await tx.supplierMaterial.deleteMany({ where: { supplierId: id } });
      if (materialIds.length) await tx.supplierMaterial.createMany({ data: materialIds.map((inventoryItemId) => ({ supplierId: id, inventoryItemId })) });
    }
    return tx.supplier.findUniqueOrThrow({ where: { id }, include });
  });
};

export const remove = async (businessId: string, id: string) => {
  const supplier = await prisma.supplier.findFirst({ where: { id, businessId } });
  if (!supplier) throw new ApiError(404, "Supplier not found.");
  return prisma.supplier.update({ where: { id }, data: { isActive: false } });
};
