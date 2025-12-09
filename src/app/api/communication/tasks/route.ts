import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const tasks = await prisma.clientTask.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, title, description, type, status, priority, dueDate, assignedTo, estimatedHours, notes } = body;

    if (!clientId || !title) {
      return NextResponse.json({ error: "clientId and title are required" }, { status: 400 });
    }

    const task = await prisma.clientTask.create({
      data: {
        clientId, title, description, type, status, priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo, estimatedHours, notes,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.completedAt) data.completedAt = new Date(data.completedAt);
    if (data.status === "done" && !data.completedAt) data.completedAt = new Date();

    const task = await prisma.clientTask.update({ where: { id }, data });
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await prisma.clientTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
