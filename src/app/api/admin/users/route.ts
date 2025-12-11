import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "nukleo_session";

// Vérifier si l'utilisateur est admin ou super_admin
async function checkAdminAccess() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

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

// GET - Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [
        { role: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        email: true,
        name: true,
        photoUrl: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users, currentUserRole: admin.role });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un utilisateur (legacy, gardé pour compatibilité)
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.role || "user",
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// PATCH - Modifier un utilisateur (rôle, statut actif)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    // Récupérer l'utilisateur cible
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Seul un super_admin peut modifier un autre super_admin ou promouvoir quelqu'un en super_admin
    if (targetUser.role === "super_admin" && admin.role !== "super_admin") {
      return NextResponse.json({ error: "Seul un super admin peut modifier un super admin" }, { status: 403 });
    }

    if (role === "super_admin" && admin.role !== "super_admin") {
      return NextResponse.json({ error: "Seul un super admin peut promouvoir en super admin" }, { status: 403 });
    }

    // Empêcher de se désactiver soi-même
    if (userId === admin.id && isActive === false) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous désactiver vous-même" }, { status: 400 });
    }

    // Empêcher de se rétrograder soi-même
    if (userId === admin.id && role && role !== admin.role) {
      return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre rôle" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        photoUrl: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request: NextRequest) {
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

    // Récupérer l'utilisateur cible
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Seul un super_admin peut supprimer un super_admin
    if (targetUser.role === "super_admin" && admin.role !== "super_admin") {
      return NextResponse.json({ error: "Seul un super admin peut supprimer un super admin" }, { status: 403 });
    }

    // Empêcher de se supprimer soi-même
    if (userId === admin.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous supprimer vous-même" }, { status: 400 });
    }

    // Supprimer les sessions de l'utilisateur d'abord
    await prisma.session.deleteMany({ where: { userId } });

    // Supprimer l'utilisateur
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
