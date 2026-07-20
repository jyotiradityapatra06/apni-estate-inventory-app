import { apiClient } from "./apiClient";

export const salesReturnApi = {
  list: (query = "") =>
    apiClient<{
      success: boolean;
      data: any[];
    }>(`/sales-returns${query ? `?${query}` : ""}`),
  get: (id: string) =>
    apiClient<{
      success: boolean;
      data: any;
    }>(`/sales-returns/${id}`),
  create: (body: any) =>
    apiClient<{
      success: boolean;
      data: any;
    }>("/sales-returns", { method: "POST", body }),
  post: (id: string) =>
    apiClient<{
      success: boolean;
      data: any;
    }>(`/sales-returns/${id}/post`, { method: "POST" }),
  cancel: (id: string, reason: string) =>
    apiClient<{
      success: boolean;
      data: any;
    }>(`/sales-returns/${id}/cancel`, { method: "POST", body: { reason } }),
};
