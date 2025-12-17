import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cache, CACHE_TTL } from "@/lib/cache";
import { createHash } from "crypto";

const SESSION_COOKIE_NAME = "nukleo_session";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  role: string;
}

/**
 * Récupère l'utilisateur authentifié à partir du cookie de session
 * @returns L'utilisateur authentifié ou null
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    // Cache de courte durée pour éviter les requêtes répétées
    const cacheKey = `auth:user:${sessionToken}`;
    const cached = cache.get<AuthUser>(cacheKey);
    if (cached) {
      return cached;
    }

    // Optimisation: utiliser select au lieu de include
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      select: {
        id: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            photoUrl: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }

    if (!session.user.isActive) {
      return null;
    }

    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      photoUrl: session.user.photoUrl,
      role: session.user.role,
    };

    // Mettre en cache pour 30 secondes (sécurité)
    cache.set(cacheKey, user, CACHE_TTL.SHORT);

    return user;
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}

/**
 * Vérifie que l'utilisateur est authentifié
 * @returns L'utilisateur ou une réponse d'erreur 401
 */
export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorisé. Veuillez vous connecter." },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Vérifie que l'utilisateur est admin ou super_admin
 * @returns L'utilisateur admin ou une réponse d'erreur
 */
export async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorisé. Veuillez vous connecter." },
      { status: 401 }
    );
  }
  if (!["admin", "super_admin"].includes(user.role)) {
    return NextResponse.json(
      { error: "Accès refusé. Droits administrateur requis." },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Vérifie que l'utilisateur est super_admin
 * @returns L'utilisateur super_admin ou une réponse d'erreur
 */
export async function requireSuperAdmin(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorisé. Veuillez vous connecter." },
      { status: 401 }
    );
  }
  if (user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Accès refusé. Droits super administrateur requis." },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Helper pour vérifier si le résultat est une réponse d'erreur
 */
export function isErrorResponse(result: AuthUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Hash une clé API pour le stockage
 */
function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Vérifie une clé API depuis les headers de la requête
 * @param request La requête Next.js
 * @returns L'objet ApiKey si valide, null sinon
 */
export async function verifyApiKey(request: NextRequest): Promise<{ id: string; name: string; rateLimit: number } | null> {
  try {
    // Chercher la clé dans le header Authorization: Bearer <key>
    const authHeader = request.headers.get("authorization");
    let apiKey: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    } else {
      // Fallback: chercher dans le header X-API-Key
      apiKey = request.headers.get("x-api-key");
    }

    if (!apiKey) {
      return null;
    }

    // Hash la clé pour la recherche
    const hashedKey = hashApiKey(apiKey);

    // Récupérer le chemin de la requête pour vérifier les endpoints autorisés
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Cache de courte durée (inclure le pathname pour éviter les conflits)
    const cacheKey = `api_key:${hashedKey}:${pathname}`;
    const cached = cache.get<{ id: string; name: string; rateLimit: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Chercher la clé dans la base de données
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      select: {
        id: true,
        name: true,
        isActive: true,
        expiresAt: true,
        allowedIps: true,
        allowedEndpoints: true,
        rateLimit: true,
      },
    });

    if (!keyRecord || !keyRecord.isActive) {
      return null;
    }

    // Vérifier l'expiration
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return null;
    }

    // Vérifier l'IP si restreinte
    if (keyRecord.allowedIps) {
      const allowedIps = JSON.parse(keyRecord.allowedIps) as string[];
      const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                      request.headers.get("x-real-ip") ||
                      "unknown";
      
      if (!allowedIps.includes(clientIp)) {
        return null;
      }
    }

    // Vérifier les endpoints autorisés
    if (keyRecord.allowedEndpoints) {
      const allowedEndpoints = JSON.parse(keyRecord.allowedEndpoints) as string[];
      // Vérifier si le chemin correspond à un des endpoints autorisés
      const isAllowed = allowedEndpoints.some(endpoint => {
        const trimmedEndpoint = endpoint.trim();
        // Support des patterns avec wildcard comme "/api/public/*"
        if (trimmedEndpoint.endsWith("*")) {
          const basePath = trimmedEndpoint.slice(0, -1);
          return pathname.startsWith(basePath);
        }
        // Correspondance exacte ou sous-chemin
        return pathname === trimmedEndpoint || pathname.startsWith(trimmedEndpoint + "/");
      });
      
      if (!isAllowed) {
        return null;
      }
    }

    // Mettre à jour lastUsedAt (de manière asynchrone pour ne pas bloquer)
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    const result = {
      id: keyRecord.id,
      name: keyRecord.name,
      rateLimit: keyRecord.rateLimit,
    };

    // Mettre en cache pour 5 minutes
    cache.set(cacheKey, result, CACHE_TTL.MEDIUM);

    return result;
  } catch (error) {
    console.error("Error verifying API key:", error);
    return null;
  }
}

/**
 * Requiert une clé API valide
 * @param request La requête Next.js
 * @returns L'objet ApiKey ou une réponse d'erreur 401
 */
export async function requireApiKey(request: NextRequest): Promise<{ id: string; name: string; rateLimit: number } | NextResponse> {
  const apiKey = await verifyApiKey(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante. Veuillez fournir une clé API valide dans le header Authorization: Bearer <key> ou X-API-Key." },
      { status: 401 }
    );
  }
  return apiKey;
}
