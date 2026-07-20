export interface Customer {
  id: string; customerCode: string; name: string; phone: string; email?: string | null;
  gstin?: string | null; billingAddress?: string | null; shippingAddress?: string | null;
  creditLimit: number; openingBalance: number; outstandingBalance: number;
  notes?: string | null; isActive: boolean; createdAt: string; updatedAt: string;
}
export type CustomerInput = Omit<Customer, "id" | "customerCode" | "outstandingBalance" | "createdAt" | "updatedAt">;
