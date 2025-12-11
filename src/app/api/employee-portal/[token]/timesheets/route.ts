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

// Obtenir le lundi de la semaine pour une date donnée
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster si dimanche
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Obtenir le dimanche de la semaine pour une date donnée
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// GET - Récupérer les feuilles de temps de l'employé
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
    const weekParam = searchParams.get("week"); // Format: YYYY-MM-DD (lundi de la semaine)
    
    // Si une semaine spécifique est demandée
    if (weekParam) {
      const weekStart = getWeekStart(new Date(weekParam));
      const weekEnd = getWeekEnd(weekStart);

      // Chercher ou créer la feuille de temps
      let timesheet = await prisma.weeklyTimesheet.findUnique({
        where: {
          employeeId_weekStartDate: {
            employeeId: employee.id,
            weekStartDate: weekStart,
          },
        },
        include: {
          entries: {
            orderBy: { startTime: "asc" },
          },
        },
      });

      // Si pas de feuille de temps, récupérer les entrées existantes pour cette semaine
      const entries = await prisma.timeEntry.findMany({
        where: {
          employeeId: employee.id,
          startTime: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        orderBy: { startTime: "asc" },
      });

      // Calculer le total des heures
      const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
      const totalHours = Math.round(totalMinutes / 6) / 10;

      return NextResponse.json({
        timesheet: timesheet || null,
        entries,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalHours,
        canEdit: !timesheet || timesheet.status === "draft" || timesheet.status === "rejected",
      });
    }

    // Sinon, récupérer toutes les feuilles de temps
    const timesheets = await prisma.weeklyTimesheet.findMany({
      where: { employeeId: employee.id },
      orderBy: { weekStartDate: "desc" },
      take: 12, // 12 dernières semaines
    });

    return NextResponse.json({ timesheets });
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Soumettre une feuille de temps pour approbation
export async function POST(
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
    const { weekStartDate, notes } = body;

    const weekStart = getWeekStart(new Date(weekStartDate));
    const weekEnd = getWeekEnd(weekStart);

    // Récupérer les entrées de temps pour cette semaine
    const entries = await prisma.timeEntry.findMany({
      where: {
        employeeId: employee.id,
        startTime: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Calculer le total des heures
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalHours = Math.round(totalMinutes / 6) / 10;

    // Créer ou mettre à jour la feuille de temps
    const timesheet = await prisma.weeklyTimesheet.upsert({
      where: {
        employeeId_weekStartDate: {
          employeeId: employee.id,
          weekStartDate: weekStart,
        },
      },
      create: {
        employeeId: employee.id,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        totalHours,
        status: "submitted",
        submittedAt: new Date(),
        notes,
      },
      update: {
        totalHours,
        status: "submitted",
        submittedAt: new Date(),
        notes,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      },
    });

    // Lier les entrées de temps à la feuille de temps
    await prisma.timeEntry.updateMany({
      where: {
        employeeId: employee.id,
        startTime: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      data: {
        timesheetId: timesheet.id,
      },
    });

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error("Error submitting timesheet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Modifier une entrée de temps (si la feuille n'est pas approuvée)
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
    const { entryId, ...updateData } = body;

    // Vérifier que l'entrée appartient à l'employé
    const entry = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        employeeId: employee.id,
      },
      include: {
        timesheet: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entrée non trouvée" }, { status: 404 });
    }

    // Vérifier si la feuille de temps est modifiable
    if (entry.timesheet && entry.timesheet.status === "approved") {
      return NextResponse.json(
        { error: "Cette feuille de temps a été approuvée et ne peut plus être modifiée" },
        { status: 403 }
      );
    }

    // Mettre à jour l'entrée
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

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une entrée de temps (si la feuille n'est pas approuvée)
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
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json({ error: "ID de l'entrée requis" }, { status: 400 });
    }

    // Vérifier que l'entrée appartient à l'employé
    const entry = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        employeeId: employee.id,
      },
      include: {
        timesheet: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entrée non trouvée" }, { status: 404 });
    }

    // Vérifier si la feuille de temps est modifiable
    if (entry.timesheet && entry.timesheet.status === "approved") {
      return NextResponse.json(
        { error: "Cette feuille de temps a été approuvée et ne peut plus être modifiée" },
        { status: 403 }
      );
    }

    await prisma.timeEntry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
