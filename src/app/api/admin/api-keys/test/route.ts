import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { createHash } from "crypto";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/api-keys/test
 * Teste une clé API et retourne son hash et son statut dans la base de données
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "Clé API requise" },
        { status: 400 }
      );
    }

    // Hash la clé
    const hashedKey = createHash("sha256").update(apiKey).digest("hex");
    const keyPrefix = apiKey.substring(0, 11);

    // Chercher dans la base de données
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        expiresAt: true,
        allowedIps: true,
        allowedEndpoints: true,
        rateLimit: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    // Chercher aussi par préfixe pour voir si d'autres clés existent avec ce préfixe
    const keysWithPrefix = await prisma.apiKey.findMany({
      where: {
        keyPrefix: {
          startsWith: keyPrefix.substring(0, 8), // Les 8 premiers caractères après "nk_"
        },
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        prefix: keyPrefix,
        hash: hashedKey,
        hashPreview: `${hashedKey.substring(0, 16)}...`,
      },
      found: !!keyRecord,
      keyRecord: keyRecord
        ? {
            id: keyRecord.id,
            name: keyRecord.name,
            keyPrefix: keyRecord.keyPrefix,
            isActive: keyRecord.isActive,
            expiresAt: keyRecord.expiresAt,
            allowedIps: keyRecord.allowedIps,
            allowedEndpoints: keyRecord.allowedEndpoints,
            rateLimit: keyRecord.rateLimit,
            lastUsedAt: keyRecord.lastUsedAt,
            createdAt: keyRecord.createdAt,
          }
        : null,
      keysWithSimilarPrefix: keysWithPrefix,
    });
  } catch (error) {
    logger.error("Error testing API key", error as Error, "ADMIN_API_KEYS");
    return NextResponse.json(
      { error: "Erreur lors du test de la clé API" },
      { status: 500 }
    );
  }
}

