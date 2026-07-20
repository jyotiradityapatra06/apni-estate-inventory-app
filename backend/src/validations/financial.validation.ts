import { z } from "zod";
export const financialQuerySchema = z.object({
  partyType: z.enum(["CUSTOMER", "SUPPLIER", "BUSINESS"]).optional(), partyId: z.string().optional(),
  paymentMode: z.string().optional(), transactionType: z.string().optional(),
  from: z.coerce.date().optional(), to: z.coerce.date().optional(),
});
