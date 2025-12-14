import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les préférences de notifications
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Vérifier le portail employé
    const portal = await prisma.employeePortal.findUnique({
      where: { token },
      include: { employee: true },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé ou désactivé" }, { status: 404 });
    }

    // Récupérer ou créer les préférences
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { employeeId: portal.employeeId },
    });

    if (!preferences) {
      // Créer les préférences par défaut
      preferences = await prisma.notificationPreferences.create({
        data: {
          employeeId: portal.employeeId,
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour les préférences de notifications
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    // Vérifier le portail employé
    const portal = await prisma.employeePortal.findUnique({
      where: { token },
      include: { employee: true },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé ou désactivé" }, { status: 404 });
    }

    // Mettre à jour ou créer les préférences
    const preferences = await prisma.notificationPreferences.upsert({
      where: { employeeId: portal.employeeId },
      update: {
        timesheetApproved: body.timesheetApproved,
        timesheetRejected: body.timesheetRejected,
        taskAssigned: body.taskAssigned,
        taskUpdated: body.taskUpdated,
        requestApproved: body.requestApproved,
        requestRejected: body.requestRejected,
        generalAnnouncements: body.generalAnnouncements,
        inAppEnabled: body.inAppEnabled,
        emailEnabled: body.emailEnabled,
        emailFrequency: body.emailFrequency,
        quietHoursEnabled: body.quietHoursEnabled,
        quietHoursStart: body.quietHoursStart,
        quietHoursEnd: body.quietHoursEnd,
      },
      create: {
        employeeId: portal.employeeId,
        timesheetApproved: body.timesheetApproved ?? true,
        timesheetRejected: body.timesheetRejected ?? true,
        taskAssigned: body.taskAssigned ?? true,
        taskUpdated: body.taskUpdated ?? true,
        requestApproved: body.requestApproved ?? true,
        requestRejected: body.requestRejected ?? true,
        generalAnnouncements: body.generalAnnouncements ?? true,
        inAppEnabled: body.inAppEnabled ?? true,
        emailEnabled: body.emailEnabled ?? false,
        emailFrequency: body.emailFrequency ?? "instant",
        quietHoursEnabled: body.quietHoursEnabled ?? false,
        quietHoursStart: body.quietHoursStart,
        quietHoursEnd: body.quietHoursEnd,
      },
    });

    return NextResponse.json({ preferences, message: "Préférences mises à jour" });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
