import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET - Récupérer les permissions d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  // Vérifier que l'utilisateur est admin
  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { userId } = await params;

    const permissions = await prisma.menuPermission.findMany({
      where: { userId },
      select: { menuItemId: true, hasAccess: true },
    });

    const permissionsMap = Object.fromEntries(
      permissions.map((p) => [p.menuItemId, p.hasAccess])
    );

    return NextResponse.json({ permissions: permissionsMap });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
