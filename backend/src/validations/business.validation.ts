import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional()
  );

const optionalPattern = (pattern: RegExp, message: string) =>
  z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().regex(pattern, message).nullable().optional()
  );

const fields = {
  name: z.string().trim().min(2, "Business name is required.").max(150),
  logoUrl: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().url("Logo URL must be a valid URL.").max(500).nullable().optional()
  ),
  phone: optionalText(30),
  email: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().email("Enter a valid business email.").max(200).nullable().optional()
  ),
  website: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().url("Website must be a valid URL.").max(500).nullable().optional()
  ),
  address: optionalText(1000),
  gstNumber: optionalPattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i, "Enter a valid 15-character GSTIN."),
  state: optionalText(100),
  stateCode: optionalPattern(/^[0-9]{2}$/, "State code must be a valid two-digit code."),
  registrationType: optionalText(50),
  bankName: optionalText(150),
  accountNumber: optionalPattern(/^[A-Za-z0-9-]{5,34}$/, "Enter a valid bank account number."),
  ifscCode: optionalPattern(/^[A-Z]{4}0[A-Z0-9]{6}$/i, "Enter a valid IFSC code."),
  branch: optionalText(150),
  upiId: optionalPattern(/^[A-Za-z0-9._-]{2,256}@[A-Za-z]{2,64}$/, "Enter a valid UPI ID."),
  invoiceTerms: optionalText(5000),
  invoiceFooter: optionalText(1000),
  workerSeatLimit: z.coerce.number().int().min(1).max(500).optional(),
};

export const businessProfileSchema = z.object(fields);
export const businessUpdateSchema = z.object(fields).partial();

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;
