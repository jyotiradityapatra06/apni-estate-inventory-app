import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import { ApiError } from "../utils/apiError";
import { cancelExpenseSchema, createExpenseSchema, expenseQuerySchema, markExpensePaidSchema, updateExpenseSchema } from "../validations/expense.validation";
import { postLedgerEntry } from "./ledger.service";
import { nextDocumentNumber } from "./numberSequence.service";

const include = { category: true, createdBy: { select: { id: true, name: true } }, cancelledBy: { select: { id: true, name: true } } };
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const totals = (amount: number, gstApplicable: boolean, gstRate: number) => { const rate = gstApplicable ? gstRate : 0, gstAmount = round(amount * rate / 100); return { gstRate: rate, gstAmount, totalAmount: round(amount + gstAmount) }; };
const category = async (businessId: string, categoryId: string) => { const row = await prisma.expenseCategory.findFirst({ where: { id: categoryId, businessId, isActive: true } }); if (!row) throw new ApiError(400, "Active expense category not found."); return row; };

export const list = async (businessId: string, raw: unknown) => {
  const q = expenseQuerySchema.parse(raw), where: Prisma.ExpenseWhereInput = { businessId, ...(q.categoryId ? { categoryId: q.categoryId } : {}), ...(q.paymentStatus ? { paymentStatus: q.paymentStatus } : {}), ...(q.paymentMode ? { paymentMode: q.paymentMode } : {}), ...(q.gstApplicable !== undefined ? { gstApplicable: q.gstApplicable } : {}), ...((q.from || q.to) ? { expenseDate: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}), ...(q.search ? { OR: [{ expenseNumber: { contains: q.search } }, { payee: { contains: q.search } }, { notes: { contains: q.search } }, { category: { name: { contains: q.search } } }] } : {}) };
  const [data, total] = await Promise.all([prisma.expense.findMany({ where, include, orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }], skip: (q.page - 1) * q.limit, take: q.limit }), prisma.expense.count({ where })]);
  return { data, pagination: { page: q.page, limit: q.limit, total, pages: Math.max(1, Math.ceil(total / q.limit)) } };
};

export const summary = async (businessId: string) => {
  const today = new Date(); today.setHours(0, 0, 0, 0); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const month = new Date(today.getFullYear(), today.getMonth(), 1), nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const [todayTotal, monthTotal, paid, pending] = await Promise.all([
    prisma.expense.aggregate({ where: { businessId, paymentStatus: { not: "CANCELLED" }, expenseDate: { gte: today, lt: tomorrow } }, _sum: { totalAmount: true } }),
    prisma.expense.aggregate({ where: { businessId, paymentStatus: { not: "CANCELLED" }, expenseDate: { gte: month, lt: nextMonth } }, _sum: { totalAmount: true } }),
    prisma.expense.aggregate({ where: { businessId, paymentStatus: "PAID" }, _sum: { totalAmount: true } }),
    prisma.expense.aggregate({ where: { businessId, paymentStatus: "PENDING" }, _sum: { totalAmount: true } }),
  ]);
  return { todayExpenses: Number(todayTotal._sum.totalAmount || 0), monthExpenses: Number(monthTotal._sum.totalAmount || 0), totalPaid: Number(paid._sum.totalAmount || 0), pendingExpenses: Number(pending._sum.totalAmount || 0) };
};

export const get = async (businessId: string, id: string) => {
  const expense = await prisma.expense.findFirst({ where: { id, businessId }, include }); if (!expense) throw new ApiError(404, "Expense not found.");
  const ledgerEntries = await prisma.ledgerEntry.findMany({ where: { businessId, referenceType: "EXPENSE", referenceId: id }, include: { createdBy: { select: { id: true, name: true } } }, orderBy: { transactionDate: "asc" } });
  return { ...expense, ledgerEntries };
};

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createExpenseSchema.parse(input); await category(businessId, data.categoryId);
  return prisma.$transaction(async tx => {
    const duplicate = await tx.expense.findFirst({ where: { businessId, idempotencyKey: data.idempotencyKey }, include }); if (duplicate) return duplicate;
    const expenseNumber = await nextDocumentNumber(tx, businessId, "EXPENSE", "EXP"), calculated = totals(data.amount, data.gstApplicable, data.gstRate);
    const expense = await tx.expense.create({ data: { expenseNumber, expenseDate: data.expenseDate, categoryId: data.categoryId, payee: data.payee, amount: data.amount, gstApplicable: data.gstApplicable, ...calculated, paymentMode: data.paymentStatus === "PAID" ? data.paymentMode : data.paymentMode || null, paymentStatus: data.paymentStatus, paidAt: data.paymentStatus === "PAID" ? new Date() : null, notes: data.notes, attachmentUrl: data.attachmentUrl, idempotencyKey: data.idempotencyKey, businessId, createdById: userId }, include });
    if (expense.paymentStatus === "PAID") await postLedgerEntry(tx, { businessId, partyType: "BUSINESS", partyId: businessId, transactionType: "EXPENSE_PAYMENT", referenceType: "EXPENSE", referenceId: expense.id, amount: expense.totalAmount, debitAmount: expense.totalAmount, creditAmount: 0, description: `Expense ${expense.expenseNumber} paid`, transactionDate: expense.expenseDate, createdById: userId, idempotencyKey: `EXPENSE_PAYMENT:${expense.id}` });
    return expense;
  });
};

