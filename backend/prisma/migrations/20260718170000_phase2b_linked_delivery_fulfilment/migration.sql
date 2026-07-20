PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

ALTER TABLE "StockTransaction" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "StockTransaction_idempotencyKey_key" ON "StockTransaction"("idempotencyKey");

ALTER TABLE "DeliveryItem" ADD COLUMN "reversedQuantity" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "DeliveryItem" ADD COLUMN "completionNotes" TEXT;
CREATE UNIQUE INDEX "DeliveryItem_deliveryId_salesOrderItemId_key" ON "DeliveryItem"("deliveryId", "salesOrderItemId");

CREATE TABLE "new_Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "scheduledDate" DATETIME,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "fulfilmentMode" TEXT NOT NULL DEFAULT 'LEGACY',
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "salesOrderId" TEXT,
    "invoiceId" TEXT,
    "godownId" TEXT,
    "stockPostedAt" DATETIME,
    "stockReversedAt" DATETIME,
    "dispatchedAt" DATETIME,
    "deliveredAt" DATETIME,
    "readyAt" DATETIME,
    "confirmedAt" DATETIME,
    "cancelledAt" DATETIME,
    "vehicleNumber" TEXT,
    "vehicleType" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "receiverName" TEXT,
    "proofOfDeliveryReference" TEXT,
    "deliveryNotes" TEXT,
    "cancellationReason" TEXT,
    "reversalReason" TEXT,
    "createdById" TEXT,
    "dispatchedById" TEXT,
    "completedById" TEXT,
    "cancelledById" TEXT,
    "reversedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Delivery_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_dispatchedById_fkey" FOREIGN KEY ("dispatchedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Delivery" (
    "id", "deliveryNumber", "customerName", "customerPhone", "deliveryAddress",
    "materialName", "quantity", "unit", "scheduledDate", "notes", "status",
    "paymentStatus", "businessId", "customerId", "salesOrderId", "invoiceId", "godownId",
    "stockPostedAt", "stockReversedAt", "dispatchedAt", "deliveredAt", "createdAt", "updatedAt"
)
SELECT
    "id", "deliveryNumber", "customerName", "customerPhone", "deliveryAddress",
    "materialName", "quantity", "unit", "scheduledDate", "notes", "status",
    "paymentStatus", "businessId", "customerId", "salesOrderId", "invoiceId", "godownId",
    "stockPostedAt", "stockReversedAt", "dispatchedAt", "deliveredAt", "createdAt", "updatedAt"
FROM "Delivery";

DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";

CREATE INDEX "Delivery_businessId_idx" ON "Delivery"("businessId");
CREATE INDEX "Delivery_customerId_idx" ON "Delivery"("customerId");
CREATE INDEX "Delivery_salesOrderId_idx" ON "Delivery"("salesOrderId");
CREATE INDEX "Delivery_invoiceId_idx" ON "Delivery"("invoiceId");
CREATE INDEX "Delivery_godownId_idx" ON "Delivery"("godownId");
CREATE INDEX "Delivery_businessId_fulfilmentMode_idx" ON "Delivery"("businessId", "fulfilmentMode");
CREATE INDEX "Delivery_businessId_status_idx" ON "Delivery"("businessId", "status");
CREATE INDEX "Delivery_businessId_scheduledDate_idx" ON "Delivery"("businessId", "scheduledDate");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
