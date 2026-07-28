ALTER TABLE "PurchaseOrderItem" ADD COLUMN "damagedQuantity" DECIMAL NOT NULL DEFAULT 0;

ALTER TABLE "PurchaseReceiptItem" ADD COLUMN "orderedQuantity" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseReceiptItem" ADD COLUMN "receivedQuantity" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseReceiptItem" ADD COLUMN "shortageQuantity" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseReceiptItem" ADD COLUMN "damageQuantity" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseReceiptItem" ADD COLUMN "pendingQuantity" DECIMAL NOT NULL DEFAULT 0;

-- Historical receipt quantity represented accepted stock.
UPDATE "PurchaseReceiptItem"
SET "orderedQuantity" = (
      SELECT "quantity" FROM "PurchaseOrderItem"
      WHERE "PurchaseOrderItem"."id" = "PurchaseReceiptItem"."purchaseOrderItemId"
    ),
    "receivedQuantity" = "quantity",
    "pendingQuantity" = MAX(
      0,
      (
        SELECT "quantity" FROM "PurchaseOrderItem"
        WHERE "PurchaseOrderItem"."id" = "PurchaseReceiptItem"."purchaseOrderItemId"
      ) - "quantity"
    );
