import { z } from "zod";

export const createSalesReturnSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  reason: z.string().trim().min(1, "Return reason is required"),
  notes: z.string().trim().optional().nullable(),
  idempotencyKey: z.string().uuid("Invalid idempotency key format"),
  items: z
    .array(
      z.object({
        invoiceItemId: z.string().min(1, "Invoice Item ID is required"),
        quantity: z.coerce.number().positive("Quantity must be greater than zero"),
        godownId: z.string().min(1, "Destination godown is required"),
      })
    )
    .min(1, "Return must include at least one item"),
});

export const createPurchaseReturnSchema = z.object({
  purchaseOrderId: z.string().min(1, "Purchase Order ID is required"),
  reason: z.string().trim().min(1, "Return reason is required"),
  notes: z.string().trim().optional().nullable(),
  idempotencyKey: z.string().uuid("Invalid idempotency key format"),
  items: z
    .array(
      z.object({
        purchaseOrderItemId: z.string().min(1, "Purchase Order Item ID is required"),
        quantity: z.coerce.number().positive("Quantity must be greater than zero"),
        godownId: z.string().min(1, "Source godown is required"),
      })
    )
    .min(1, "Return must include at least one item"),
});
