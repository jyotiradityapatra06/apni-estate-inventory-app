import type { InventoryItemData, StockTransactionData } from "../../api/inventory.api";
import type { DeliveryData } from "../../api/delivery.api";
import type { NotificationData } from "../../api/notification.api";
import type { ExpenseSummary } from "../expenses/expense.types";
import type { Invoice } from "../invoices/invoice.types";

export type InvoiceSummary = Invoice;
export interface ResourceState<T> { data: T; loading: boolean; error: string | null; }
export interface DashboardData {
  inventory: ResourceState<InventoryItemData[]>;
  movements: ResourceState<StockTransactionData[]>;
  deliveries: ResourceState<DeliveryData[]>;
  activity: ResourceState<NotificationData[]>;
  invoices: ResourceState<InvoiceSummary[]>;
  payments: ResourceState<any[]>;
  expenses: ResourceState<ExpenseSummary>;
  purchases: ResourceState<{ data: any[]; summary: any }>;
  salesReturns: ResourceState<any[]>;
  purchaseReturns: ResourceState<any[]>;
  canViewFinancials: boolean;
  canViewDeliveries: boolean;
  canViewExpenses: boolean;
  canViewSalesReturns: boolean;
  canViewPurchaseReturns: boolean;
  refresh: () => Promise<void>;
}
