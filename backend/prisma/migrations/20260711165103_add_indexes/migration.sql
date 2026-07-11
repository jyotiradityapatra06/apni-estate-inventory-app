-- CreateIndex
CREATE INDEX "InventoryItem_businessId_idx" ON "InventoryItem"("businessId");

-- CreateIndex
CREATE INDEX "StockTransaction_inventoryItemId_idx" ON "StockTransaction"("inventoryItemId");

-- CreateIndex
CREATE INDEX "StockTransaction_userId_idx" ON "StockTransaction"("userId");

-- CreateIndex
CREATE INDEX "User_businessId_idx" ON "User"("businessId");
