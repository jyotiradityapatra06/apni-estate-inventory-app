export interface SupplierMaterial { inventoryItem: { id: string; materialName: string; sku: string; unit: string } }
export interface Supplier {
  id: string; supplierCode: string; name: string; contactPerson?: string | null; phone: string;
  alternatePhone?: string | null; email?: string | null; gstin?: string | null; address?: string | null;
  openingPayable: number; pendingPayments: number; notes?: string | null; isActive: boolean;
  companyName?: string | null; panNumber?: string | null; creditLimit: number; paymentTerms?: string | null;
  totalPurchases: number; paidAmount: number;
  suppliedMaterials: SupplierMaterial[]; createdAt: string; updatedAt: string;
}
export interface SupplierInput {
  name: string; contactPerson?: string | null; phone: string; alternatePhone?: string | null;
  email?: string | null; gstin?: string | null; address?: string | null; openingPayable: number;
  notes?: string | null; isActive?: boolean; materialIds?: string[];
  companyName?: string | null; panNumber?: string | null; creditLimit?: number; paymentTerms?: string | null;
}
