import { Prisma } from "@prisma/client";

type LedgerInput = {
  businessId: string; partyType: "CUSTOMER" | "SUPPLIER" | "BUSINESS"; partyId: string;
  transactionType: string; referenceType: string; referenceId: string;
  amount: Prisma.Decimal | number; debitAmount?: Prisma.Decimal | number; creditAmount?: Prisma.Decimal | number;
  description: string; transactionDate?: Date; createdById: string; idempotencyKey: string;
};

export const postLedgerEntry = async (tx: Prisma.TransactionClient, data: LedgerInput) => {
  const existing = await tx.ledgerEntry.findFirst({ where: { businessId: data.businessId, idempotencyKey: data.idempotencyKey } });
  if (existing) return existing;
  return tx.ledgerEntry.create({ data: { ...data, debitAmount: data.debitAmount ?? 0, creditAmount: data.creditAmount ?? 0 } });
};
