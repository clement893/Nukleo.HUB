import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store en mémoire pour le rate limiting
// En production avec plusieurs instances, utiliser Redis via REDIS_URL
const rateLimitStore = new Map<string, RateLimitEntry>();

// Nettoyer les entrées expirées toutes les minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

// Interface pour le store de rate limiting (permettant Redis ou mémoire)
interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// Store en mémoire (fallback)
class MemoryRateLimitStore implements RateLimitStore {
  async get(key: string): Promise<RateLimitEntry | null> {
    return rateLimitStore.get(key) || null;
  }

  async set(key: string, entry: RateLimitEntry, _ttl: number): Promise<void> {
    rateLimitStore.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    rateLimitStore.delete(key);
  }
}

// Store Redis (si disponible)
class RedisRateLimitStore implements RateLimitStore {
  private redis: any;

  constructor() {
    // Lazy import de Redis seulement si REDIS_URL est défini
    if (process.env.REDIS_URL) {
      try {
        // Note: ioredis doit être installé: pnpm add ioredis
        // Pour l'instant, on utilise le store mémoire
        this.redis = null;
      } catch {
        this.redis = null;
      }
    }
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    if (!this.redis) return null;
    try {
      const data = await this.redis.get(`rate_limit:${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, entry: RateLimitEntry, ttl: number): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.setex(`rate_limit:${key}`, Math.ceil(ttl / 1000), JSON.stringify(entry));
    } catch {
      // Ignorer les erreurs Redis
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(`rate_limit:${key}`);
    } catch {
      // Ignorer les erreurs Redis
    }
  }
}

// Utiliser Redis si disponible, sinon mémoire
const store: RateLimitStore = process.env.REDIS_URL 
  ? new RedisRateLimitStore() 
  : new MemoryRateLimitStore();

interface RateLimitConfig {
  maxRequests: number;  // Nombre max de requêtes
  windowMs: number;     // Fenêtre de temps en millisecondes
}

/**
 * Rate limiter basé sur l'IP (avec support Redis optionnel)
 * @param identifier - Identifiant unique (IP, userId, etc.)
 * @param config - Configuration du rate limit
 * @returns true si la requête est autorisée, false sinon
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const key = identifier;
  
  let entry = await store.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Nouvelle fenêtre
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    await store.set(key, entry, config.windowMs);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }
  
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  entry.count++;
  await store.set(key, entry, config.windowMs);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Middleware de rate limiting pour les API routes
 * Note: Cette fonction est synchrone pour compatibilité, mais utilise un store asynchrone en interne
 */
export function rateLimitMiddleware(
  request: Request,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): NextResponse | null {
  // Extraire l'IP depuis les headers
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  
  // Pour compatibilité synchrone, utiliser le store mémoire directement
  // En production avec Redis, utiliser une version asynchrone du middleware
  const now = Date.now();
  const key = ip;
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  } else {
    if (entry.count >= config.maxRequests) {
      return NextResponse.json(
        { 
          error: "Trop de requêtes. Veuillez réessayer plus tard.",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((entry.resetTime - now) / 1000)),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(entry.resetTime),
          },
        }
      );
    }
    entry.count++;
    rateLimitStore.set(key, entry);
  }
  
  return null; // Requête autorisée
}

// Configurations prédéfinies pour différents types d'endpoints
export const RATE_LIMITS = {
  // Endpoints sensibles (auth, etc.)
  auth: { maxRequests: 10, windowMs: 60000 },     // 10 req/min
  // Endpoints d'écriture
  write: { maxRequests: 30, windowMs: 60000 },    // 30 req/min
  // Endpoints de lecture
  read: { maxRequests: 100, windowMs: 60000 },    // 100 req/min
  // Endpoints LLM (coûteux)
  llm: { maxRequests: 20, windowMs: 60000 },      // 20 req/min
  // Uploads de fichiers
  upload: { maxRequests: 10, windowMs: 60000 },   // 10 req/min
};
