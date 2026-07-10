import { z } from "zod";

export const createInventorySchema = z.object({
  materialName: z.string().trim().min(1, "Material name is required"),
  category: z.string().trim().min(1, "Category is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  quantity: z.number().nonnegative("Quantity cannot be negative").default(0),
  reorderLevel: z.number().nonnegative("Reorder level cannot be negative").default(0),
  location: z.string().trim().min(1, "Location is required"),
  costPrice: z.number().positive("Cost price must be positive").optional().nullable(),
  sellingPrice: z.number().positive("Selling price must be positive").optional().nullable(),
});

export const updateInventorySchema = createInventorySchema.partial();

export const stockAdjustmentSchema = z.object({
  type: z.enum(["IN", "OUT"], {
    errorMap: () => ({ message: "Type must be either IN or OUT" }),
  }),
  quantity: z.number().gt(0, "Adjustment quantity must be greater than zero"),
  note: z.string().trim().optional(),
});
