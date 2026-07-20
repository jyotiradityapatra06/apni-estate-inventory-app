import prisma from "../config/db";
import { ApiError } from "../utils/apiError";
import { createExpenseCategorySchema, updateExpenseCategorySchema } from "../validations/expense.validation";

export const DEFAULT_EXPENSE_CATEGORIES = ["Fuel", "Transportation", "Labour", "Rent", "Electricity", "Internet", "Office Expense", "Vehicle Maintenance", "Machinery Maintenance", "Loading & Unloading", "Food & Refreshments", "Miscellaneous"];
const normalize = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");

export const ensureDefaults = async (businessId: string, userId: string) => prisma.$transaction(DEFAULT_EXPENSE_CATEGORIES.map(name => prisma.expenseCategory.upsert({
  where: { businessId_normalizedName: { businessId, normalizedName: normalize(name) } }, update: {}, create: { name, normalizedName: normalize(name), isDefault: true, businessId, createdById: userId },
})));

export const list = async (businessId: string, userId: string, query: Record<string, unknown>) => {
  await ensureDefaults(businessId, userId);
  const search = typeof query.search === "string" ? query.search.trim().toLocaleLowerCase("en-IN") : "";
  const active = query.active === "false" ? false : query.active === "all" ? undefined : true;
  const rows = await prisma.expenseCategory.findMany({ where: { businessId, ...(active === undefined ? {} : { isActive: active }) }, include: { _count: { select: { expenses: true } } }, orderBy: { name: "asc" } });
  return search ? rows.filter(row => row.name.toLocaleLowerCase("en-IN").includes(search) || row.description?.toLocaleLowerCase("en-IN").includes(search)) : rows;
};

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createExpenseCategorySchema.parse(input), normalizedName = normalize(data.name);
  if (await prisma.expenseCategory.findUnique({ where: { businessId_normalizedName: { businessId, normalizedName } } })) throw new ApiError(409, "An expense category with this name already exists.");
  return prisma.expenseCategory.create({ data: { ...data, name: data.name.trim().replace(/\s+/g, " "), normalizedName, businessId, createdById: userId } });
};

export const update = async (businessId: string, id: string, input: unknown) => {
  const data = updateExpenseCategorySchema.parse(input), current = await prisma.expenseCategory.findFirst({ where: { id, businessId } });
  if (!current) throw new ApiError(404, "Expense category not found.");
  const normalizedName = data.name ? normalize(data.name) : undefined;
  if (normalizedName && normalizedName !== current.normalizedName && await prisma.expenseCategory.findUnique({ where: { businessId_normalizedName: { businessId, normalizedName } } })) throw new ApiError(409, "An expense category with this name already exists.");
  return prisma.expenseCategory.update({ where: { id }, data: { ...data, ...(data.name ? { name: data.name.trim().replace(/\s+/g, " "), normalizedName } : {}) } });
};

export const deactivate = async (businessId: string, id: string) => {
  const current = await prisma.expenseCategory.findFirst({ where: { id, businessId } });
  if (!current) throw new ApiError(404, "Expense category not found.");
  if (!current.isActive) throw new ApiError(409, "Expense category is already inactive.");
  return prisma.expenseCategory.update({ where: { id }, data: { isActive: false } });
};
