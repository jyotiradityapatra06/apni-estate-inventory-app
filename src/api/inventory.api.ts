import { apiClient } from "./apiClient";

export interface InventoryItemInput {
  materialName: string;
  category: string;
  brand?: string | null;
  sku: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  openingStock?: number;
  minimumStockLevel?: number;
  location: string;
  costPrice?: number | null;
  sellingPrice?: number | null;
  hsnCode?: string | null;
  taxRate?: number | null;
  defaultSupplierId?: string | null;
  supplierIds?: string[];
  godownId?: string;
}

export interface StockAdjustmentInput {
  idempotencyKey: string;
  type: "IN" | "OUT";
  quantity: number;
  note?: string;
  godownId?: string;
  reason?: string;
}

export interface InventoryItemData {
  id: string;
  materialName: string;
  category: string;
  brand?: string | null;
  sku: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  openingStock: number;
  minimumStockLevel: number;
  location: string;
  costPrice?: number | null;
  sellingPrice?: number | null;
  hsnCode?: string | null;
  taxRate?: number | null;
  isActive: boolean;
  defaultSupplierId?: string | null;
  defaultSupplier?: { id: string; name: string; supplierCode: string } | null;
  supplierMaterials?: Array<{ supplier: { id: string; name: string; supplierCode: string } }>;
  godownStocks?: Array<{ id: string; quantity: number; reservedQuantity?: number; godown: { id: string; name: string; godownCode: string } }>;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransactionData {
  id: string;
  type: "IN" | "OUT" | "TRANSFER_IN" | "TRANSFER_OUT";
  quantity: number;
  note?: string | null;
  inventoryItemId: string;
  userId: string;
  createdAt: string;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  inventoryItem?: { materialName: string; unit: string };
  godown?: { id: string; name: string } | null;
  user?: { id: string; name: string };
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

  getAllTransactions: () => {
    return apiClient<TransactionListResponse>("/inventory/transactions", {
      method: "GET",
    });
  },
};
export default inventoryApi;
