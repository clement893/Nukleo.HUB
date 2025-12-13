/**
 * Client Redis pour cache distribué
 * Fallback vers cache mémoire si Redis n'est pas disponible
 */

import Redis from "ioredis";
import { cache as memoryCache } from "./cache";

let redisClient: Redis | null = null;
let isRedisAvailable = false;

// Initialiser Redis si disponible
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on("error", (error) => {
      console.error("Redis connection error:", error);
      isRedisAvailable = false;
    });

    redisClient.on("connect", () => {
      isRedisAvailable = true;
      console.log("Redis connected successfully");
    });

    // Connecter au démarrage
    redisClient.connect().catch(() => {
      isRedisAvailable = false;
    });
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
    isRedisAvailable = false;
  }
}

/**
 * Cache distribué avec fallback mémoire
 */
export const distributedCache = {
  /**
   * Récupérer une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (isRedisAvailable && redisClient) {
      try {
        const value = await redisClient.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      } catch (error) {
        console.error("Redis get error:", error);
        // Fallback vers mémoire
        return memoryCache.get<T>(key);
      }
    }
    // Fallback vers mémoire
    return memoryCache.get<T>(key);
  },

  /**
   * Stocker une valeur dans le cache
   */
  async set<T>(key: string, data: T, ttlSeconds: number = 60): Promise<void> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(data));
        // Aussi mettre en cache mémoire pour accès local rapide
        memoryCache.set(key, data, ttlSeconds);
        return;
      } catch (error) {
        console.error("Redis set error:", error);
        // Fallback vers mémoire
        memoryCache.set(key, data, ttlSeconds);
      }
    } else {
      // Fallback vers mémoire
      memoryCache.set(key, data, ttlSeconds);
    }
  },

  /**
   * Supprimer une entrée du cache
   */
  async delete(key: string): Promise<boolean> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.del(key);
        memoryCache.delete(key);
        return true;
      } catch (error) {
        console.error("Redis delete error:", error);
        return memoryCache.delete(key);
      }
    }
    return memoryCache.delete(key);
  },

  /**
   * Invalider toutes les entrées correspondant à un pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let count = 0;
    
    if (isRedisAvailable && redisClient) {
      try {
        const keys = await redisClient.keys(pattern.replace(/\*/g, "*"));
        if (keys.length > 0) {
          await redisClient.del(...keys);
          count = keys.length;
        }
      } catch (error) {
        console.error("Redis invalidatePattern error:", error);
      }
    }
    
    // Toujours invalider le cache mémoire aussi
    count += memoryCache.invalidatePattern(pattern);
    return count;
  },

  /**
   * Vider tout le cache
   */
  async clear(): Promise<void> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.flushdb();
      } catch (error) {
        console.error("Redis clear error:", error);
      }
    }
    memoryCache.clear();
  },

  /**
   * Vérifier si Redis est disponible
   */
  isRedisAvailable(): boolean {
    return isRedisAvailable;
  },
};

// Fermer la connexion Redis à l'arrêt
if (redisClient) {
  process.on("SIGTERM", () => {
    redisClient?.disconnect();
  });
  
  process.on("SIGINT", () => {
    redisClient?.disconnect();
  });
}

export default distributedCache;
