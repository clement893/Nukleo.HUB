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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = { employeeId: employee.id };
    if (startDate) {
      where.startTime = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.startTime = { ...where.startTime as object, lte: new Date(endDate) };
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      orderBy: { startTime: "desc" },
    });

    // Calculer les totaux
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const billableMinutes = timeEntries
      .filter(e => e.billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);

    return NextResponse.json({
      entries: timeEntries,
      totals: {
        totalHours: Math.round(totalMinutes / 6) / 10,
        billableHours: Math.round(billableMinutes / 6) / 10,
        entries: timeEntries.length,
      },
    });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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

    const timeEntry = await prisma.timeEntry.create({
      data: {
        employeeId: employee.id,
        taskId: body.taskId || null,
        projectId: body.projectId || null,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        duration: body.duration,
        billable: body.billable ?? true,
        status: body.endTime ? "completed" : "running",
        notes: body.notes,
      },
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
