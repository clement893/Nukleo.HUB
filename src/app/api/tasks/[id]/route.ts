import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/app/api/notifications/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignedEmployee: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { zone, employeeId, status, ...otherFields } = body;

    // Handle status change
    if (status === "done" && !otherFields.completedAt) {
      otherFields.completedAt = new Date();
    } else if (status && status !== "done") {
      otherFields.completedAt = null;
    }

    // If moving to "current" zone and assigning to employee
    if (zone === "current" && employeeId) {
      // First, check if employee already has a current task
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { currentTask: true },
      });

      if (employee?.currentTaskId && employee.currentTaskId !== id) {
        // Move the old task back to shelf
        await prisma.task.update({
          where: { id: employee.currentTaskId },
          data: { zone: "shelf" },
        });
      }

      // Update the task and assign to employee
      const task = await prisma.task.update({
        where: { id },
        data: {
          ...otherFields,
          zone: "current",
        },
        include: {
          project: true,
          assignedEmployee: true,
        },
      });

      // Update employee's current task
      await prisma.employee.update({
        where: { id: employeeId },
        data: { currentTaskId: id },
      });

      // Créer une notification pour l'employé
      await createNotification({
        employeeId: employeeId,
        type: "task_assigned",
        title: "Nouvelle tâche assignée",
        message: `La tâche "${task.title}" vous a été assignée.${task.project ? ` Projet: ${task.project.name}` : ""}`,
        link: "/tasks",
        metadata: { taskId: id, projectId: task.projectId },
      });

      return NextResponse.json(task);
    }

    // If moving away from "current" zone, unassign from employee
    if (zone && zone !== "current") {
      const currentTask = await prisma.task.findUnique({
        where: { id },
        include: { assignedEmployee: true },
      });

      if (currentTask?.assignedEmployee) {
        await prisma.employee.update({
          where: { id: currentTask.assignedEmployee.id },
          data: { currentTaskId: null },
        });
      }
    }

    // Regular update
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...otherFields,
        ...(zone && { zone }),
        ...(status && { status }),
      },
      include: {
        project: true,
        assignedEmployee: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, unassign from any employee
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignedEmployee: true },
    });

    if (task?.assignedEmployee) {
      await prisma.employee.update({
        where: { id: task.assignedEmployee.id },
        data: { currentTaskId: null },
      });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
