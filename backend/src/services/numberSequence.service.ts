import { Prisma } from "@prisma/client";

export const nextDocumentNumber = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  sequenceType: string,
  prefix: string,
  width = 4
) => {
  const sequence = await tx.numberSequence.upsert({
    where: { businessId_sequenceType: { businessId, sequenceType } },
    update: { nextNumber: { increment: 1 } },
    create: { businessId, sequenceType, prefix, nextNumber: 2 },
  });

  const value = sequence.nextNumber - 1;
  return `${sequence.prefix}-${String(value).padStart(width, "0")}`;
};
