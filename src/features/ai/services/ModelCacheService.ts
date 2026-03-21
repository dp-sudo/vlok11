/**
 * Model Cache Service
 *
 * Provides IndexedDB-based persistent storage for AI model files.
 * Models are cached locally and reused across sessions for faster load times.
 */

import { createLogger } from '@/core/Logger';

const logger = createLogger({ module: 'ModelCache' });

const DB_NAME = 'immersa-model-cache';
const DB_VERSION = 1;
const STORE_NAME = 'model-artifacts';

interface CachedModel {
  key: string;
  data: ArrayBuffer;
  timestamp: number;
  size: number;
  version: string;
}

class ModelCacheService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      logger.info('Initializing model cache database...');

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open model cache database', { error: request.error });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('Model cache database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });

          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
          logger.info('Model cache object store created');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store model data in cache
   */
  async set(key: string, data: ArrayBuffer, version: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const cacheEntry: CachedModel = {
      key,
      data,
      timestamp: Date.now(),
      size: data.byteLength,
      version,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cacheEntry);

      request.onsuccess = () => {
        logger.info(`Model cached: ${key} (${(data.byteLength / 1024 / 1024).toFixed(2)} MB)`);
        resolve();
      };

      request.onerror = () => {
        logger.error('Failed to cache model', { error: request.error, key });
        reject(request.error);
      };
    });
  }

  /**
   * Retrieve model data from cache
   */
  async get(key: string): Promise<ArrayBuffer | null> {
    await this.initialize();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CachedModel | undefined;

        if (result) {
          logger.info(`Model cache hit: ${key}`);
          resolve(result.data);
        } else {
          logger.info(`Model cache miss: ${key}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        logger.error('Failed to retrieve cached model', { error: request.error, key });
        reject(request.error);
      };
    });
  }

  /**
   * Check if model exists in cache
   */
  async has(key: string): Promise<boolean> {
    await this.initialize();
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Remove model from cache
   */
  async remove(key: string): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        logger.info(`Model removed from cache: ${key}`);
        resolve();
      };

      request.onerror = () => {
        logger.error('Failed to remove cached model', { error: request.error, key });
        reject(request.error);
      };
    });
  }

  /**
   * Get total cache size
   */
  async getTotalSize(): Promise<number> {
    await this.initialize();
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      let totalSize = 0;

      request.onsuccess = () => {
        const cursor = request.result;

        if (cursor) {
          totalSize += (cursor.value as CachedModel).size;
          cursor.continue();
        } else {
          resolve(totalSize);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all cached models
   */
  async clear(): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        logger.info('Model cache cleared');
        resolve();
      };

      request.onerror = () => {
        logger.error('Failed to clear model cache', { error: request.error });
        reject(request.error);
      };
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ count: number; totalSize: number; oldestTimestamp: number | null }> {
    await this.initialize();
    if (!this.db) return { count: 0, totalSize: 0, oldestTimestamp: null };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();
      const indexRequest = store.index('timestamp').openCursor();

      let count = 0;
      let totalSize = 0;
      let oldestTimestamp: number | null = null;

      countRequest.onsuccess = () => {
        count = countRequest.result;
      };

      indexRequest.onsuccess = () => {
        const cursor = indexRequest.result;

        if (cursor) {
          const model = cursor.value as CachedModel;

          totalSize += model.size;
          if (oldestTimestamp === null || model.timestamp < oldestTimestamp) {
            oldestTimestamp = model.timestamp;
          }
          cursor.continue();
        } else {
          resolve({ count, totalSize, oldestTimestamp });
        }
      };

      countRequest.onerror = () => reject(countRequest.error);
      indexRequest.onerror = () => reject(indexRequest.error);
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      logger.info('Model cache database closed');
    }
  }
}

// Export singleton instance
export const modelCache = new ModelCacheService();

// Export class for testing
export { ModelCacheService };
