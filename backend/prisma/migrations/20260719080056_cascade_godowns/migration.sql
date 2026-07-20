-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliveryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryId" TEXT NOT NULL,
    "salesOrderItemId" TEXT,
    "invoiceItemId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "godownId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "plannedQuantity" DECIMAL NOT NULL,
    "dispatchedQuantity" DECIMAL NOT NULL DEFAULT 0,
    "deliveredQuantity" DECIMAL NOT NULL DEFAULT 0,
    "receivedQuantity" DECIMAL NOT NULL DEFAULT 0,
    "rejectedQuantity" DECIMAL NOT NULL DEFAULT 0,
    "reversedQuantity" DECIMAL NOT NULL DEFAULT 0,
    "completionNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "InvoiceItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryItem" ("completionNotes", "createdAt", "deliveredQuantity", "deliveryId", "dispatchedQuantity", "godownId", "id", "inventoryItemId", "invoiceItemId", "materialName", "plannedQuantity", "receivedQuantity", "rejectedQuantity", "reversedQuantity", "salesOrderItemId", "sku", "unit", "updatedAt") SELECT "completionNotes", "createdAt", "deliveredQuantity", "deliveryId", "dispatchedQuantity", "godownId", "id", "inventoryItemId", "invoiceItemId", "materialName", "plannedQuantity", "receivedQuantity", "rejectedQuantity", "reversedQuantity", "salesOrderItemId", "sku", "unit", "updatedAt" FROM "DeliveryItem";
DROP TABLE "DeliveryItem";
ALTER TABLE "new_DeliveryItem" RENAME TO "DeliveryItem";
CREATE INDEX "DeliveryItem_deliveryId_idx" ON "DeliveryItem"("deliveryId");
CREATE INDEX "DeliveryItem_inventoryItemId_idx" ON "DeliveryItem"("inventoryItemId");
CREATE INDEX "DeliveryItem_godownId_idx" ON "DeliveryItem"("godownId");
CREATE INDEX "DeliveryItem_salesOrderItemId_idx" ON "DeliveryItem"("salesOrderItemId");
CREATE INDEX "DeliveryItem_invoiceItemId_idx" ON "DeliveryItem"("invoiceItemId");
CREATE UNIQUE INDEX "DeliveryItem_deliveryId_salesOrderItemId_key" ON "DeliveryItem"("deliveryId", "salesOrderItemId");
CREATE TABLE "new_PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "godownId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "receivedQuantity" DECIMAL NOT NULL DEFAULT 0,
    "rate" DECIMAL NOT NULL,
    "grossAmount" DECIMAL NOT NULL,
    "discountRate" DECIMAL NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL NOT NULL,
    "gstRate" DECIMAL NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrderItem" ("createdAt", "discountAmount", "discountRate", "godownId", "grossAmount", "gstRate", "id", "inventoryItemId", "lineTotal", "materialName", "purchaseOrderId", "quantity", "rate", "receivedQuantity", "sku", "taxAmount", "taxableAmount", "unit", "updatedAt") SELECT "createdAt", "discountAmount", "discountRate", "godownId", "grossAmount", "gstRate", "id", "inventoryItemId", "lineTotal", "materialName", "purchaseOrderId", "quantity", "rate", "receivedQuantity", "sku", "taxAmount", "taxableAmount", "unit", "updatedAt" FROM "PurchaseOrderItem";
