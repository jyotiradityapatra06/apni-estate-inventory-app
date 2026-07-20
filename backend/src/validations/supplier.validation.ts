import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();
export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "Supplier name is required"),
  companyName: optionalText,
  contactPerson: optionalText,
  phone: z.string().trim().min(10, "Enter a valid phone number"),
  alternatePhone: optionalText,
  email: z.string().trim().email("Enter a valid email").optional().nullable(),
  gstin: z.string().trim().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid GSTIN").optional().nullable().or(z.literal("")),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN").optional().nullable().or(z.literal("")),
  address: optionalText,
  openingPayable: z.number().nonnegative().default(0),
  creditLimit: z.coerce.number().nonnegative().default(0),
  paymentTerms: optionalText,
  notes: optionalText,
  isActive: z.boolean().optional(),
  materialIds: z.array(z.string().min(1)).optional(),
});
export const updateSupplierSchema = createSupplierSchema.partial();
