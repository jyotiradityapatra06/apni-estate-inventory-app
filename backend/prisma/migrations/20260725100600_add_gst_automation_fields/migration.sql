-- AlterTable
ALTER TABLE "Business" ADD COLUMN "state" TEXT;
ALTER TABLE "Business" ADD COLUMN "stateCode" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "state" TEXT;
ALTER TABLE "Customer" ADD COLUMN "stateCode" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN "state" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "stateCode" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderNumber" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierPhone" TEXT NOT NULL,
    "supplierGstin" TEXT,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL NOT NULL DEFAULT 0,
    "taxableTotal" DECIMAL NOT NULL DEFAULT 0,
    "cgstTotal" DECIMAL NOT NULL DEFAULT 0,
    "sgstTotal" DECIMAL NOT NULL DEFAULT 0,
    "igstTotal" DECIMAL NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "receivedAmount" DECIMAL NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "sentAt" DATETIME,
    "cancelledAt" DATETIME,
    "businessId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrder" ("amountPaid", "balanceDue", "businessId", "cancelledAt", "createdAt", "createdById", "discountTotal", "expectedDeliveryDate", "id", "notes", "orderDate", "paymentStatus", "purchaseOrderNumber", "receivedAmount", "sentAt", "status", "subtotal", "supplierGstin", "supplierId", "supplierName", "supplierPhone", "taxTotal", "taxableTotal", "totalAmount", "updatedAt") SELECT "amountPaid", "balanceDue", "businessId", "cancelledAt", "createdAt", "createdById", "discountTotal", "expectedDeliveryDate", "id", "notes", "orderDate", "paymentStatus", "purchaseOrderNumber", "receivedAmount", "sentAt", "status", "subtotal", "supplierGstin", "supplierId", "supplierName", "supplierPhone", "taxTotal", "taxableTotal", "totalAmount", "updatedAt" FROM "PurchaseOrder";
DROP TABLE "PurchaseOrder";
ALTER TABLE "new_PurchaseOrder" RENAME TO "PurchaseOrder";
CREATE INDEX "PurchaseOrder_businessId_orderDate_idx" ON "PurchaseOrder"("businessId", "orderDate");
CREATE INDEX "PurchaseOrder_businessId_status_idx" ON "PurchaseOrder"("businessId", "status");
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");
CREATE UNIQUE INDEX "PurchaseOrder_businessId_purchaseOrderNumber_key" ON "PurchaseOrder"("businessId", "purchaseOrderNumber");
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
    "cgstRate" DECIMAL NOT NULL DEFAULT 0,
    "sgstRate" DECIMAL NOT NULL DEFAULT 0,
    "igstRate" DECIMAL NOT NULL DEFAULT 0,
    "cgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "igstAmount" DECIMAL NOT NULL DEFAULT 0,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
