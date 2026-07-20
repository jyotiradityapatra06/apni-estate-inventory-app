ALTER TABLE "PurchasePayment" ADD COLUMN "idempotencyKey" TEXT;
CREATE TABLE "PurchaseReceipt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "receiptNumber" TEXT NOT NULL,
  "receiptDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "totalAmount" DECIMAL NOT NULL DEFAULT 0,
  "idempotencyKey" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "recordedById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchaseReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchaseReceipt_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PurchaseReceipt_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "PurchaseReceiptItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "purchaseReceiptId" TEXT NOT NULL,
  "purchaseOrderItemId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "quantity" DECIMAL NOT NULL,
  "amount" DECIMAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseReceiptItem_purchaseReceiptId_fkey" FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PurchaseReceiptItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchaseReceiptItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PurchasePayment_businessId_idempotencyKey_key" ON "PurchasePayment"("businessId", "idempotencyKey");
CREATE UNIQUE INDEX "PurchaseReceipt_businessId_receiptNumber_key" ON "PurchaseReceipt"("businessId", "receiptNumber");
CREATE UNIQUE INDEX "PurchaseReceipt_businessId_idempotencyKey_key" ON "PurchaseReceipt"("businessId", "idempotencyKey");
CREATE INDEX "PurchaseReceipt_businessId_receiptDate_idx" ON "PurchaseReceipt"("businessId", "receiptDate");
CREATE INDEX "PurchaseReceipt_purchaseOrderId_idx" ON "PurchaseReceipt"("purchaseOrderId");
CREATE INDEX "PurchaseReceipt_supplierId_idx" ON "PurchaseReceipt"("supplierId");
CREATE INDEX "PurchaseReceiptItem_purchaseReceiptId_idx" ON "PurchaseReceiptItem"("purchaseReceiptId");
CREATE INDEX "PurchaseReceiptItem_purchaseOrderItemId_idx" ON "PurchaseReceiptItem"("purchaseOrderItemId");
CREATE INDEX "PurchaseReceiptItem_inventoryItemId_idx" ON "PurchaseReceiptItem"("inventoryItemId");
