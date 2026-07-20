import { apiClient } from "./apiClient";
import type { Invoice } from "../features/invoices/invoice.types";
export const invoiceApi = {
  getAll: (query = "") => apiClient<{success:boolean;data:Invoice[]}>(`/invoices${query ? `?${query}` : ""}`),
  getById: (id: string) => apiClient<{success:boolean;data:Invoice}>(`/invoices/${id}`),
  calculate: (body: unknown) => apiClient<any>("/invoices/calculate", { method: "POST", body }),
  create: (body: unknown) => apiClient<{success:boolean;message?:string;data:Invoice}>("/invoices", { method: "POST", body }),
  issue: (id: string) => apiClient<{success:boolean;message?:string;data:Invoice}>(`/invoices/${id}/issue`, { method: "POST" }),
  cancel: (id: string) => apiClient<{success:boolean;message?:string;data:Invoice}>(`/invoices/${id}/cancel`, { method: "POST" }),
};
export default invoiceApi;
