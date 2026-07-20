import { apiClient } from "./apiClient";
import type { Godown, GodownInput, StockTransfer } from "../types/godown.types";
export const godownApi = {
  getAll: () => apiClient<{ success: boolean; data: Godown[] }>("/godowns"),
  getById: (id: string) => apiClient<{ success: boolean; data: Godown }>(`/godowns/${id}`),
  create: (data: GodownInput) => apiClient<{ success: boolean; message?: string; data: Godown }>("/godowns", { method: "POST", body: data }),
  update: (id: string, data: Partial<GodownInput>) => apiClient<{ success: boolean; message?: string; data: Godown }>(`/godowns/${id}`, { method: "PATCH", body: data }),
  remove: (id: string) => apiClient<{ success: boolean; message?: string; data: Godown }>(`/godowns/${id}`, { method: "DELETE" }),
  getTransfers: () => apiClient<{ success: boolean; data: StockTransfer[] }>("/stock-transfers"),
  createTransfer: (data: { sourceGodownId: string; destinationGodownId: string; notes?: string; items: Array<{ inventoryItemId: string; quantity: number }> }) => apiClient<{ success: boolean; data: StockTransfer }>("/stock-transfers", { method: "POST", body: data }),
  postTransfer: (id: string) => apiClient<{ success: boolean; message?: string; data: StockTransfer }>(`/stock-transfers/${id}/post`, { method: "POST" }),
  cancelTransfer: (id: string) => apiClient<{ success: boolean; message?: string; data: StockTransfer }>(`/stock-transfers/${id}/cancel`, { method: "POST" }),
};
