import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET - Récupérer les permissions de l'utilisateur connecté
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    // Récupérer tous les éléments du menu
    const allMenuItems = await prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    // Récupérer les permissions de l'utilisateur
    const userPermissions = await prisma.menuPermission.findMany({
      where: { userId: auth.id },
      select: { menuItemId: true, hasAccess: true },
    });

    // Créer un map des permissions
    const permissionsMap = new Map(
      userPermissions.map((p) => [p.menuItemId, p.hasAccess])
    );

    // Filtrer les éléments basés sur les permissions
    const accessibleItems = allMenuItems.filter((item) => {
      // Si pas de permission définie, l'accès est accordé par défaut (sauf pour les admins)
      const hasPermission = permissionsMap.get(item.id);
      return hasPermission !== false; // true ou undefined = accès accordé
    });

    return NextResponse.json({
      allItems: allMenuItems,
      accessibleItems,
      permissions: Object.fromEntries(permissionsMap),
    });
  } catch (error) {
    console.error("Error fetching menu permissions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Mettre à jour les permissions d'un utilisateur (admin only)
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  // Vérifier que l'utilisateur est admin
  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return NextResponse.json(
      { error: "Accès refusé" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, menuItemId, hasAccess } = body;

    if (!userId || !menuItemId || hasAccess === undefined) {
      return NextResponse.json(
        { error: "userId, menuItemId et hasAccess sont requis" },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour la permission
    const permission = await prisma.menuPermission.upsert({
      where: {
        userId_menuItemId: {
          userId,
          menuItemId,
        },
      },
      update: { hasAccess },
      create: { userId, menuItemId, hasAccess },
    });

    return NextResponse.json(permission);
  } catch (error) {
    console.error("Error updating menu permissions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
