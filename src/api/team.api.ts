import { apiClient } from "./apiClient";

export interface Worker {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "MANAGER" | "STAFF" | "DRIVER";
  isActive: boolean;
  joiningDate: string;
  lastLogin?: string | null;
  createdAt: string;
}

export interface TeamResponse {
  success: boolean;
  data: {
    workers: Worker[];
    activeCount: number;
  };
}

export interface WorkerResponse {
  success: boolean;
  message?: string;
  data: Worker;
}

export interface CreateWorkerInput {
  name: string;
  email: string;
  phone: string;
  role: "MANAGER" | "STAFF" | "DRIVER";
  password?: string;
  isActive?: boolean;
}

export interface UpdateWorkerInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: "MANAGER" | "STAFF" | "DRIVER";
  isActive?: boolean;
  password?: string;
}

export const teamApi = {
  getTeam: (filters?: { search?: string; role?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append("search", filters.search);
    if (filters?.role) queryParams.append("role", filters.role);
    if (filters?.status) queryParams.append("status", filters.status);
    
    const queryString = queryParams.toString();
    const url = `/team${queryString ? `?${queryString}` : ""}`;
    
    return apiClient<TeamResponse>(url, {
      method: "GET",
    });
  },

  getWorkerById: (id: string) => {
    return apiClient<WorkerResponse>(`/team/${id}`, {
      method: "GET",
    });
  },

  createWorker: (data: CreateWorkerInput) => {
    return apiClient<WorkerResponse>("/team", {
      method: "POST",
      body: data,
    });
  },

  updateWorker: (id: string, data: UpdateWorkerInput) => {
    return apiClient<WorkerResponse>(`/team/${id}`, {
      method: "PATCH",
      body: data,
    });
  },

  updateWorkerStatus: (id: string, isActive: boolean) => {
    return apiClient<WorkerResponse>(`/team/${id}/status`, {
      method: "PATCH",
      body: { isActive },
    });
  },

  deleteWorker: (id: string) => {
    return apiClient<{ success: boolean; message?: string }>(`/team/${id}`, {
      method: "DELETE",
    });
  },
};
export default teamApi;
