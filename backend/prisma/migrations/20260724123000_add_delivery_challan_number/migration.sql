-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN "challanNumber" TEXT;

-- CreateIndex
CREATE INDEX "Delivery_businessId_challanNumber_idx" ON "Delivery"("businessId", "challanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_businessId_challanNumber_key" ON "Delivery"("businessId", "challanNumber");
