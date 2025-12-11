import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store en mémoire pour le rate limiting (en production, utiliser Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Nettoyer les entrées expirées toutes les minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

interface RateLimitConfig {
  maxRequests: number;  // Nombre max de requêtes
  windowMs: number;     // Fenêtre de temps en millisecondes
}

/**
 * Rate limiter simple basé sur l'IP
 * @param identifier - Identifiant unique (IP, userId, etc.)
 * @param config - Configuration du rate limit
 * @returns true si la requête est autorisée, false sinon
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Nouvelle fenêtre
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
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
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Middleware de rate limiting pour les API routes
 */
export function rateLimitMiddleware(
  request: Request,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): NextResponse | null {
  // Extraire l'IP depuis les headers
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  
  const result = checkRateLimit(ip, config);
  
  if (!result.allowed) {
    return NextResponse.json(
      { 
        error: "Trop de requêtes. Veuillez réessayer plus tard.",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      { 
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetTime),
        },
      }
    );
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
