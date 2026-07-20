import { z } from "zod";
import { decimalValue } from "./salesOrder.validation";

export const createInvoiceSchema = z.object({
  salesOrderId: z.string().min(1),
  invoiceType: z.enum(["GST", "NON_GST"]).optional(),
  invoiceDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  sellerStateCode: z.string().trim().regex(/^\d{2}$/).optional().nullable(),
  placeOfSupplyCode: z.string().trim().regex(/^\d{2}$/).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  terms: z.string().trim().optional().nullable(),
  roundToRupee: z.boolean().optional(),
  items: z.array(z.object({
    salesOrderItemId: z.string().min(1),
    quantity: decimalValue,
    rate: decimalValue.optional(),
    discountRate: decimalValue.optional(),
  })).optional(),
});

export const listInvoiceQuerySchema = z.object({
  status: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  salesOrderId: z.string().trim().optional(),
});

export const calculateInvoiceSchema = z.object({
  invoiceType: z.enum(["GST", "NON_GST"]),
  sellerStateCode: z.string().trim().regex(/^\d{2}$/).optional().nullable(),
  placeOfSupplyCode: z.string().trim().regex(/^\d{2}$/).optional().nullable(),
  roundToRupee: z.boolean().optional(),
  items: z.array(z.object({
    key: z.string().min(1),
    quantity: decimalValue,
    rate: decimalValue,
    discountRate: decimalValue.optional(),
    gstRate: decimalValue.optional(),
  })).min(1),
});
