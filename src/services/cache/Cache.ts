import { Collection } from "discord.js";
import { LoggerService } from "../logging/Logger";
import { CustomClient } from "../../core/Client";
// Type definition for cache entries with metadata
interface CacheEntry<T> {
  value: T;
  type: string;
  createdAt: number;
  expiresAt?: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Collection<string, CacheEntry<any>>();
  private logger = LoggerService.getInstance();
  private cleanupInterval?: NodeJS.Timer;
  private cleanupIntervalTime = 1000 * 60 * 5; // Clean every 5 minutes
  private client = CustomClient;
  private constructor() {
    // Start cleanup interval to remove expired entries
    this.cleanupInterval = setInterval(
      () => this.removeExpired(),
      this.cleanupIntervalTime
    );
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get a value from cache with type inference
   * @param key The cache key
   * @returns The typed cached value or undefined if not found
   */
  get(key: string): any {
    const entry = this.cache.get(key);

    if (!entry) {
      this.logger.debug(`Cache miss: ${key}`, { service: "CacheService" });
      return undefined;
    }

    // Check if entry has expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.logger.debug(`Cache entry expired: ${key}`, {
        service: "CacheService",
      });
      this.cache.delete(key);
      return undefined;
    }

    this.logger.info(`Cache hit: ${key} (type: ${entry.type})`, {
      service: "CacheService",
    });
    return entry.value as typeof entry.value;
  }

  /**
   * Set a value in cache with optional TTL
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time to live in seconds (optional)
   */
  set(key: string, value: any, ttl?: number): void {
    const entry: CacheEntry<any> = {
      value,
      type: typeof value,
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    };

    this.cache.set(key, entry);

    this.logger.info(
      `Cache set: ${key} (type: ${entry.type}, ttl: ${ttl || "infinite"})`,
      { service: "CacheService" }
    );
  }

  /**
   * Delete an entry from the cache
   * @param key The cache key to delete
   * @returns true if entry was found and deleted, false otherwise
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.info(`Cache delete: ${key}`, { service: "CacheService" });
    }
    return deleted;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info(`Cache cleared: ${size} entries removed`, {
      service: "CacheService",
    });
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get the number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Remove all expired entries from the cache
   */
  private removeExpired(): void {
    let removed = 0;
    this.cache.forEach((entry, key) => {
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.cache.delete(key);
        removed++;
      }
    });

    if (removed > 0) {
      this.logger.info(`Cache cleanup: ${removed} expired entries removed`, {
        service: "CacheService",
      });
    }
  }

  /**
   * Dispose of the cache service and clean up resources
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.logger.info("Cache service disposed", { service: "CacheService" });
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    expired: number;
    typeDistribution: Record<string, number>;
  } {
    const now = Date.now();
    let expired = 0;
    const typeDistribution: Record<string, number> = {};

    this.cache.forEach((entry) => {
      if (entry.expiresAt && entry.expiresAt < now) {
        expired++;
      }

      const type = entry.type;
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    return {
      size: this.cache.size,
      expired,
      typeDistribution,
    };
  }
}