export const update = async (businessId: string, id: string, input: unknown) => {
  const data = updateExpenseSchema.parse(input), current = await prisma.expense.findFirst({ where: { id, businessId } }); if (!current) throw new ApiError(404, "Expense not found."); if (current.paymentStatus === "CANCELLED") throw new ApiError(409, "A cancelled expense cannot be edited.");
  if (current.paymentStatus === "PAID") { const financial = ["expenseDate", "categoryId", "amount", "gstApplicable", "gstRate", "paymentMode"].some(key => Object.prototype.hasOwnProperty.call(data, key)); if (financial) throw new ApiError(409, "Financial details of a paid expense cannot be edited. Cancel it and record a new expense if correction is required."); return prisma.expense.update({ where: { id }, data: { payee: data.payee, notes: data.notes, attachmentUrl: data.attachmentUrl }, include }); }
  const categoryId = data.categoryId || current.categoryId; await category(businessId, categoryId); const amount = data.amount ?? Number(current.amount), gstApplicable = data.gstApplicable ?? current.gstApplicable, gstRate = gstApplicable ? (data.gstRate ?? Number(current.gstRate)) : 0, calculated = totals(amount, gstApplicable, gstRate);
  if (gstApplicable && ![5, 12, 18, 28].includes(gstRate)) throw new ApiError(400, "Choose a valid GST rate.");
  return prisma.expense.update({ where: { id }, data: { ...data, categoryId, amount, gstApplicable, ...calculated }, include });
};

export const markPaid = async (businessId: string, userId: string, id: string, input: unknown) => {
  const data = markExpensePaidSchema.parse(input); return prisma.$transaction(async tx => { const expense = await tx.expense.findFirst({ where: { id, businessId } }); if (!expense) throw new ApiError(404, "Expense not found."); if (expense.paymentStatus !== "PENDING") throw new ApiError(409, expense.paymentStatus === "PAID" ? "Expense is already paid." : "A cancelled expense cannot be paid.");
    const claimed = await tx.expense.updateMany({ where: { id, businessId, paymentStatus: "PENDING" }, data: { paymentStatus: "PAID", paymentMode: data.paymentMode, paidAt: new Date() } }); if (claimed.count !== 1) throw new ApiError(409, "Expense is no longer pending.");
    await postLedgerEntry(tx, { businessId, partyType: "BUSINESS", partyId: businessId, transactionType: "EXPENSE_PAYMENT", referenceType: "EXPENSE", referenceId: id, amount: expense.totalAmount, debitAmount: expense.totalAmount, creditAmount: 0, description: `Expense ${expense.expenseNumber} paid`, createdById: userId, idempotencyKey: `EXPENSE_PAYMENT:${id}` }); return tx.expense.findUniqueOrThrow({ where: { id }, include }); });
};

export const cancel = async (businessId: string, userId: string, id: string, input: unknown) => {
  const data = cancelExpenseSchema.parse(input); return prisma.$transaction(async tx => { const expense = await tx.expense.findFirst({ where: { id, businessId } }); if (!expense) throw new ApiError(404, "Expense not found."); if (expense.paymentStatus === "CANCELLED") throw new ApiError(409, "Expense is already cancelled.");
    const claimed = await tx.expense.updateMany({ where: { id, businessId, paymentStatus: { not: "CANCELLED" } }, data: { paymentStatus: "CANCELLED", cancelledAt: new Date(), cancelledById: userId, cancellationReason: data.reason } }); if (claimed.count !== 1) throw new ApiError(409, "Expense is already cancelled.");
    if (expense.paymentStatus === "PAID") await postLedgerEntry(tx, { businessId, partyType: "BUSINESS", partyId: businessId, transactionType: "EXPENSE_PAYMENT_REVERSAL", referenceType: "EXPENSE", referenceId: id, amount: expense.totalAmount, debitAmount: 0, creditAmount: expense.totalAmount, description: `Expense ${expense.expenseNumber} cancelled: ${data.reason}`, createdById: userId, idempotencyKey: `EXPENSE_PAYMENT_REVERSAL:${id}` }); return tx.expense.findUniqueOrThrow({ where: { id }, include }); });
};
