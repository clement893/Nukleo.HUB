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
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let startDate: Date;
    let endDate: Date;

    if (month && year) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const events = await prisma.employeeEvent.findMany({
      where: {
        employeeId: employee.id,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Ajouter les deadlines des tâches comme événements
    const taskDeadlines = await prisma.task.findMany({
      where: {
        assignedEmployee: { id: employee.id },
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: "done" },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        project: {
          select: { name: true },
        },
      },
    });

    const taskEvents = taskDeadlines.map(task => ({
      id: `task-${task.id}`,
      title: `📋 ${task.title}`,
      description: task.project?.name || "",
      startDate: task.dueDate,
      endDate: task.dueDate,
      allDay: true,
      type: "deadline",
      color: task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#3b82f6",
    }));

    return NextResponse.json({
      events: [...events, ...taskEvents],
    });
  } catch (error) {
    console.error("Error fetching events:", error);
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

    const event = await prisma.employeeEvent.create({
      data: {
        employeeId: employee.id,
        title: body.title,
        description: body.description,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        allDay: body.allDay || false,
        type: body.type || "event",
        location: body.location,
        color: body.color,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
