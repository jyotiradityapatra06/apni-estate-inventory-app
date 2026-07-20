export interface GodownStock {
  id: string;
  quantity: number;
  reservedQuantity: number;
  inventoryItem: {
    id: string;
    materialName: string;
    sku: string;
    unit: string;
    minimumStockLevel?: number;
  };
}

export interface Godown {
  id: string;
  godownCode: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  notes?: string | null;
  isDefault: boolean;
  isActive: boolean;
  stockBalances: GodownStock[];
}

export interface GodownInput {
  name: string;
  godownCode?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  notes?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  status: "DRAFT" | "COMPLETED" | "CANCELLED";
  sourceGodown: Pick<Godown, "id" | "name" | "godownCode">;
  destinationGodown: Pick<Godown, "id" | "name" | "godownCode">;
  items: Array<{
    quantity: number;
    inventoryItem: {
      id: string;
      materialName: string;
      sku?: string;
      unit: string;
    };
  }>;
  createdBy?: {
    id: string;
    name: string;
  };
  notes?: string | null;
  transferDate?: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
}
