import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * CSRF Protection pour Next.js
 * Protège contre les attaques Cross-Site Request Forgery
 */

// Store en mémoire pour les tokens CSRF (en production, utiliser Redis)
const csrfTokens = new Map<string, { token: string; createdAt: number; used: boolean }>();

// Nettoyer les tokens expirés toutes les heures
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures

    for (const [key, entry] of csrfTokens.entries()) {
      if (now - entry.createdAt > maxAge) {
        csrfTokens.delete(key);
      }
    }
  }, 60 * 60 * 1000);
}

/**
 * Génère un token CSRF unique
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Stocke un token CSRF pour une session
 */
export function storeCsrfToken(sessionId: string): string {
  const token = generateCsrfToken();

  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now(),
    used: false,
  });

  return token;
}

/**
 * Vérifie un token CSRF
 * @param sessionId - ID de la session
 * @param token - Token à vérifier
 * @param consumeToken - Si true, le token sera marqué comme utilisé
 */
export function verifyCsrfToken(
  sessionId: string,
  token: string,
  consumeToken: boolean = true
): boolean {
  const entry = csrfTokens.get(sessionId);

  if (!entry) {
    return false;
  }

  // Vérifier que le token correspond
  if (entry.token !== token) {
    return false;
  }

  // Vérifier que le token n'a pas déjà été utilisé
  if (entry.used) {
    return false;
  }

  // Marquer le token comme utilisé si demandé
  if (consumeToken) {
    entry.used = true;
  }

  return true;
}

/**
 * Invalide un token CSRF
 */
export function invalidateCsrfToken(sessionId: string): void {
  csrfTokens.delete(sessionId);
}

/**
 * Middleware pour vérifier le token CSRF dans les routes API Next.js
 * À utiliser sur les routes POST, PATCH, DELETE
 */
export function verifyCsrfMiddleware(
  request: NextRequest,
  sessionId: string
): { valid: boolean; error?: string } {
  // Les requêtes GET, HEAD, OPTIONS n'ont pas besoin de CSRF
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  // Récupérer le token CSRF depuis les headers
  const headerToken = request.headers.get("x-csrf-token");

  if (!headerToken) {
    return {
      valid: false,
      error: "Missing CSRF token",
    };
  }

  // Vérifier le token
  if (!verifyCsrfToken(sessionId, headerToken)) {
    return {
      valid: false,
      error: "Invalid CSRF token",
    };
  }

  return { valid: true };
}

/**
 * Retourne une réponse d'erreur CSRF
 */
export function csrfErrorResponse(message: string = "CSRF validation failed"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Génère un nouveau token CSRF et le retourne dans la réponse
 */
export function withCsrfToken(
  response: NextResponse,
  sessionId: string
): NextResponse {
  const token = storeCsrfToken(sessionId);
  response.headers.set("x-csrf-token", token);
  return response;
}
