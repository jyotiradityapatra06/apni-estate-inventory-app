import { z } from "zod";

export const PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"] as const;
const optionalText = z.string().trim().max(1000).optional().nullable();
const financialFields = {
  expenseDate: z.coerce.date(),
  categoryId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  gstApplicable: z.boolean().default(false),
  gstRate: z.coerce.number().min(0).max(28).optional().default(0),
  paymentMode: z.enum(PAYMENT_MODES).optional().nullable(),
};

export const createExpenseSchema = z.object({
  ...financialFields,
  paymentStatus: z.enum(["PENDING", "PAID"]),
  payee: z.string().trim().max(200).optional().nullable(),
  notes: optionalText,
  attachmentUrl: z.string().trim().url().max(1000).optional().nullable(),
  idempotencyKey: z.string().uuid(),
}).superRefine((data, ctx) => {
  if (data.gstApplicable && ![5, 12, 18, 28].includes(data.gstRate)) ctx.addIssue({ code: "custom", path: ["gstRate"], message: "Choose a valid GST rate: 5%, 12%, 18%, or 28%." });
  if (data.paymentStatus === "PAID" && !data.paymentMode) ctx.addIssue({ code: "custom", path: ["paymentMode"], message: "Payment method is required for a paid expense." });
});

export const updateExpenseSchema = z.object({
  expenseDate: financialFields.expenseDate.optional(), categoryId: financialFields.categoryId.optional(), amount: financialFields.amount.optional(),
  gstApplicable: z.boolean().optional(), gstRate: financialFields.gstRate.optional(), paymentMode: financialFields.paymentMode,
  payee: z.string().trim().max(200).optional().nullable(), notes: optionalText, attachmentUrl: z.string().trim().url().max(1000).optional().nullable(),
}).superRefine((data, ctx) => { if (data.gstApplicable && data.gstRate !== undefined && ![5, 12, 18, 28].includes(data.gstRate)) ctx.addIssue({ code: "custom", path: ["gstRate"], message: "Choose a valid GST rate." }); });

export const expenseQuerySchema = z.object({
  search: z.string().trim().optional(), from: z.coerce.date().optional(), to: z.coerce.date().optional(), categoryId: z.string().uuid().optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "CANCELLED"]).optional(), paymentMode: z.enum(PAYMENT_MODES).optional(),
  gstApplicable: z.enum(["true", "false"]).transform(v => v === "true").optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const markExpensePaidSchema = z.object({ paymentMode: z.enum(PAYMENT_MODES) });
export const cancelExpenseSchema = z.object({ reason: z.string().trim().min(1, "Cancellation reason is required.").max(500) });

export const createExpenseCategorySchema = z.object({ name: z.string().trim().min(1).max(100), description: optionalText });
export const updateExpenseCategorySchema = z.object({ name: z.string().trim().min(1).max(100).optional(), description: optionalText, isActive: z.boolean().optional() });
