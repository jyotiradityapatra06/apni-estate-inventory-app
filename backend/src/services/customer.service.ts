import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createCustomerSchema, updateCustomerSchema } from "../validations/customer.validation";
import { nextDocumentNumber } from "./numberSequence.service";

export const getAll = (businessId: string, filters: { search?: string; active?: string }) => {
  const where: any = { businessId };
  if (filters.search) where.OR = [
    { name: { contains: filters.search } }, { phone: { contains: filters.search } },
    { gstin: { contains: filters.search } }, { customerCode: { contains: filters.search } },
  ];
  if (filters.active !== undefined) where.isActive = filters.active === "true";
  return prisma.customer.findMany({ where, orderBy: { name: "asc" } });
};

export const getById = async (businessId: string, id: string) => {
  const customer = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!customer) throw new ApiError(404, "Customer not found.");
  return { ...customer, transactionHistory: customer.openingBalance > 0 ? [{ type: "OPENING_BALANCE", amount: customer.openingBalance, date: customer.createdAt }] : [] };
};

export const create = async (businessId: string, input: unknown) => {
  const data = createCustomerSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const customerCode = await nextDocumentNumber(tx, businessId, "CUSTOMER", "CUS");
    return tx.customer.create({ data: { ...data, customerCode, outstandingBalance: data.openingBalance, businessId } });
  });
};

export const update = async (businessId: string, id: string, input: unknown) => {
  const data = updateCustomerSchema.parse(input);
  const customer = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!customer) throw new ApiError(404, "Customer not found.");
  const balanceDelta = data.openingBalance === undefined ? 0 : data.openingBalance - customer.openingBalance;
  return prisma.customer.update({
    where: { id },
    data: { ...data, ...(balanceDelta ? { outstandingBalance: { increment: balanceDelta } } : {}) },
  });
};

export const remove = async (businessId: string, id: string) => {
  const customer = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!customer) throw new ApiError(404, "Customer not found.");
  return prisma.customer.update({ where: { id }, data: { isActive: false } });
};
