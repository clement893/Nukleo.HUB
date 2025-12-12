import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer l'employé associé à l'utilisateur
    const userWithEmployee = await prisma.user.findUnique({
      where: { id: user.id },
      include: { employee: true },
    });

    if (!userWithEmployee?.employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Récupérer les tâches personnelles
    const tasks = await prisma.personalTask.findMany({
      where: { employeeId: userWithEmployee.employee.id },
      orderBy: [{ section: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching personal tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userWithEmployee = await prisma.user.findUnique({
      where: { id: user.id },
      include: { employee: true },
    });

    if (!userWithEmployee?.employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, priority, dueDate, section } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Obtenir le prochain ordre dans la section
    const lastTask = await prisma.personalTask.findFirst({
      where: {
        employeeId: userWithEmployee.employee.id,
        section: section || "My Tasks",
      },
      orderBy: { order: "desc" },
    });

    const task = await prisma.personalTask.create({
      data: {
        employeeId: userWithEmployee.employee.id,
        title,
        description,
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        section: section || "My Tasks",
        order: (lastTask?.order || 0) + 1,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating personal task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
