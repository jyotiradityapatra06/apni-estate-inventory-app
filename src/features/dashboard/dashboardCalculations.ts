import type { InventoryItemData, StockTransactionData } from "../../api/inventory.api";
import type { InvoiceSummary } from "./dashboard.types";

export const sameLocalDay = (value: string, date = new Date()) => new Date(value).toDateString() === date.toDateString();
export const reservedStock = (item: InventoryItemData) => (item.godownStocks ?? []).reduce((sum, stock: any) => sum + Number(stock.reservedQuantity ?? 0), 0);
export const availableStock = (item: InventoryItemData) => Math.max(0, Number(item.quantity) - reservedStock(item));
export const minimumStock = (item: InventoryItemData) => Number(item.minimumStockLevel ?? item.reorderLevel ?? 0);
export const lowStockItems = (items: InventoryItemData[]) => items.filter((item) => item.isActive && availableStock(item) <= minimumStock(item));
export const todayMovements = (items: StockTransactionData[], directions: string[]) => items.filter((item) => directions.includes(item.type) && sameLocalDay(item.createdAt));
export const activeInvoices = (items: InvoiceSummary[]) => items.filter((item) => ["ISSUED", "PARTIALLY_PAID", "PAID"].includes(item.status));
