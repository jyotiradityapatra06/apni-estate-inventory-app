export interface CacheEntry<T = unknown> {
  key: string;
  endpoint: string;
  businessId: string;
  userId: string;
  resourceType: "dashboard" | "inventory" | "customers" | "suppliers";
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export interface CacheQueryResult<T = unknown> {
  data: T;
  offline: boolean;
  cachedAt: number;
  isExpired: boolean;
}
