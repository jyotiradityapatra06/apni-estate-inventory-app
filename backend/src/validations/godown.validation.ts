import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();
export const createGodownSchema = z.object({
  name: z.string().trim().min(2, "Godown name is required"),
  godownCode: z.string().trim().min(2, "Godown code must be at least 2 characters").toUpperCase().optional().nullable(),
  address: optionalText,
  city: optionalText,
  state: optionalText,
  pincode: optionalText,
  contactPerson: optionalText,
  phone: optionalText,
  notes: optionalText,
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export const updateGodownSchema = createGodownSchema.partial();

export const createTransferSchema = z.object({
  sourceGodownId: z.string().min(1),
  destinationGodownId: z.string().min(1),
  transferDate: z.string().datetime().optional(),
  notes: optionalText,
  items: z.array(z.object({
    inventoryItemId: z.string().min(1),
    quantity: z.number().gt(0, "Transfer quantity must be greater than zero"),
  })).min(1, "Add at least one material"),
}).refine((data) => data.sourceGodownId !== data.destinationGodownId, {
  message: "Source and destination godowns must be different",
  path: ["destinationGodownId"],
});
