import type { CacheEntry } from "./offline.types";

const DB_NAME = "apni_estate_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "api_cache";

let dbInstance: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbInstance = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("businessId", "businessId", { unique: false });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("expiresAt", "expiresAt", { unique: false });
      }
    };
  });

  return dbInstance;
}

export async function getCacheEntry<T = unknown>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as CacheEntry<T>) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCacheEntry<T = unknown>(entry: CacheEntry<T>): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Failed to save entry:", err);
  }
}

export async function clearCacheForNamespace(businessId: string, userId: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();

      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const record = cursor.value as CacheEntry;
          if (record.businessId === businessId && record.userId === userId) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      req.onerror = () => resolve();
    });
  } catch (err) {
    console.error("[IndexedDB] Failed to clear business/user namespace cache:", err);
  }
}
