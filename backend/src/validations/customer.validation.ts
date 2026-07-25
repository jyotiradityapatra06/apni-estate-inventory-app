import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();
export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required"),
  phone: z.string().trim().min(10, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").optional().nullable(),
  gstin: optionalText,
  billingAddress: optionalText,
  shippingAddress: optionalText,
  state: optionalText,
  stateCode: z.string().trim().regex(/^[0-9]{2}$/, "State code must be 2 digits").optional().nullable(),
  creditLimit: z.number().nonnegative().default(0),
  creditDays: z.number().int().nonnegative().default(0),
  allowCredit: z.boolean().default(true),
  openingBalance: z.number().nonnegative().default(0),
  notes: optionalText,
  isActive: z.boolean().optional(),
});
export const updateCustomerSchema = createCustomerSchema.partial();
