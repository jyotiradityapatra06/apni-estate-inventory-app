import { apiClient } from "./apiClient";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  businessName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      role: string;
      businessId: string;
      isActive: boolean;
    };
    permissions: string[];
    business: {
      id: string;
      name: string;
      gstNumber?: string;
      phone?: string;
      address?: string;
    };
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      role: string;
      businessId: string;
      isActive: boolean;
    };
    permissions: string[];
    business: {
      id: string;
      name: string;
      gstNumber?: string;
      phone?: string;
      address?: string;
    };
  };
}

export const authApi = {
  register: (data: RegisterInput) => {
    return apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: data,
    });
  },

  login: (data: LoginInput) => {
    return apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: data,
    });
  },

  getMe: () => {
    return apiClient<MeResponse>("/auth/me", {
      method: "GET",
    });
  },
};
export default authApi;
