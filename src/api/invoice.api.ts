import { apiClient } from "./apiClient";
import type { Invoice } from "../features/invoices/invoice.types";
export const invoiceApi = {
  getAll: (query = "") => apiClient<{success:boolean;data:Invoice[]}>(`/invoices${query ? `?${query}` : ""}`),
  getById: (id: string) => apiClient<{success:boolean;data:Invoice}>(`/invoices/${id}`),
  calculate: (body: unknown) => apiClient<any>("/invoices/calculate", { method: "POST", body }),
  create: (body: unknown) => apiClient<{success:boolean;message?:string;data:Invoice}>("/invoices", { method: "POST", body }),
  issue: (id: string) => apiClient<{success:boolean;message?:string;data:Invoice}>(`/invoices/${id}/issue`, { method: "POST" }),
  cancel: (id: string) => apiClient<{success:boolean;message?:string;data:Invoice}>(`/invoices/${id}/cancel`, { method: "POST" }),
  share: (id: string, phone?: string) => apiClient<{success:boolean;data:{publicToken:string;publicUrl:string}}>(`/invoices/${id}/share`, { method: "POST", body: { phone } }),
  getPublicByToken: (token: string) => apiClient<{success:boolean;data:Invoice}>(`/public/invoices/${token}`),
  getSharesByCustomer: (customerId: string) => apiClient<{success:boolean;data:any[]}>(`/invoices/customer/${customerId}/shares`),
};
export default invoiceApi;
