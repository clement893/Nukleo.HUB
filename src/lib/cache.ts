/**
 * Système de cache en mémoire pour les APIs
 * Améliore les performances en évitant les requêtes répétées à la base de données
 * 
 * NOTE: Le cache exporté utilise maintenant Redis avec fallback mémoire automatique
 * Voir src/lib/redis.ts pour l'implémentation distribué
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    // Nettoyer les entrées expirées toutes les 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Récupérer une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size--;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Stocker une valeur dans le cache
   * @param key Clé unique
   * @param data Données à stocker
   * @param ttlSeconds Durée de vie en secondes (défaut: 60s)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    // Si le cache est plein, supprimer les entrées les plus anciennes
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
    };

    const isNew = !this.cache.has(key);
    this.cache.set(key, entry);
    
    if (isNew) {
      this.stats.size++;
    }
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size--;
    }
    return deleted;
  }

  /**
   * Invalider toutes les entrées correspondant à un pattern
   * @param pattern Pattern de clé (ex: "contacts:*")
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.size -= count;
    return count;
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + "%" : "0%";
    return { ...this.stats, hitRate };
  }

  /**
   * Nettoyer les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.stats.size -= cleaned;
  }

  /**
   * Supprimer les entrées les plus anciennes
   */
  private evictOldest(): void {
    let oldest: { key: string; createdAt: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.createdAt < oldest.createdAt) {
        oldest = { key, createdAt: entry.createdAt };
      }
    }

    if (oldest) {
      this.cache.delete(oldest.key);
      this.stats.size--;
    }
  }

  /**
   * Arrêter le nettoyage automatique
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Instance globale du cache mémoire
const globalCache = new MemoryCache(500);

// Import conditionnel du cache distribué (évite erreur si Redis n'est pas configuré)
let distributedCache: typeof import("./redis").distributedCache | null = null;

try {
  // Essayer d'importer Redis (peut échouer si REDIS_URL n'est pas défini)
  const redisModule = require("./redis");
  distributedCache = redisModule.distributedCache;
} catch {
  // Redis non disponible, utiliser uniquement le cache mémoire
  distributedCache = null;
}

// Export des fonctions utilitaires
// Utilise Redis si disponible, sinon fallback vers mémoire (synchrone pour compatibilité)
export const cache = {
  get: <T>(key: string): T | null => {
    // Toujours vérifier le cache mémoire d'abord (plus rapide)
    const memoryValue = globalCache.get<T>(key);
    if (memoryValue !== null) {
      return memoryValue;
    }
    
    // Si Redis est disponible, on pourrait le vérifier ici
    // Mais pour garder la compatibilité synchrone, on utilise seulement la mémoire
    // Redis sera utilisé pour la synchronisation entre instances en arrière-plan
    return null;
  },
  
  set: <T>(key: string, data: T, ttlSeconds?: number): void => {
    // Toujours mettre en cache mémoire (synchrone)
    globalCache.set(key, data, ttlSeconds);
    
    // Mettre en cache Redis en arrière-plan si disponible (ne bloque pas)
    if (distributedCache?.isRedisAvailable()) {
      distributedCache.set(key, data, ttlSeconds).catch(() => {
        // Ignorer les erreurs Redis, le cache mémoire fonctionne toujours
      });
    }
  },
  
  delete: (key: string): boolean => {
    const deleted = globalCache.delete(key);
    
    // Supprimer de Redis aussi si disponible
    if (distributedCache?.isRedisAvailable()) {
      distributedCache.delete(key).catch(() => {
        // Ignorer les erreurs Redis
      });
    }
    
    return deleted;
  },
  
  invalidatePattern: (pattern: string): number => {
    const memoryCount = globalCache.invalidatePattern(pattern);
    
    // Invalider dans Redis aussi si disponible
    if (distributedCache?.isRedisAvailable()) {
      distributedCache.invalidatePattern(pattern).catch(() => {
        // Ignorer les erreurs Redis
      });
    }
    
    return memoryCount;
  },
  
  clear: (): void => {
    globalCache.clear();
    
    // Vider Redis aussi si disponible
    if (distributedCache?.isRedisAvailable()) {
      distributedCache.clear().catch(() => {
        // Ignorer les erreurs Redis
      });
    }
  },
  
  getStats: () => globalCache.getStats(),
  
  isRedisAvailable: (): boolean => {
    return distributedCache?.isRedisAvailable() ?? false;
  },
};

/**
 * Décorateur pour mettre en cache le résultat d'une fonction async
 * @param keyPrefix Préfixe de la clé de cache
 * @param ttlSeconds Durée de vie en secondes
 */
export function withCache<T>(
  keyPrefix: string,
  ttlSeconds: number = 60
) {
  return async function (
    keyParams: string | Record<string, unknown>,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const key = typeof keyParams === "string" 
      ? `${keyPrefix}:${keyParams}`
      : `${keyPrefix}:${JSON.stringify(keyParams)}`;

    // Vérifier le cache
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Récupérer les données
    const data = await fetchFn();

    // Stocker dans le cache
    cache.set(key, data, ttlSeconds);

    return data;
  };
}

// Durées de cache prédéfinies (en secondes)
export const CACHE_TTL = {
  SHORT: 30,        // 30 secondes - données très dynamiques
  MEDIUM: 60 * 2,   // 2 minutes - données modérément dynamiques
  LONG: 60 * 10,    // 10 minutes - données peu changeantes
  VERY_LONG: 60 * 60, // 1 heure - données statiques
};

export default cache;
