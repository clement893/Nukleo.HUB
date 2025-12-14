import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
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

    // Vérifier que la tâche appartient à l'employé
    const task = await prisma.personalTask.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!task || task.employeeId !== userWithEmployee.employee.id) {
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, section, order } =
      body;

    const updatedTask = await prisma.personalTask.update({
      where: { id: resolvedParams.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && {
          status,
          completedAt: status === "done" ? new Date() : null,
        }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(section && { section }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating personal task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
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

    // Vérifier que la tâche appartient à l'employé
    const task = await prisma.personalTask.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!task || task.employeeId !== userWithEmployee.employee.id) {
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.personalTask.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting personal task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
