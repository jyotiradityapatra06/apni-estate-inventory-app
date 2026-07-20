import { apiClient } from "./apiClient";
import type { SalesOrder } from "../features/sales-orders/salesOrder.types";
export const salesOrderApi = {
  getAll: (query = "") => apiClient<{success:boolean;data:SalesOrder[]}>(`/sales-orders${query ? `?${query}` : ""}`),
  getById: (id: string) => apiClient<{success:boolean;data:SalesOrder}>(`/sales-orders/${id}`),
  getDeliverableItems: (id: string) => apiClient<any>(`/sales-orders/${id}/deliverable-items`),
  create: (body: unknown) => apiClient<{success:boolean;message?:string;data:SalesOrder}>("/sales-orders", { method: "POST", body }),
  confirm: (id: string, creditLimitOverride = false) => apiClient<{success:boolean;message?:string;data:SalesOrder}>(`/sales-orders/${id}/confirm`, { method: "POST", body: { creditLimitOverride } }),
  cancel: (id: string) => apiClient<{success:boolean;message?:string;data:SalesOrder}>(`/sales-orders/${id}/cancel`, { method: "POST" }),
};
export default salesOrderApi;
