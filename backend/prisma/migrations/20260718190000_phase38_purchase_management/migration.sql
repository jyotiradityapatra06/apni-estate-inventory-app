ALTER TABLE "Supplier" ADD COLUMN "companyName" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "panNumber" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "creditLimit" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "Supplier" ADD COLUMN "paymentTerms" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "totalPurchases" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "Supplier" ADD COLUMN "paidAmount" DECIMAL NOT NULL DEFAULT 0;

CREATE TABLE "PurchaseOrder" (
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
CREATE TABLE "PurchaseOrderItem" (
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
  CONSTRAINT "PurchaseOrderItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "PurchasePayment" (
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
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchasePayment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchasePayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchasePayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PurchasePayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PurchaseOrder_businessId_purchaseOrderNumber_key" ON "PurchaseOrder"("businessId", "purchaseOrderNumber");
CREATE INDEX "PurchaseOrder_businessId_orderDate_idx" ON "PurchaseOrder"("businessId", "orderDate");
CREATE INDEX "PurchaseOrder_businessId_status_idx" ON "PurchaseOrder"("businessId", "status");
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");
CREATE INDEX "PurchaseOrderItem_inventoryItemId_idx" ON "PurchaseOrderItem"("inventoryItemId");
CREATE INDEX "PurchaseOrderItem_godownId_idx" ON "PurchaseOrderItem"("godownId");
CREATE UNIQUE INDEX "PurchasePayment_businessId_paymentNumber_key" ON "PurchasePayment"("businessId", "paymentNumber");
CREATE INDEX "PurchasePayment_businessId_paymentDate_idx" ON "PurchasePayment"("businessId", "paymentDate");
CREATE INDEX "PurchasePayment_purchaseOrderId_idx" ON "PurchasePayment"("purchaseOrderId");
CREATE INDEX "PurchasePayment_supplierId_idx" ON "PurchasePayment"("supplierId");
