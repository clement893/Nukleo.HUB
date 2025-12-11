import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// GET - Récupérer toutes les feuilles de temps (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // draft, submitted, approved, rejected
    const employeeId = searchParams.get("employeeId");
    const weekStart = searchParams.get("weekStart");

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (weekStart) {
      where.weekStartDate = new Date(weekStart);
    }

    const timesheets = await prisma.weeklyTimesheet.findMany({
      where,
      orderBy: [
        { status: "asc" }, // submitted en premier
        { weekStartDate: "desc" },
      ],
      include: {
        entries: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    // Récupérer les infos des employés
    const employeeIds = [...new Set(timesheets.map(t => t.employeeId))];
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        name: true,
        email: true,
        photoUrl: true,
        department: true,
      },
    });

    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Enrichir les feuilles de temps avec les infos employé
    const enrichedTimesheets = timesheets.map(t => ({
      ...t,
      employee: employeeMap.get(t.employeeId) || null,
    }));

    // Statistiques
    const stats = {
      total: timesheets.length,
      draft: timesheets.filter(t => t.status === "draft").length,
      submitted: timesheets.filter(t => t.status === "submitted").length,
      approved: timesheets.filter(t => t.status === "approved").length,
      rejected: timesheets.filter(t => t.status === "rejected").length,
      totalHours: timesheets.reduce((sum, t) => sum + t.totalHours, 0),
    };

    return NextResponse.json({ timesheets: enrichedTimesheets, stats, employees });
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Approuver ou rejeter une feuille de temps
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timesheetId, action, adminName, adminNotes, rejectionReason } = body;

    if (!timesheetId || !action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const timesheet = await prisma.weeklyTimesheet.findUnique({
      where: { id: timesheetId },
    });

    if (!timesheet) {
      return NextResponse.json({ error: "Feuille de temps non trouvée" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    if (action === "approve") {
      updateData = {
        status: "approved",
        approvedAt: new Date(),
        approverName: adminName || "Admin",
        adminNotes,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      };
    } else if (action === "reject") {
      updateData = {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: adminName || "Admin",
        rejectionReason,
        adminNotes,
        approvedAt: null,
        approvedBy: null,
        approverName: null,
      };
    } else if (action === "reset") {
      // Remettre en brouillon
      updateData = {
        status: "draft",
        submittedAt: null,
        approvedAt: null,
        approvedBy: null,
        approverName: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      };
    } else {
      return NextResponse.json({ error: "Action non valide" }, { status: 400 });
    }

    const updatedTimesheet = await prisma.weeklyTimesheet.update({
      where: { id: timesheetId },
      data: updateData,
      include: {
        entries: true,
      },
    });

    // Créer une notification pour l'employé
    const weekStartFormatted = new Date(updatedTimesheet.weekStartDate).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "short",
    });

    if (action === "approve") {
      await createNotification({
        employeeId: updatedTimesheet.employeeId,
        type: "timesheet_approved",
        title: "Feuille de temps approuvée",
        message: `Votre feuille de temps de la semaine du ${weekStartFormatted} a été approuvée par ${adminName || "Admin"}.`,
        link: "/timesheets",
        metadata: { timesheetId, weekStart: updatedTimesheet.weekStartDate },
      });
    } else if (action === "reject") {
      await createNotification({
        employeeId: updatedTimesheet.employeeId,
        type: "timesheet_rejected",
        title: "Feuille de temps rejetée",
        message: `Votre feuille de temps de la semaine du ${weekStartFormatted} a été rejetée. Raison: ${rejectionReason || "Non spécifiée"}`,
        link: "/timesheets",
        metadata: { timesheetId, weekStart: updatedTimesheet.weekStartDate, reason: rejectionReason },
      });
    }

    return NextResponse.json(updatedTimesheet);
  } catch (error) {
    console.error("Error updating timesheet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Modifier une entrée de temps (admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, ...updateData } = body;

    if (!entryId) {
      return NextResponse.json({ error: "ID de l'entrée requis" }, { status: 400 });
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        description: updateData.description,
        startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
        endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
        duration: updateData.duration,
        billable: updateData.billable,
        notes: updateData.notes,
        projectId: updateData.projectId,
        taskId: updateData.taskId,
      },
    });

    // Recalculer le total de la feuille de temps si elle existe
    if (updatedEntry.timesheetId) {
      const entries = await prisma.timeEntry.findMany({
        where: { timesheetId: updatedEntry.timesheetId },
      });
      const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
      const totalHours = Math.round(totalMinutes / 6) / 10;

      await prisma.weeklyTimesheet.update({
        where: { id: updatedEntry.timesheetId },
        data: { totalHours },
      });
    }

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une entrée de temps (admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json({ error: "ID de l'entrée requis" }, { status: 400 });
    }

    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entrée non trouvée" }, { status: 404 });
    }

    const timesheetId = entry.timesheetId;

    await prisma.timeEntry.delete({
      where: { id: entryId },
    });

    // Recalculer le total de la feuille de temps si elle existe
    if (timesheetId) {
      const entries = await prisma.timeEntry.findMany({
        where: { timesheetId },
      });
      const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
      const totalHours = Math.round(totalMinutes / 6) / 10;

      await prisma.weeklyTimesheet.update({
        where: { id: timesheetId },
        data: { totalHours },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
