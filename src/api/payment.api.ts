import { apiClient } from "./apiClient";
export const paymentApi = {
  getAll: (query = "") => apiClient<any>(`/customer-payments${query ? `?${query}` : ""}`),
  getById: (id: string) => apiClient<any>(`/customer-payments/${id}`),
  create: (body: unknown) => apiClient<any>("/customer-payments", { method: "POST", body }),
  reverse: (id: string) => apiClient<any>(`/customer-payments/${id}/reverse`, { method: "POST" }),
};
export default paymentApi;
