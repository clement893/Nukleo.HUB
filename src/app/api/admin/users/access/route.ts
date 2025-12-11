import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "nukleo_session";

// Vérifier si l'utilisateur est admin ou super_admin
async function checkAdminAccess() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  if (!["admin", "super_admin"].includes(session.user.role)) {
    return null;
  }

  return session.user;
}

// GET - Récupérer les accès d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    let access = await prisma.userAccess.findUnique({
      where: { userId },
    });

    // Si pas d'accès défini, créer un accès par défaut (tout)
    if (!access) {
      access = await prisma.userAccess.create({
        data: {
          userId,
          clientsAccess: "all",
          projectsAccess: "all",
          spacesAccess: "all",
        },
      });
    }

    // Parser les JSON arrays
    const parsedAccess = {
      ...access,
      allowedClients: access.allowedClients ? JSON.parse(access.allowedClients) : [],
      allowedProjects: access.allowedProjects ? JSON.parse(access.allowedProjects) : [],
      allowedSpaces: access.allowedSpaces ? JSON.parse(access.allowedSpaces) : [],
    };

    return NextResponse.json({ access: parsedAccess });
  } catch (error) {
    console.error("Error fetching user access:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour les accès d'un utilisateur
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      userId, 
      clientsAccess, 
      projectsAccess, 
      spacesAccess,
      allowedClients,
      allowedProjects,
      allowedSpaces,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Seul un super_admin peut modifier les accès d'un super_admin
    if (user.role === "super_admin" && admin.role !== "super_admin") {
      return NextResponse.json({ error: "Seul un super admin peut modifier les accès d'un super admin" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (clientsAccess !== undefined) updateData.clientsAccess = clientsAccess;
    if (projectsAccess !== undefined) updateData.projectsAccess = projectsAccess;
    if (spacesAccess !== undefined) updateData.spacesAccess = spacesAccess;
    
    if (allowedClients !== undefined) {
      updateData.allowedClients = JSON.stringify(allowedClients);
    }
    if (allowedProjects !== undefined) {
      updateData.allowedProjects = JSON.stringify(allowedProjects);
    }
    if (allowedSpaces !== undefined) {
      updateData.allowedSpaces = JSON.stringify(allowedSpaces);
    }

    const access = await prisma.userAccess.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        clientsAccess: clientsAccess || "all",
        projectsAccess: projectsAccess || "all",
        spacesAccess: spacesAccess || "all",
        allowedClients: allowedClients ? JSON.stringify(allowedClients) : null,
        allowedProjects: allowedProjects ? JSON.stringify(allowedProjects) : null,
        allowedSpaces: allowedSpaces ? JSON.stringify(allowedSpaces) : null,
      },
    });

    // Parser les JSON arrays pour la réponse
    const parsedAccess = {
      ...access,
      allowedClients: access.allowedClients ? JSON.parse(access.allowedClients) : [],
      allowedProjects: access.allowedProjects ? JSON.parse(access.allowedProjects) : [],
      allowedSpaces: access.allowedSpaces ? JSON.parse(access.allowedSpaces) : [],
    };

    return NextResponse.json({ access: parsedAccess });
  } catch (error) {
    console.error("Error updating user access:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
