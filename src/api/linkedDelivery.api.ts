import { apiClient } from "./apiClient";
export const linkedDeliveryApi = {
  getAll: (query = "") => apiClient<any>(`/linked-deliveries${query ? `?${query}` : ""}`),
  getById: (id: string) => apiClient<any>(`/linked-deliveries/${id}`),
  create: (body: unknown) => apiClient<any>("/linked-deliveries", { method: "POST", body }),
  ready: (id: string, body: unknown) => apiClient<any>(`/linked-deliveries/${id}/ready`, { method: "POST", body }),
  dispatch: (id: string) => apiClient<any>(`/linked-deliveries/${id}/dispatch`, { method: "POST", body: {} }),
  complete: (id: string, body: unknown) => apiClient<any>(`/linked-deliveries/${id}/complete`, { method: "POST", body }),
  cancel: (id: string, reason: string) => apiClient<any>(`/linked-deliveries/${id}/cancel`, { method: "POST", body: { reason } }),
  reverse: (id: string, reason: string) => apiClient<any>(`/linked-deliveries/${id}/reverse-dispatch`, { method: "POST", body: { reason } }),
};
export default linkedDeliveryApi;
