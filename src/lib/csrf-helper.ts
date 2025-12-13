/**
 * Helper pour faciliter l'utilisation de la protection CSRF dans les routes API
 * 
 * NOTE: Avec Next.js et les cookies httpOnly + sameSite: "lax",
 * la protection CSRF est déjà assez bonne. Cette helper permet
 * d'ajouter une couche supplémentaire si nécessaire.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { verifyCsrfMiddleware, csrfErrorResponse } from "@/lib/csrf";

/**
 * Middleware pour vérifier le CSRF sur les mutations (POST, PATCH, DELETE)
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfCheck = await checkCSRF(request);
 *   if (csrfCheck) return csrfCheck;
 *   // ... reste du code
 * }
 * ```
 */
export async function checkCSRF(request: NextRequest): Promise<NextResponse | null> {
  // Les requêtes GET, HEAD, OPTIONS n'ont pas besoin de CSRF
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return null;
  }

  // Récupérer l'utilisateur pour obtenir son ID de session
  const user = await getAuthUser();
  if (!user) {
    // Si pas d'utilisateur, l'authentification échouera de toute façon
    return null;
  }

  // Utiliser l'ID utilisateur comme identifiant de session pour CSRF
  const sessionId = user.id;

  // Vérifier le token CSRF
  const csrfResult = verifyCsrfMiddleware(request, sessionId);
  if (!csrfResult.valid) {
    return csrfErrorResponse(csrfResult.error || "CSRF validation failed");
  }

  return null; // CSRF valide
}

/**
 * Note: Pour une protection CSRF complète, il faudrait:
 * 1. Générer un token CSRF lors de la connexion
 * 2. Le stocker dans un cookie séparé (non httpOnly)
 * 3. Le renvoyer dans les headers X-CSRF-Token pour les mutations
 * 4. Vérifier que le token du cookie correspond au token du header
 * 
 * Cependant, avec Next.js et sameSite: "lax", la protection est déjà bonne
 * pour la plupart des cas d'usage. Cette implémentation est optionnelle.
 */
