import { apiClient } from "./apiClient";

export interface BusinessUpdateInput {
  name?: string;
  logoUrl?: string | null;
  gstNumber?: string;
  state?: string;
  stateCode?: string;
  phone?: string;
  address?: string;
  email?: string | null;
  website?: string | null;
  registrationType?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  branch?: string | null;
  upiId?: string | null;
  invoiceTerms?: string | null;
  invoiceFooter?: string | null;
  workerSeatLimit?: number;
}

export interface BusinessResponse {
  success: boolean;
  message?: string;
  data: {
    id: string;
    name: string;
    logoUrl?: string | null;
    gstNumber?: string | null;
    state?: string | null;
    stateCode?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    address?: string | null;
    registrationType?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    branch?: string | null;
    upiId?: string | null;
    invoiceTerms?: string | null;
    invoiceFooter?: string | null;
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

  getProfile: () => apiClient<BusinessResponse>("/business/profile", { method: "GET" }),

  updateProfile: (data: BusinessUpdateInput & { name: string }) =>
    apiClient<BusinessResponse>("/business/profile", { method: "PUT", body: data }),
};
export default businessApi;
