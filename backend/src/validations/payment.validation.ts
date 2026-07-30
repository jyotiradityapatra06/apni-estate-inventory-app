import { z } from "zod";
import { decimalValue } from "./salesOrder.validation";

export const createPaymentSchema = z.object({
  customerId: z.string().min(1),
  invoiceId: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().min(1).optional().nullable(),
  ),
  amount: decimalValue,
  paymentDate: z.string().datetime().optional(),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"]),
  referenceNumber: z.string().trim().optional().nullable(),
  bankName: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  idempotencyKey: z.string().uuid(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod !== "CASH" && !data.referenceNumber?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["referenceNumber"],
      message: "Reference / UTR number is required for non-cash payments.",
    });
  }
  if (["BANK_TRANSFER", "CHEQUE"].includes(data.paymentMethod) && !data.bankName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bankName"],
      message: "Bank name is required for bank transfer and cheque payments.",
    });
  }
});

export const listPaymentQuerySchema = z.object({
  customerId: z.string().trim().optional(),
  invoiceId: z.string().trim().optional(),
  status: z.string().trim().optional(),
});
