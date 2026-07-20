import { apiClient } from "./apiClient";
import type { Supplier, SupplierInput } from "../types/supplier.types";
export const supplierApi = {
  getAll: (search = "") => apiClient<{ success: boolean; data: Supplier[] }>(`/suppliers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getById: (id: string) => apiClient<{ success: boolean; data: Supplier & { purchaseHistory: unknown[] } }>(`/suppliers/${id}`),
  create: (data: SupplierInput) => apiClient<{ success: boolean; message?: string; data: Supplier }>("/suppliers", { method: "POST", body: data }),
  update: (id: string, data: Partial<SupplierInput>) => apiClient<{ success: boolean; message?: string; data: Supplier }>(`/suppliers/${id}`, { method: "PATCH", body: data }),
  remove: (id: string) => apiClient<{ success: boolean; message?: string; data: Supplier }>(`/suppliers/${id}`, { method: "DELETE" }),
};
