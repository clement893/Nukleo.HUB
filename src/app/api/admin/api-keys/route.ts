import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { createHash, randomBytes } from "crypto";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/api-keys
 * Liste toutes les clés API
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        rateLimit: true,
        createdAt: true,
        createdBy: true,
      },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    logger.error("Error fetching API keys", error as Error, "ADMIN_API_KEYS");
    return NextResponse.json(
      { error: "Erreur lors de la récupération des clés API" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/api-keys
 * Crée une nouvelle clé API
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const {
      name,
      expiresInDays,
      rateLimit = 1000,
      allowedIps,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom de la clé est requis" },
        { status: 400 }
      );
    }

    // Générer la clé API
    const randomPart = randomBytes(32).toString("hex");
    const prefix = "nk_";
    const key = `${prefix}${randomPart}`;
    const hashedKey = createHash("sha256").update(key).digest("hex");
    const keyPrefix = `${prefix}${randomPart.substring(0, 8)}...`;

    // Calculer la date d'expiration
    let expiresAt: Date | null = null;
    if (expiresInDays && typeof expiresInDays === "number" && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Parser les IPs autorisées
    let allowedIpsJson: string | null = null;
    if (allowedIps && Array.isArray(allowedIps) && allowedIps.length > 0) {
      allowedIpsJson = JSON.stringify(allowedIps);
    }

    // Créer la clé dans la base de données
    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: hashedKey,
        keyPrefix,
        isActive: true,
        expiresAt,
        allowedIps: allowedIpsJson,
        rateLimit: Math.max(1, Math.min(100000, rateLimit)), // Entre 1 et 100000
        createdBy: auth.id,
      },
    });

    logger.info(`API key created: ${apiKey.name}`, "ADMIN_API_KEYS", {
      apiKeyId: apiKey.id,
      createdBy: auth.id,
    });

    // Retourner la clé complète (seulement à la création)
    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key, // La clé complète (à copier immédiatement)
      keyPrefix: apiKey.keyPrefix,
      rateLimit: apiKey.rateLimit,
      expiresAt: apiKey.expiresAt,
      allowedIps: allowedIpsJson ? JSON.parse(allowedIpsJson) : null,
      createdAt: apiKey.createdAt,
      warning: "⚠️ IMPORTANT: Copiez cette clé maintenant, elle ne sera plus affichée!",
    }, { status: 201 });
  } catch (error) {
    logger.error("Error creating API key", error as Error, "ADMIN_API_KEYS");
    return NextResponse.json(
      { error: "Erreur lors de la création de la clé API" },
      { status: 500 }
    );
  }
}

