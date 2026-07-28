import { z } from "zod";
import { decimalValue } from "./salesOrder.validation";

export const createInvoiceSchema = z.object({
  invoiceMode: z.enum(["DIRECT", "SALES_ORDER"]).default("SALES_ORDER"),
  salesOrderId: z.string().min(1).optional().nullable(),
  customerId: z.string().min(1).optional(),
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
    inventoryItemId: z.string().min(1).optional(),
    quantity: decimalValue,
    rate: decimalValue.optional(),
    discountRate: decimalValue.optional(),
  })).optional(),
  directItems: z.array(z.object({
    inventoryItemId: z.string().min(1),
    quantity: decimalValue,
    rate: decimalValue,
    discountRate: decimalValue.optional(),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.invoiceMode === "SALES_ORDER" && !data.salesOrderId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["salesOrderId"], message: "Sales Order is required." });
  }
  if (data.invoiceMode === "DIRECT") {
    if (!data.customerId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customerId"], message: "Customer is required." });
    if (!data.invoiceType) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["invoiceType"], message: "Invoice type is required." });
    if (!data.directItems?.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["directItems"], message: "Add at least one invoice item." });
    data.directItems?.forEach((line, index) => {
      if (Number(line.quantity) <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["directItems", index, "quantity"], message: "Quantity must be greater than zero." });
      if (Number(line.rate) < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["directItems", index, "rate"], message: "Rate cannot be negative." });
    });
  }
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
