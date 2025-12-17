import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

/**
 * DELETE /api/admin/api-keys/[id]
 * Supprime ou désactive une clé API
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Désactiver plutôt que supprimer (pour garder l'historique)
    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`API key deactivated: ${apiKey.name}`, "ADMIN_API_KEYS", {
      apiKeyId: id,
      deactivatedBy: auth.id,
    });

    return NextResponse.json({ success: true, message: "Clé API désactivée" });
  } catch (error) {
    logger.error("Error deactivating API key", error as Error, "ADMIN_API_KEYS");
    return NextResponse.json(
      { error: "Erreur lors de la désactivation de la clé API" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/api-keys/[id]
 * Met à jour une clé API (active/désactive, change la limite, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive, rateLimit } = body;

    const updateData: Record<string, unknown> = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (typeof rateLimit === "number" && rateLimit > 0) {
      updateData.rateLimit = Math.min(100000, rateLimit);
    }

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    logger.info(`API key updated: ${apiKey.name}`, "ADMIN_API_KEYS", {
      apiKeyId: id,
      updatedBy: auth.id,
    });

    return NextResponse.json(apiKey);
  } catch (error) {
    logger.error("Error updating API key", error as Error, "ADMIN_API_KEYS");
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la clé API" },
      { status: 500 }
    );
  }
}

