import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getEmployeeFromToken(token: string) {
  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });
  if (!portal || !portal.isActive) return null;
  return portal.employee;
}

// GET - Récupérer les notifications de l'employé
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const employee = await getEmployeeFromToken(token);
    if (!employee) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { employeeId: employee.id };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.employeeNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Compter les non lues
    const unreadCount = await prisma.employeeNotification.count({
      where: {
        employeeId: employee.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Marquer des notifications comme lues
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const employee = await getEmployeeFromToken(token);
    if (!employee) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Marquer toutes les notifications comme lues
      await prisma.employeeNotification.updateMany({
        where: {
          employeeId: employee.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } else if (notificationIds && notificationIds.length > 0) {
      // Marquer des notifications spécifiques comme lues
      await prisma.employeeNotification.updateMany({
        where: {
          id: { in: notificationIds },
          employeeId: employee.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    // Retourner le nouveau compte de non lues
    const unreadCount = await prisma.employeeNotification.count({
      where: {
        employeeId: employee.id,
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const employee = await getEmployeeFromToken(token);
    if (!employee) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Vérifier que la notification appartient à l'employé
    const notification = await prisma.employeeNotification.findFirst({
      where: {
        id: notificationId,
        employeeId: employee.id,
      },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 });
    }

    await prisma.employeeNotification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
