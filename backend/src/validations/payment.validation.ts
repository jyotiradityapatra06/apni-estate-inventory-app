import { z } from "zod";
import { decimalValue } from "./salesOrder.validation";

export const createPaymentSchema = z.object({
  customerId: z.string().min(1),
  invoiceId: z.string().min(1),
  amount: decimalValue,
  paymentDate: z.string().datetime().optional(),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"]),
  referenceNumber: z.string().trim().optional().nullable(),
  bankName: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  idempotencyKey: z.string().uuid(),
});

export const listPaymentQuerySchema = z.object({
  customerId: z.string().trim().optional(),
  invoiceId: z.string().trim().optional(),
  status: z.string().trim().optional(),
});
