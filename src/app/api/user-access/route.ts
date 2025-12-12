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
    // Récupérer les permissions d'accès de l'utilisateur
    let userAccess = await prisma.userAccess.findUnique({
      where: { userId: auth.id },
    });

    // Si pas d'accès défini, créer un accès par défaut (tout)
    if (!userAccess) {
      userAccess = await prisma.userAccess.create({
        data: {
          userId: auth.id,
          clientsAccess: "all",
          projectsAccess: "all",
          spacesAccess: "all",
        },
      });
    }

    // Parser les JSON arrays
    const parsedAccess = {
      ...userAccess,
      allowedClients: userAccess.allowedClients ? JSON.parse(userAccess.allowedClients) : [],
      allowedProjects: userAccess.allowedProjects ? JSON.parse(userAccess.allowedProjects) : [],
      allowedSpaces: userAccess.allowedSpaces ? JSON.parse(userAccess.allowedSpaces) : [],
    };

    return NextResponse.json({
      access: parsedAccess,
    });
  } catch (error) {
    console.error("Error fetching user access:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
