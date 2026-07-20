-- Phase 3.9: append-only financial ledger and customer payment idempotency.
ALTER TABLE "CustomerPayment" ADD COLUMN "idempotencyKey" TEXT;

CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "partyType" TEXT NOT NULL,
  "partyId" TEXT NOT NULL,
  "transactionType" TEXT NOT NULL,
  "referenceType" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "debitAmount" DECIMAL NOT NULL DEFAULT 0,
  "creditAmount" DECIMAL NOT NULL DEFAULT 0,
  "description" TEXT NOT NULL,
  "transactionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerEntry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LedgerEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CustomerPayment_businessId_idempotencyKey_key" ON "CustomerPayment"("businessId", "idempotencyKey");
CREATE UNIQUE INDEX "LedgerEntry_businessId_idempotencyKey_key" ON "LedgerEntry"("businessId", "idempotencyKey");
CREATE INDEX "LedgerEntry_businessId_transactionDate_idx" ON "LedgerEntry"("businessId", "transactionDate");
CREATE INDEX "LedgerEntry_businessId_partyType_partyId_transactionDate_idx" ON "LedgerEntry"("businessId", "partyType", "partyId", "transactionDate");
CREATE INDEX "LedgerEntry_businessId_referenceId_idx" ON "LedgerEntry"("businessId", "referenceId");