DROP TABLE "PurchaseOrderItem";
ALTER TABLE "new_PurchaseOrderItem" RENAME TO "PurchaseOrderItem";
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");
CREATE INDEX "PurchaseOrderItem_inventoryItemId_idx" ON "PurchaseOrderItem"("inventoryItemId");
CREATE INDEX "PurchaseOrderItem_godownId_idx" ON "PurchaseOrderItem"("godownId");
CREATE TABLE "new_SalesOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salesOrderId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "godownId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "hsnCode" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "reservedQuantity" DECIMAL NOT NULL DEFAULT 0,
    "invoicedQuantity" DECIMAL NOT NULL DEFAULT 0,
    "deliveredQuantity" DECIMAL NOT NULL DEFAULT 0,
    "rate" DECIMAL NOT NULL,
    "grossAmount" DECIMAL NOT NULL,
    "discountRate" DECIMAL NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL NOT NULL,
    "gstRate" DECIMAL NOT NULL DEFAULT 0,
    "cgstRate" DECIMAL NOT NULL DEFAULT 0,
    "sgstRate" DECIMAL NOT NULL DEFAULT 0,
    "igstRate" DECIMAL NOT NULL DEFAULT 0,
    "cgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "igstAmount" DECIMAL NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesOrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesOrderItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SalesOrderItem" ("cgstAmount", "cgstRate", "createdAt", "deliveredQuantity", "discountAmount", "discountRate", "godownId", "grossAmount", "gstRate", "hsnCode", "id", "igstAmount", "igstRate", "inventoryItemId", "invoicedQuantity", "lineTotal", "materialName", "quantity", "rate", "reservedQuantity", "salesOrderId", "sgstAmount", "sgstRate", "sku", "taxableAmount", "unit", "updatedAt") SELECT "cgstAmount", "cgstRate", "createdAt", "deliveredQuantity", "discountAmount", "discountRate", "godownId", "grossAmount", "gstRate", "hsnCode", "id", "igstAmount", "igstRate", "inventoryItemId", "invoicedQuantity", "lineTotal", "materialName", "quantity", "rate", "reservedQuantity", "salesOrderId", "sgstAmount", "sgstRate", "sku", "taxableAmount", "unit", "updatedAt" FROM "SalesOrderItem";
DROP TABLE "SalesOrderItem";
ALTER TABLE "new_SalesOrderItem" RENAME TO "SalesOrderItem";
CREATE INDEX "SalesOrderItem_salesOrderId_idx" ON "SalesOrderItem"("salesOrderId");
CREATE INDEX "SalesOrderItem_inventoryItemId_idx" ON "SalesOrderItem"("inventoryItemId");
CREATE INDEX "SalesOrderItem_godownId_idx" ON "SalesOrderItem"("godownId");
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
    CONSTRAINT "StockTransfer_sourceGodownId_fkey" FOREIGN KEY ("sourceGodownId") REFERENCES "Godown" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_destinationGodownId_fkey" FOREIGN KEY ("destinationGodownId") REFERENCES "Godown" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransfer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StockTransfer" ("businessId", "cancellationReason", "cancelledAt", "cancelledById", "completedAt", "completedById", "createdAt", "createdById", "destinationGodownId", "id", "idempotencyKey", "notes", "postedAt", "sourceGodownId", "status", "transferDate", "transferNumber", "updatedAt") SELECT "businessId", "cancellationReason", "cancelledAt", "cancelledById", "completedAt", "completedById", "createdAt", "createdById", "destinationGodownId", "id", "idempotencyKey", "notes", "postedAt", "sourceGodownId", "status", "transferDate", "transferNumber", "updatedAt" FROM "StockTransfer";
DROP TABLE "StockTransfer";
ALTER TABLE "new_StockTransfer" RENAME TO "StockTransfer";
CREATE UNIQUE INDEX "StockTransfer_idempotencyKey_key" ON "StockTransfer"("idempotencyKey");
CREATE INDEX "StockTransfer_businessId_transferDate_idx" ON "StockTransfer"("businessId", "transferDate");
CREATE INDEX "StockTransfer_sourceGodownId_idx" ON "StockTransfer"("sourceGodownId");
CREATE INDEX "StockTransfer_destinationGodownId_idx" ON "StockTransfer"("destinationGodownId");
CREATE UNIQUE INDEX "StockTransfer_businessId_transferNumber_key" ON "StockTransfer"("businessId", "transferNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
