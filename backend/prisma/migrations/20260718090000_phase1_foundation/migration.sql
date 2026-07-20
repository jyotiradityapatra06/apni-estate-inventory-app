PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Repair schema drift for installations created only from migration history.
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_businessId_idx" ON "Notification"("businessId");

CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "gstin" TEXT,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "openingBalance" REAL NOT NULL DEFAULT 0,
    "outstandingBalance" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "email" TEXT,
    "gstin" TEXT,
    "address" TEXT,
    "openingPayable" REAL NOT NULL DEFAULT 0,
    "pendingPayments" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Supplier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Godown" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "godownCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Godown_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Rebuild materials so legacy fields remain available and new constraints are enforced.
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "sku" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "reorderLevel" REAL NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL,
    "openingStock" REAL NOT NULL DEFAULT 0,
    "minimumStockLevel" REAL NOT NULL DEFAULT 0,
    "costPrice" REAL,
    "sellingPrice" REAL,
    "hsnCode" TEXT,
    "taxRate" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultSupplierId" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_defaultSupplierId_fkey" FOREIGN KEY ("defaultSupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_InventoryItem" (
    "id", "materialName", "category", "sku", "unit", "quantity",
    "reorderLevel", "location", "openingStock", "minimumStockLevel",
    "costPrice", "sellingPrice", "businessId", "createdAt", "updatedAt"
)
SELECT
    "id", "materialName", "category", "sku", "unit", "quantity",
    "reorderLevel", "location", "quantity", "reorderLevel",
    "costPrice", "sellingPrice", "businessId", "createdAt", "updatedAt"
FROM "InventoryItem";

DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";

CREATE UNIQUE INDEX "InventoryItem_businessId_sku_key" ON "InventoryItem"("businessId", "sku");
CREATE INDEX "InventoryItem_businessId_idx" ON "InventoryItem"("businessId");
CREATE INDEX "InventoryItem_businessId_category_idx" ON "InventoryItem"("businessId", "category");
CREATE INDEX "InventoryItem_businessId_materialName_idx" ON "InventoryItem"("businessId", "materialName");
CREATE INDEX "InventoryItem_defaultSupplierId_idx" ON "InventoryItem"("defaultSupplierId");

-- Convert each existing text location into a real godown.
INSERT INTO "Godown" (
    "id", "godownCode", "name", "isDefault", "isActive", "businessId", "createdAt", "updatedAt"
)
SELECT
    lower(hex(randomblob(16))),
    'LEG-' || upper(substr(hex(randomblob(8)), 1, 8)),
    "location",
    false,
    true,
    "businessId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "InventoryItem"
GROUP BY "businessId", "location";

UPDATE "Godown"
SET "isDefault" = true
WHERE "id" IN (
    SELECT MIN("id") FROM "Godown" GROUP BY "businessId"
);

CREATE TABLE "GodownStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" REAL NOT NULL DEFAULT 0,
    "reservedQuantity" REAL NOT NULL DEFAULT 0,
    "godownId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GodownStock_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GodownStock_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GodownStock_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "GodownStock" (
    "id", "quantity", "reservedQuantity", "godownId", "inventoryItemId", "businessId", "createdAt", "updatedAt"
)
SELECT
    lower(hex(randomblob(16))),
    item."quantity",
    0,
    godown."id",
    item."id",
    item."businessId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "InventoryItem" item
JOIN "Godown" godown
  ON godown."businessId" = item."businessId"
 AND godown."name" = item."location";

CREATE UNIQUE INDEX "GodownStock_businessId_godownId_inventoryItemId_key" ON "GodownStock"("businessId", "godownId", "inventoryItemId");
CREATE INDEX "GodownStock_businessId_inventoryItemId_idx" ON "GodownStock"("businessId", "inventoryItemId");
CREATE INDEX "GodownStock_godownId_idx" ON "GodownStock"("godownId");

-- Rebuild stock history with explicit tenant and godown references.
CREATE TABLE "new_StockTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "note" TEXT,
    "reason" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "godownId" TEXT,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockTransaction_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_StockTransaction" (
    "id", "type", "quantity", "note", "referenceType", "inventoryItemId",
    "godownId", "userId", "businessId", "createdAt"
)
SELECT
    tx."id", tx."type", tx."quantity", tx."note", 'LEGACY', tx."inventoryItemId",
    godown."id", tx."userId", item."businessId", tx."createdAt"
