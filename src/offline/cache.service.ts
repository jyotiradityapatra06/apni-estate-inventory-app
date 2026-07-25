import type { CacheEntry, CacheQueryResult } from "./offline.types";
import { getCacheRulesForEndpoint } from "./cacheKeys";
import { getCacheEntry, setCacheEntry, clearCacheForNamespace } from "./db";

function getSessionNamespace(): { userId: string; businessId: string } | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.id || payload.userId;
    const businessId = payload.businessId;
    if (userId && businessId) {
      return { userId: String(userId), businessId: String(businessId) };
    }
  } catch (err) {
    console.warn("[CacheService] Could not decode session token for namespace:", err);
  }
  return null;
}

export const cacheService = {
  async getCachedResponse<T = unknown>(endpoint: string): Promise<CacheQueryResult<T> | null> {
    const rule = getCacheRulesForEndpoint(endpoint);
    if (!rule || !rule.cacheable) return null;

    const ns = getSessionNamespace();
    if (!ns) return null;

    const key = `${ns.businessId}:${ns.userId}:${endpoint}`;
    const entry = await getCacheEntry<T>(key);
    if (!entry) return null;

    // Strict Business and User Isolation Guard
    if (entry.businessId !== ns.businessId || entry.userId !== ns.userId) {
      console.warn("[CacheService] Cross-business/user cache mismatch detected. Ignoring entry.");
      return null;
    }

    const isExpired = Date.now() > entry.expiresAt;

    return {
      data: entry.data,
      offline: true,
      cachedAt: entry.cachedAt,
      isExpired,
    };
  },

  async setCachedResponse<T = unknown>(endpoint: string, data: T): Promise<void> {
    const rule = getCacheRulesForEndpoint(endpoint);
    if (!rule || !rule.cacheable) return;

    const ns = getSessionNamespace();
    if (!ns) return;

    const now = Date.now();
    const key = `${ns.businessId}:${ns.userId}:${endpoint}`;
    const entry: CacheEntry<T> = {
      key,
      endpoint,
      businessId: ns.businessId,
      userId: ns.userId,
      resourceType: rule.resourceType,
      data,
      cachedAt: now,
      expiresAt: now + rule.ttl,
    };

    await setCacheEntry(entry);
  },

  async clearCacheOnLogout(businessId?: string, userId?: string): Promise<void> {
    let bId = businessId;
    let uId = userId;
    if (!bId || !uId) {
      const ns = getSessionNamespace();
      if (ns) {
        bId = bId || ns.businessId;
        uId = uId || ns.userId;
      }
    }
    if (bId && uId) {
      await clearCacheForNamespace(bId, uId);
    }
  },
};
