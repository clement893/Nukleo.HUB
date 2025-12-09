import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const taskId = searchParams.get("taskId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        (where.startTime as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.startTime as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, taskId, projectId, description, billable } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    // Vérifier s'il y a déjà un timer en cours pour cet employé
    const runningEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
        status: "running",
      },
    });

    if (runningEntry) {
      return NextResponse.json(
        { error: "A timer is already running for this employee", runningEntry },
        { status: 400 }
      );
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        employeeId,
        taskId,
        projectId,
        description,
        billable: billable ?? true,
        startTime: new Date(),
        status: "running",
      },
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Action spéciale pour arrêter le timer
    if (action === "stop") {
      const entry = await prisma.timeEntry.findUnique({ where: { id } });
      if (!entry) {
        return NextResponse.json(
          { error: "Time entry not found" },
          { status: 404 }
        );
      }

      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / 60000); // en minutes

      const updatedEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          endTime,
          duration,
          status: "completed",
        },
      });

      return NextResponse.json(updatedEntry);
    }

    // Action pour mettre en pause
    if (action === "pause") {
      const entry = await prisma.timeEntry.findUnique({ where: { id } });
      if (!entry) {
        return NextResponse.json(
          { error: "Time entry not found" },
          { status: 404 }
        );
      }

      const now = new Date();
      const currentDuration = Math.round((now.getTime() - entry.startTime.getTime()) / 60000);

      const updatedEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          duration: (entry.duration || 0) + currentDuration,
          status: "paused",
        },
      });

      return NextResponse.json(updatedEntry);
    }

    // Action pour reprendre
    if (action === "resume") {
      const updatedEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          startTime: new Date(),
          status: "running",
        },
      });

      return NextResponse.json(updatedEntry);
    }

    // Mise à jour standard
    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data,
    });

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await prisma.timeEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}
