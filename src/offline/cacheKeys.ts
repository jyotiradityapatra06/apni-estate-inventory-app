export const CACHE_TTLS = {
  DASHBOARD: 30 * 60 * 1000, // 30 minutes
  INVENTORY: 30 * 60 * 1000, // 30 minutes
  CUSTOMERS: 24 * 60 * 60 * 1000, // 24 hours
  SUPPLIERS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export type WhitelistedResourceType = "dashboard" | "inventory" | "customers" | "suppliers";

export interface CacheRule {
  cacheable: boolean;
  ttl: number;
  resourceType: WhitelistedResourceType;
}

export function getCacheRulesForEndpoint(path: string): CacheRule | null {
  const cleanPath = path.split("?")[0].replace(/\/$/, "");

  // Explicit Blacklist check (Financials, Invoices, Payments, Ledger, Reports, Auth, Delivery)
  if (
    cleanPath.includes("/invoices") ||
    cleanPath.includes("/payments") ||
    cleanPath.includes("/ledger") ||
    cleanPath.includes("/reports") ||
    cleanPath.includes("/financials") ||
    cleanPath.includes("/auth") ||
    cleanPath.includes("/deliveries") ||
    cleanPath.includes("/sales-orders") ||
    cleanPath.includes("/purchases") ||
    cleanPath.includes("/returns")
  ) {
    return null;
  }

  // Whitelist check
  if (cleanPath === "/dashboard" || cleanPath.startsWith("/dashboard/")) {
    return { cacheable: true, ttl: CACHE_TTLS.DASHBOARD, resourceType: "dashboard" };
  }

  if (
    cleanPath === "/inventory" ||
    cleanPath.startsWith("/inventory/") ||
    cleanPath === "/materials" ||
    cleanPath.startsWith("/materials/") ||
    cleanPath === "/godowns" ||
    cleanPath.startsWith("/godowns/") ||
    cleanPath.includes("/stock")
  ) {
    return { cacheable: true, ttl: CACHE_TTLS.INVENTORY, resourceType: "inventory" };
  }

  if (cleanPath === "/customers" || cleanPath.startsWith("/customers/")) {
    return { cacheable: true, ttl: CACHE_TTLS.CUSTOMERS, resourceType: "customers" };
  }

  if (cleanPath === "/suppliers" || cleanPath.startsWith("/suppliers/")) {
    return { cacheable: true, ttl: CACHE_TTLS.SUPPLIERS, resourceType: "suppliers" };
  }

  return null;
}
