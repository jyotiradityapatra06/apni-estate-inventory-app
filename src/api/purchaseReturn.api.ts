import { apiClient } from "./apiClient";

export const purchaseReturnApi = {
  list: (query = "") =>
    apiClient<{
      success: boolean;
      data: any[];
    }>(`/purchase-returns${query ? `?${query}` : ""}`),
  get: (id: string) =>
    apiClient<{
      success: boolean;
      data: any;
    }>(`/purchase-returns/${id}`),
  create: (body: any) =>
    apiClient<{
      success: boolean;
      data: any;
    }>("/purchase-returns", { method: "POST", body }),
  post: (id: string) =>
    apiClient<{
      success: boolean;
      data: any;
    }>(`/purchase-returns/${id}/post`, { method: "POST" }),
  cancel: (id: string, reason: string) =>
    apiClient<{
      success: boolean;
      data: any;
    }>(`/purchase-returns/${id}/cancel`, { method: "POST", body: { reason } }),
};
