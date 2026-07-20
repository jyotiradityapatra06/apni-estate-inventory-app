-- Phase 3.9.1: auditable supplier payment reversal.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_PurchasePayment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentNumber" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "paymentMode" TEXT NOT NULL,
  "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "purchaseOrderId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "recordedById" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'POSTED',
  "reversedAt" DATETIME,
  "reversedById" TEXT,
  "reversalReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idempotencyKey" TEXT,
  CONSTRAINT "PurchasePayment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchasePayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchasePayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PurchasePayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchasePayment_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_PurchasePayment" ("amount", "businessId", "createdAt", "id", "idempotencyKey", "notes", "paymentDate", "paymentMode", "paymentNumber", "purchaseOrderId", "recordedById", "supplierId")
SELECT "amount", "businessId", "createdAt", "id", "idempotencyKey", "notes", "paymentDate", "paymentMode", "paymentNumber", "purchaseOrderId", "recordedById", "supplierId" FROM "PurchasePayment";

DROP TABLE "PurchasePayment";
ALTER TABLE "new_PurchasePayment" RENAME TO "PurchasePayment";
CREATE UNIQUE INDEX "PurchasePayment_businessId_paymentNumber_key" ON "PurchasePayment"("businessId", "paymentNumber");
CREATE UNIQUE INDEX "PurchasePayment_businessId_idempotencyKey_key" ON "PurchasePayment"("businessId", "idempotencyKey");
CREATE INDEX "PurchasePayment_businessId_paymentDate_idx" ON "PurchasePayment"("businessId", "paymentDate");
CREATE INDEX "PurchasePayment_purchaseOrderId_idx" ON "PurchasePayment"("purchaseOrderId");
CREATE INDEX "PurchasePayment_supplierId_idx" ON "PurchasePayment"("supplierId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
