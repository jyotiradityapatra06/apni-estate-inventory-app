import { apiClient } from "./apiClient";

export interface InventoryItemInput {
  materialName: string;
  category: string;
  sku: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  location: string;
  costPrice?: number | null;
  sellingPrice?: number | null;
}

export interface StockAdjustmentInput {
  type: "IN" | "OUT";
  quantity: number;
  note?: string;
}

export interface InventoryItemData {
  id: string;
  materialName: string;
  category: string;
  sku: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  location: string;
  costPrice?: number | null;
  sellingPrice?: number | null;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransactionData {
  id: string;
  type: "IN" | "OUT";
  quantity: number;
  note?: string | null;
  inventoryItemId: string;
  userId: string;
  createdAt: string;
}

export interface InventoryListResponse {
  success: boolean;
  data: InventoryItemData[];
}

export interface InventoryItemResponse {
  success: boolean;
  message?: string;
  data: InventoryItemData;
}

export interface TransactionListResponse {
  success: boolean;
  data: StockTransactionData[];
}

export const inventoryApi = {
  getItems: (filters: { search?: string; category?: string; location?: string; stockStatus?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.category) params.append("category", filters.category);
    if (filters.location) params.append("location", filters.location);
    if (filters.stockStatus) params.append("stockStatus", filters.stockStatus);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return apiClient<InventoryListResponse>(`/inventory${queryStr}`, {
      method: "GET",
    });
  },

  getItem: (id: string) => {
    return apiClient<InventoryItemResponse>(`/inventory/${id}`, {
      method: "GET",
    });
  },

  createItem: (data: InventoryItemInput) => {
    return apiClient<InventoryItemResponse>("/inventory", {
      method: "POST",
      body: data,
    });
  },

  updateItem: (id: string, data: Partial<InventoryItemInput>) => {
    return apiClient<InventoryItemResponse>(`/inventory/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  deleteItem: (id: string) => {
    return apiClient<{ success: boolean; message?: string; data: { id: string } }>(`/inventory/${id}`, {
      method: "DELETE",
    });
  },

  adjustStock: (id: string, data: StockAdjustmentInput) => {
    return apiClient<InventoryItemResponse>(`/inventory/${id}/stock`, {
      method: "PATCH",
      body: data,
    });
  },

  getTransactions: (id: string) => {
    return apiClient<TransactionListResponse>(`/inventory/${id}/transactions`, {
      method: "GET",
    });
  },
};
export default inventoryApi;
