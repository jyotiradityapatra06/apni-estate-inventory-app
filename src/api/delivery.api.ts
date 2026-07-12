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
}

export interface DeliveryData {
  id: string;
  businessId: string;
  deliveryNumber: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress: string;
  materialName: string;
  quantity: number;
  unit: string;
  driverId?: string | null;
  driver?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  vehicleNumber?: string | null;
  status: string; // PENDING, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
  scheduledDate?: string | null;
  notes?: string | null;
  createdById: string;
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
  getDeliveries: (status?: string) => {
    const query = status && status !== "ALL" ? `?status=${status}` : "";
    return apiClient<DeliveryListResponse>(`/deliveries${query}`, {
      method: "GET",
    });
  },

  getDelivery: (id: string) => {
    return apiClient<DeliveryResponse>(`/deliveries/${id}`, {
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
      method: "PATCH",
      body: data,
    });
  },

  assignDriver: (id: string, driverId: string, vehicleNumber: string) => {
    return apiClient<DeliveryResponse>(`/deliveries/${id}/assign`, {
      method: "PATCH",
      body: { driverId, vehicleNumber },
    });
  },

  updateStatus: (id: string, status: string) => {
    return apiClient<DeliveryResponse>(`/deliveries/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  deleteDelivery: (id: string) => {
    return apiClient<{ success: boolean; message?: string; data: { id: string } }>(`/deliveries/${id}`, {
      method: "DELETE",
    });
  },

  getDriverDeliveries: () => {
    return apiClient<DeliveryListResponse>("/driver/deliveries", {
      method: "GET",
    });
  },
};

export default deliveryApi;
