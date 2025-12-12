import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET - Récupérer les permissions d'accès de l'utilisateur connecté
export async function GET() {
  const auth = await requireAuth();
  if (!auth || typeof auth === "object" && "status" in auth) {
    return NextResponse.json({ access: null }, { status: 401 });
  }

  try {
    // Récupérer l'utilisateur avec son employé lié
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: {
        employee: {
          include: {
            access: true,
            leoContext: true,
          },
        },
      },
    });

    if (!user || !user.employee) {
      return NextResponse.json({ access: null });
    }

    // Retourner les permissions d'accès de l'employé
    return NextResponse.json({
      access: user.employee.access,
      leoContext: user.employee.leoContext,
    });
  } catch (error) {
    console.error("Error fetching user access:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
