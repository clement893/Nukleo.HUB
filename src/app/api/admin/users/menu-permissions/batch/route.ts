import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// POST - Mettre à jour les permissions en batch
export async function POST(_request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  // Vérifier que l'utilisateur est admin
  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, permissions } = body;

    if (!userId || !permissions || typeof permissions !== "object") {
      return NextResponse.json(
        { error: "userId et permissions sont requis" },
        { status: 400 }
      );
    }

    // Mettre à jour toutes les permissions
    const updates = await Promise.all(
      Object.entries(permissions).map(([menuItemId, hasAccess]) =>
        prisma.menuPermission.upsert({
          where: {
            userId_menuItemId: {
              userId,
              menuItemId,
            },
          },
          update: { hasAccess: hasAccess as boolean },
          create: {
            userId,
            menuItemId,
            hasAccess: hasAccess as boolean,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: updates.length,
    });
  } catch (error) {
    console.error("Error updating permissions batch:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
