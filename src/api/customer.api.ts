import { apiClient } from "./apiClient";
import type { Customer, CustomerInput } from "../types/customer.types";
export const customerApi = {
  getAll: (search = "") => apiClient<{ success: boolean; data: Customer[] }>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getById: (id: string) => apiClient<{ success: boolean; data: Customer & { transactionHistory: unknown[] } }>(`/customers/${id}`),
  create: (data: CustomerInput) => apiClient<{ success: boolean; message?: string; data: Customer }>("/customers", { method: "POST", body: data }),
  update: (id: string, data: Partial<CustomerInput>) => apiClient<{ success: boolean; message?: string; data: Customer }>(`/customers/${id}`, { method: "PATCH", body: data }),
  remove: (id: string) => apiClient<{ success: boolean; message?: string; data: Customer }>(`/customers/${id}`, { method: "DELETE" }),
};
