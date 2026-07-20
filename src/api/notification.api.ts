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

export interface ClearNotificationsResponse {
  success: boolean;
  message: string;
  data: {
    deletedCount: number;
  };
}

let notificationRequest: Promise<NotificationListResponse> | null = null;
let notificationCache: { value: NotificationListResponse; at: number } | null = null;
const invalidateNotificationCache = () => {
  notificationRequest = null;
  notificationCache = null;
};

export const notificationApi = {
  getNotifications: () => {
    if (notificationCache && Date.now() - notificationCache.at < 500) {
      return Promise.resolve(notificationCache.value);
    }
    if (notificationRequest) return notificationRequest;
    notificationRequest = apiClient<NotificationListResponse>(
      `/notifications?refresh=${Date.now()}`,
      {
        method: "GET",
      }
    ).then((value) => {
      notificationCache = { value, at: Date.now() };
      return value;
    }).finally(() => {
      notificationRequest = null;
    });
    return notificationRequest;
  },

  createNotification: (title: string, message: string) => {
    invalidateNotificationCache();
    return apiClient<NotificationDetailResponse>("/notifications", {
      method: "POST",
      body: {
        title,
        message,
      },
    });
  },

  clearNotifications: () => {
    invalidateNotificationCache();
    return apiClient<ClearNotificationsResponse>("/notifications", {
      method: "DELETE",
    });
  },
};

export default notificationApi;
