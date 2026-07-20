import { z } from "zod";

export const decimalValue = z.union([
  z.number().finite(),
  z.string().trim().regex(/^-?\d+(\.\d+)?$/, "Enter a valid number"),
]);
const optionalText = z.string().trim().optional().nullable();

export const createSalesOrderSchema = z.object({
  customerId: z.string().min(1),
  orderDate: z.string().datetime().optional(),
  expectedDeliveryDate: z.string().datetime().optional().nullable(),
  taxMode: z.enum(["GST", "NON_GST"]).default("GST"),
  billingAddress: optionalText,
  deliveryAddress: optionalText,
  placeOfSupplyCode: z.string().trim().regex(/^\d{2}$/, "State code must contain two digits").optional().nullable(),
  notes: optionalText,
  terms: optionalText,
  items: z.array(z.object({
    inventoryItemId: z.string().min(1),
    godownId: z.string().min(1),
    quantity: decimalValue,
    rate: decimalValue.optional(),
    discountRate: decimalValue.optional(),
    gstRate: decimalValue.optional(),
  })).min(1, "Add at least one material"),
  roundToRupee: z.boolean().optional(),
});

export const listSalesOrderQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
});
