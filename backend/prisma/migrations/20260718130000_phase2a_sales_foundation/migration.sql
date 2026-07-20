PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "taxMode" TEXT NOT NULL DEFAULT 'GST',
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerGstin" TEXT,
    "billingAddress" TEXT,
    "deliveryAddress" TEXT,
    "placeOfSupplyCode" TEXT,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL NOT NULL DEFAULT 0,
    "taxableTotal" DECIMAL NOT NULL DEFAULT 0,
    "cgstTotal" DECIMAL NOT NULL DEFAULT 0,
    "sgstTotal" DECIMAL NOT NULL DEFAULT 0,
    "igstTotal" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "businessId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "confirmedAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SalesOrderItem" (
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
    CONSTRAINT "SalesOrderItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "invoiceType" TEXT NOT NULL DEFAULT 'GST',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "salesOrderId" TEXT,
    "customerId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessGstin" TEXT,
    "businessAddress" TEXT,
    "businessPhone" TEXT,
    "businessLogoUrl" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerGstin" TEXT,
    "billingAddress" TEXT,
    "deliveryAddress" TEXT,
    "sellerStateCode" TEXT,
    "placeOfSupplyCode" TEXT,
    "supplyType" TEXT,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL NOT NULL DEFAULT 0,
    "taxableTotal" DECIMAL NOT NULL DEFAULT 0,
    "cgstTotal" DECIMAL NOT NULL DEFAULT 0,
    "sgstTotal" DECIMAL NOT NULL DEFAULT 0,
    "igstTotal" DECIMAL NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL NOT NULL DEFAULT 0,
    "roundOff" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "businessId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "issuedAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "salesOrderItemId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "hsnCode" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
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
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CustomerPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentNumber" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DECIMAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "bankName" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "reversedAt" DATETIME,
    "businessId" TEXT NOT NULL,
    "receivedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CustomerPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomerPayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerPayment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Preserve all legacy deliveries while adding optional Phase 2A relations.
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
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "salesOrderId" TEXT,
    "invoiceId" TEXT,
    "godownId" TEXT,
    "stockPostedAt" DATETIME,
    "stockReversedAt" DATETIME,
    "dispatchedAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Delivery_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Delivery" (
    "id", "deliveryNumber", "customerName", "customerPhone", "deliveryAddress",
    "materialName", "quantity", "unit", "scheduledDate", "notes", "status",
    "paymentStatus", "businessId", "createdAt", "updatedAt"
)
SELECT
    "id", "deliveryNumber", "customerName", "customerPhone", "deliveryAddress",
    "materialName", "quantity", "unit", "scheduledDate", "notes", "status",
    "paymentStatus", "businessId", "createdAt", "updatedAt"
FROM "Delivery";

DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";

CREATE TABLE "DeliveryItem" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "InvoiceItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SalesOrder_businessId_orderNumber_key" ON "SalesOrder"("businessId", "orderNumber");
CREATE INDEX "SalesOrder_businessId_orderDate_idx" ON "SalesOrder"("businessId", "orderDate");
CREATE INDEX "SalesOrder_businessId_status_idx" ON "SalesOrder"("businessId", "status");
CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");
CREATE INDEX "SalesOrderItem_salesOrderId_idx" ON "SalesOrderItem"("salesOrderId");
CREATE INDEX "SalesOrderItem_inventoryItemId_idx" ON "SalesOrderItem"("inventoryItemId");
CREATE INDEX "SalesOrderItem_godownId_idx" ON "SalesOrderItem"("godownId");

CREATE UNIQUE INDEX "Invoice_businessId_invoiceNumber_key" ON "Invoice"("businessId", "invoiceNumber");
CREATE INDEX "Invoice_businessId_invoiceDate_idx" ON "Invoice"("businessId", "invoiceDate");
CREATE INDEX "Invoice_businessId_status_idx" ON "Invoice"("businessId", "status");
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX "Invoice_salesOrderId_idx" ON "Invoice"("salesOrderId");
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX "InvoiceItem_salesOrderItemId_idx" ON "InvoiceItem"("salesOrderItemId");
CREATE INDEX "InvoiceItem_inventoryItemId_idx" ON "InvoiceItem"("inventoryItemId");

CREATE UNIQUE INDEX "CustomerPayment_businessId_paymentNumber_key" ON "CustomerPayment"("businessId", "paymentNumber");
CREATE INDEX "CustomerPayment_businessId_paymentDate_idx" ON "CustomerPayment"("businessId", "paymentDate");
CREATE INDEX "CustomerPayment_customerId_idx" ON "CustomerPayment"("customerId");
CREATE INDEX "CustomerPayment_invoiceId_idx" ON "CustomerPayment"("invoiceId");

CREATE INDEX "Delivery_businessId_idx" ON "Delivery"("businessId");
CREATE INDEX "Delivery_customerId_idx" ON "Delivery"("customerId");
CREATE INDEX "Delivery_salesOrderId_idx" ON "Delivery"("salesOrderId");
CREATE INDEX "Delivery_invoiceId_idx" ON "Delivery"("invoiceId");
CREATE INDEX "Delivery_godownId_idx" ON "Delivery"("godownId");
CREATE INDEX "DeliveryItem_deliveryId_idx" ON "DeliveryItem"("deliveryId");
CREATE INDEX "DeliveryItem_inventoryItemId_idx" ON "DeliveryItem"("inventoryItemId");
CREATE INDEX "DeliveryItem_godownId_idx" ON "DeliveryItem"("godownId");
CREATE INDEX "DeliveryItem_salesOrderItemId_idx" ON "DeliveryItem"("salesOrderItemId");
CREATE INDEX "DeliveryItem_invoiceItemId_idx" ON "DeliveryItem"("invoiceItemId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
