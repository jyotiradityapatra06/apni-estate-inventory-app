import { useCallback, useEffect, useState } from "react";
import { inventoryApi, type InventoryItemData } from "../../api/inventory.api";

export function useMaterials() {
  const [data, setData] = useState<InventoryItemData[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => { setLoading(true); setError(null); try { const response = await inventoryApi.getItems(); setData(response.data ?? []); } catch (error) { setError(error instanceof Error ? error.message : "Could not load stock."); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}
