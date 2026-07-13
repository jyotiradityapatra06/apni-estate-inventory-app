import { apiClient } from "./apiClient";

export interface DeliveryInput {
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress: string;
  materialName: string;
  quantity: number;
  unit: string;
  scheduledDate?: string | null;
  notes?: string | null;
  status?: "PENDING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  paymentStatus?: "PENDING" | "RECEIVED";
}

export interface DeliveryData {
  id: string;
  deliveryNumber: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress: string;
  materialName: string;
  quantity: number;
  unit: string;
  scheduledDate?: string | null;
  notes?: string | null;
  status: "PENDING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  paymentStatus: "PENDING" | "RECEIVED";
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryListResponse {
  success: boolean;
  data: DeliveryData[];
}

export interface DeliveryResponse {
  success: boolean;
  message?: string;
  data: DeliveryData;
}

export const deliveryApi = {
  getDeliveries: () => {
    return apiClient<DeliveryListResponse>("/deliveries", {
      method: "GET",
    });
  },

  createDelivery: (data: DeliveryInput) => {
    return apiClient<DeliveryResponse>("/deliveries", {
      method: "POST",
      body: data,
    });
  },

  updateDelivery: (id: string, data: Partial<DeliveryInput>) => {
    return apiClient<DeliveryResponse>(`/deliveries/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  deleteDelivery: (id: string) => {
    return apiClient<{ success: boolean; message?: string; data: { id: string } }>(`/deliveries/${id}`, {
      method: "DELETE",
    });
  },
};

export default deliveryApi;
