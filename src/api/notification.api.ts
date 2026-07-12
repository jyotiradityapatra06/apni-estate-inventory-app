import { apiClient } from "./apiClient";

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  businessId: string;
  createdAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationData[];
}

export interface NotificationDetailResponse {
  success: boolean;
  message?: string;
  data: NotificationData;
}

export const notificationApi = {
  getNotifications: () => {
    return apiClient<NotificationListResponse>("/notifications", {
      method: "GET",
    });
  },

  createNotification: (title: string, message: string) => {
    return apiClient<NotificationDetailResponse>("/notifications", {
      method: "POST",
      body: { title, message },
    });
  },
};
export default notificationApi;
