import { apiClient } from "./apiClient";

export interface BusinessUpdateInput {
  name?: string;
  gstNumber?: string;
  phone?: string;
  address?: string;
}

export interface BusinessResponse {
  success: boolean;
  message?: string;
  data: {
    id: string;
    name: string;
    gstNumber?: string;
    phone?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export const businessApi = {
  getBusiness: () => {
    return apiClient<BusinessResponse>("/business", {
      method: "GET",
    });
  },

  updateBusiness: (data: BusinessUpdateInput) => {
    return apiClient<BusinessResponse>("/business", {
      method: "PATCH",
      body: data,
    });
  },
};
export default businessApi;
