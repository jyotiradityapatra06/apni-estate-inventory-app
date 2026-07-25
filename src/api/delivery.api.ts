import { apiClient } from "./apiClient";

export type DeliveryStatusType = "PENDING" | "ASSIGNED" | "DISPATCHED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export interface DeliveryInput {
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress: string;
  materialName: string;
  quantity: number;
  unit: string;
  scheduledDate?: string | null;
  notes?: string | null;
  status?: DeliveryStatusType;
  paymentStatus?: "PENDING" | "RECEIVED";
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  receiverName?: string | null;
  proofOfDeliveryReference?: string | null;
  deliveryNotes?: string | null;
  cancellationReason?: string | null;
}

export interface DeliveryData {
  id: string;
  deliveryNumber: string;
  challanNumber?: string | null;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress: string;
  materialName: string;
  quantity: number;
  unit: string;
  scheduledDate?: string | null;
  notes?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  receiverName?: string | null;
  proofOfDeliveryReference?: string | null;
  deliveryNotes?: string | null;
  cancellationReason?: string | null;
  status: DeliveryStatusType;
  paymentStatus: "PENDING" | "RECEIVED";
  businessId: string;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string } | null;
  dispatchedBy?: { id: string; name: string } | null;
  completedBy?: { id: string; name: string } | null;
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
