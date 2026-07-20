import { z } from "zod";

export const createInventorySchema = z.object({
  materialName: z.string().trim().min(1, "Material name is required"),
  category: z.string().trim().min(1, "Category is required"),
  brand: z.string().trim().optional().nullable(),
  sku: z.string().trim().min(1, "SKU is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  quantity: z.number().nonnegative("Quantity cannot be negative").default(0),
  reorderLevel: z.number().nonnegative("Reorder level cannot be negative").default(0),
  openingStock: z.number().nonnegative("Opening stock cannot be negative").optional(),
  minimumStockLevel: z.number().nonnegative("Minimum stock cannot be negative").optional(),
  location: z.string().trim().min(1, "Location is required"),
  costPrice: z.number().positive("Cost price must be positive").optional().nullable(),
  sellingPrice: z.number().positive("Selling price must be positive").optional().nullable(),
  hsnCode: z.string().trim().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  defaultSupplierId: z.string().min(1).optional().nullable(),
  supplierIds: z.array(z.string().min(1)).optional(),
  godownId: z.string().min(1).optional(),
});

export const updateInventorySchema = createInventorySchema.partial();

export const stockAdjustmentSchema = z.object({
  idempotencyKey: z.string().uuid("A valid idempotency key is required"),
  type: z.enum(["IN", "OUT"], {
    errorMap: () => ({ message: "Type must be either IN or OUT" }),
  }),
  quantity: z.number().gt(0, "Adjustment quantity must be greater than zero"),
  note: z.string().trim().optional(),
  godownId: z.string().min(1).optional(),
  reason: z.string().trim().optional(),
});
