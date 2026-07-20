import { useState, useEffect, useCallback } from "react";
import inventoryApi, { InventoryItemData, InventoryItemInput, StockAdjustmentInput } from "../api/inventory.api";

export const useGetInventory = (filters: { search?: string; category?: string; location?: string; stockStatus?: string } = {}) => {
  const [data, setData] = useState<InventoryItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.getItems(filters);
      if (res.success) {
        setData(res.data);
      } else {
        setError("Failed to fetch inventory data.");
      }
    } catch (err: any) {
      console.error("Error fetching inventory items:", err);
      setError(err?.message || "An unexpected error occurred while fetching inventory.");
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.category, filters.location, filters.stockStatus]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    data,
    loading,
    error,
    refresh: fetchItems,
  };
};

export const useInventoryMutations = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createItem = async (data: InventoryItemInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.createItem(data);
      return res.data;
    } catch (err: any) {
      setError(err.message || "Failed to create inventory item.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, data: Partial<InventoryItemInput>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.updateItem(id, data);
      return res.data;
    } catch (err: any) {
      setError(err.message || "Failed to update inventory item.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await inventoryApi.deleteItem(id);
    } catch (err: any) {
      setError(err.message || "Failed to delete inventory item.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (id: string, data: StockAdjustmentInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.adjustStock(id, data);
      return res.data;
    } catch (err: any) {
      setError(err.message || "Failed to record stock adjustment.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    adjustStock,
  };
};
