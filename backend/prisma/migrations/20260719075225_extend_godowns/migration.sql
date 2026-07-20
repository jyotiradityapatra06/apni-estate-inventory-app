-- AlterTable
ALTER TABLE "GodownStock" ADD COLUMN "reorderLevel" REAL DEFAULT 0;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Godown" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "godownCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Godown_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Godown_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Godown_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Godown" ("address", "businessId", "contactPerson", "createdAt", "godownCode", "id", "isActive", "isDefault", "name", "phone", "updatedAt") SELECT "address", "businessId", "contactPerson", "createdAt", "godownCode", "id", "isActive", "isDefault", "name", "phone", "updatedAt" FROM "Godown";
DROP TABLE "Godown";
ALTER TABLE "new_Godown" RENAME TO "Godown";
CREATE INDEX "Godown_businessId_idx" ON "Godown"("businessId");
CREATE INDEX "Godown_businessId_name_idx" ON "Godown"("businessId", "name");
CREATE UNIQUE INDEX "Godown_businessId_godownCode_key" ON "Godown"("businessId", "godownCode");
CREATE TABLE "new_StockTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transferNumber" TEXT NOT NULL,
    "transferDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "postedAt" DATETIME,
    "sourceGodownId" TEXT NOT NULL,
    "destinationGodownId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "completedById" TEXT,
    "cancelledById" TEXT,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT,
    "idempotencyKey" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockTransfer_sourceGodownId_fkey" FOREIGN KEY ("sourceGodownId") REFERENCES "Godown" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_destinationGodownId_fkey" FOREIGN KEY ("destinationGodownId") REFERENCES "Godown" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StockTransfer" ("businessId", "createdAt", "createdById", "destinationGodownId", "id", "notes", "postedAt", "sourceGodownId", "status", "transferDate", "transferNumber", "updatedAt") SELECT "businessId", "createdAt", "createdById", "destinationGodownId", "id", "notes", "postedAt", "sourceGodownId", "status", "transferDate", "transferNumber", "updatedAt" FROM "StockTransfer";
DROP TABLE "StockTransfer";
ALTER TABLE "new_StockTransfer" RENAME TO "StockTransfer";
CREATE UNIQUE INDEX "StockTransfer_idempotencyKey_key" ON "StockTransfer"("idempotencyKey");
CREATE INDEX "StockTransfer_businessId_transferDate_idx" ON "StockTransfer"("businessId", "transferDate");
CREATE INDEX "StockTransfer_sourceGodownId_idx" ON "StockTransfer"("sourceGodownId");
CREATE INDEX "StockTransfer_destinationGodownId_idx" ON "StockTransfer"("destinationGodownId");
CREATE UNIQUE INDEX "StockTransfer_businessId_transferNumber_key" ON "StockTransfer"("businessId", "transferNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