FROM "StockTransaction" tx
JOIN "InventoryItem" item ON item."id" = tx."inventoryItemId"
LEFT JOIN "Godown" godown
  ON godown."businessId" = item."businessId"
 AND godown."name" = item."location";

DROP TABLE "StockTransaction";
ALTER TABLE "new_StockTransaction" RENAME TO "StockTransaction";

CREATE INDEX "StockTransaction_inventoryItemId_idx" ON "StockTransaction"("inventoryItemId");
CREATE INDEX "StockTransaction_godownId_idx" ON "StockTransaction"("godownId");
CREATE INDEX "StockTransaction_userId_idx" ON "StockTransaction"("userId");
CREATE INDEX "StockTransaction_businessId_createdAt_idx" ON "StockTransaction"("businessId", "createdAt");
CREATE INDEX "StockTransaction_referenceType_referenceId_idx" ON "StockTransaction"("referenceType", "referenceId");

CREATE TABLE "SupplierMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "supplierItemCode" TEXT,
    "lastPurchasePrice" REAL,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierMaterial_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierMaterial_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transferNumber" TEXT NOT NULL,
    "transferDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "postedAt" DATETIME,
    "sourceGodownId" TEXT NOT NULL,
    "destinationGodownId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockTransfer_sourceGodownId_fkey" FOREIGN KEY ("sourceGodownId") REFERENCES "Godown" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_destinationGodownId_fkey" FOREIGN KEY ("destinationGodownId") REFERENCES "Godown" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" REAL NOT NULL,
    "stockTransferId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockTransferItem_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "StockTransfer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockTransferItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sequenceType" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NumberSequence_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Customer_businessId_customerCode_key" ON "Customer"("businessId", "customerCode");
CREATE INDEX "Customer_businessId_idx" ON "Customer"("businessId");
CREATE INDEX "Customer_businessId_name_idx" ON "Customer"("businessId", "name");
CREATE INDEX "Customer_businessId_phone_idx" ON "Customer"("businessId", "phone");
CREATE INDEX "Customer_businessId_gstin_idx" ON "Customer"("businessId", "gstin");

CREATE UNIQUE INDEX "Supplier_businessId_supplierCode_key" ON "Supplier"("businessId", "supplierCode");
CREATE INDEX "Supplier_businessId_idx" ON "Supplier"("businessId");
CREATE INDEX "Supplier_businessId_name_idx" ON "Supplier"("businessId", "name");
CREATE INDEX "Supplier_businessId_phone_idx" ON "Supplier"("businessId", "phone");
CREATE INDEX "Supplier_businessId_gstin_idx" ON "Supplier"("businessId", "gstin");

CREATE UNIQUE INDEX "SupplierMaterial_supplierId_inventoryItemId_key" ON "SupplierMaterial"("supplierId", "inventoryItemId");
CREATE INDEX "SupplierMaterial_inventoryItemId_idx" ON "SupplierMaterial"("inventoryItemId");

CREATE UNIQUE INDEX "Godown_businessId_godownCode_key" ON "Godown"("businessId", "godownCode");
CREATE INDEX "Godown_businessId_idx" ON "Godown"("businessId");
CREATE INDEX "Godown_businessId_name_idx" ON "Godown"("businessId", "name");

CREATE UNIQUE INDEX "StockTransfer_businessId_transferNumber_key" ON "StockTransfer"("businessId", "transferNumber");
CREATE INDEX "StockTransfer_businessId_transferDate_idx" ON "StockTransfer"("businessId", "transferDate");
CREATE INDEX "StockTransfer_sourceGodownId_idx" ON "StockTransfer"("sourceGodownId");
CREATE INDEX "StockTransfer_destinationGodownId_idx" ON "StockTransfer"("destinationGodownId");
CREATE UNIQUE INDEX "StockTransferItem_stockTransferId_inventoryItemId_key" ON "StockTransferItem"("stockTransferId", "inventoryItemId");
CREATE INDEX "StockTransferItem_inventoryItemId_idx" ON "StockTransferItem"("inventoryItemId");
CREATE UNIQUE INDEX "NumberSequence_businessId_sequenceType_key" ON "NumberSequence"("businessId", "sequenceType");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
