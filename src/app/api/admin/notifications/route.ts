import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";

const SESSION_COOKIE_NAME = "nukleo_session";

// Vérifier l'authentification admin
async function getAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;
  if (!["admin", "super_admin"].includes(session.user.role)) return null;

  return session.user;
}

// GET - Liste des notifications (avec filtres)
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const type = searchParams.get("type");
    const isRead = searchParams.get("isRead");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (type) where.type = type;
    if (isRead !== null && isRead !== "") where.isRead = isRead === "true";

    const [notifications, total] = await Promise.all([
      prisma.employeeNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.employeeNotification.count({ where }),
    ]);

    // Récupérer les infos des employés
    const employeeIds = [...new Set(notifications.map(n => n.employeeId))];
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true, photoUrl: true },
    });

    const employeeMap = new Map(employees.map(e => [e.id, e]));

    const notificationsWithEmployee = notifications.map(n => ({
      ...n,
      employee: employeeMap.get(n.employeeId) || null,
    }));

    // Statistiques
    const stats = await prisma.employeeNotification.groupBy({
      by: ["type"],
      _count: true,
    });

    const unreadCount = await prisma.employeeNotification.count({
      where: { isRead: false },
    });

    return NextResponse.json({
      notifications: notificationsWithEmployee,
      total,
      stats,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Envoyer une notification à un ou plusieurs employés
export async function POST(_request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeIds, type, title, message, link } = body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: "Au moins un employé requis" }, { status: 400 });
    }

    if (!title || !message) {
      return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });
    }

    // Créer les notifications pour chaque employé
    const notifications = await prisma.employeeNotification.createMany({
      data: employeeIds.map((employeeId: string) => ({
        employeeId,
        type: type || "general",
        title,
        message,
        link,
      })),
    });

    return NextResponse.json({
      success: true,
      count: notifications.count,
      message: `${notifications.count} notification(s) envoyée(s)`,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer des notifications
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const employeeId = searchParams.get("employeeId");
    const olderThan = searchParams.get("olderThan"); // Nombre de jours

    if (id) {
      // Supprimer une notification spécifique
      await prisma.employeeNotification.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: "Notification supprimée" });
    }

    if (employeeId) {
      // Supprimer toutes les notifications d'un employé
      const result = await prisma.employeeNotification.deleteMany({
        where: { employeeId },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    if (olderThan) {
      // Supprimer les notifications plus anciennes que X jours
      const days = parseInt(olderThan);
      const date = new Date();
      date.setDate(date.getDate() - days);

      const result = await prisma.employeeNotification.deleteMany({
        where: { createdAt: { lt: date } },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    return NextResponse.json({ error: "Paramètre requis: id, employeeId ou olderThan" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
