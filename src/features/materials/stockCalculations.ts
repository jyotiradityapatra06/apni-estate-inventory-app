import type { InventoryItemData } from "../../api/inventory.api";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "FULLY_RESERVED";
type StockLike = { quantity: number; minimumStockLevel?: number; reorderLevel?: number; godownStocks?: Array<{ quantity: number; reservedQuantity?: number }> };
export const physicalStock = (item: StockLike) => Number(item.quantity || 0);
export const reservedStock = (item: StockLike) => (item.godownStocks ?? []).reduce((sum, row) => sum + Number(row.reservedQuantity || 0), 0);
export const availableStock = (item: StockLike) => Math.max(0, physicalStock(item) - reservedStock(item));
export const minimumStock = (item: StockLike) => Number(item.minimumStockLevel ?? item.reorderLevel ?? 0);
export const stockStatus = (item: StockLike): StockStatus => {
  const physical = physicalStock(item); const available = availableStock(item);
  if (physical > 0 && available <= 0 && reservedStock(item) > 0) return "FULLY_RESERVED";
  if (available <= 0) return "OUT_OF_STOCK";
  if (available <= minimumStock(item)) return "LOW_STOCK";
  return "IN_STOCK";
};
export const statusLabel = (status: StockStatus) => ({ IN_STOCK: "In Stock", LOW_STOCK: "Low Stock", OUT_OF_STOCK: "Out of Stock", FULLY_RESERVED: "Fully Reserved" }[status]);
export const godownAvailable = (row: NonNullable<InventoryItemData["godownStocks"]>[number]) => Math.max(0, Number(row.quantity) - Number(row.reservedQuantity || 0));
