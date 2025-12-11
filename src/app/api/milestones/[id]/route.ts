import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET /api/milestones/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await context.params;
    
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error fetching milestone:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestone" },
      { status: 500 }
    );
  }
}

// PATCH /api/milestones/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { title, description, status, startDate, dueDate, progress, deliverables, order } = body;

    const existingMilestone = await prisma.milestone.findUnique({
      where: { id },
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed" && existingMilestone.status !== "completed") {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      } else if (status !== "completed") {
        updateData.completedAt = null;
      }
    }
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (progress !== undefined) updateData.progress = progress;
    if (deliverables !== undefined) updateData.deliverables = deliverables ? JSON.stringify(deliverables) : null;
    if (order !== undefined) updateData.order = order;

    const milestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "milestone_updated",
        description: `Milestone "${milestone.title}" mis à jour`,
        entityType: "project",
        entityId: milestone.projectId,
        userName: "Admin",
      },
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 }
    );
  }
}

// DELETE /api/milestones/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await context.params;
    
    const milestone = await prisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    await prisma.milestone.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "milestone_deleted",
        description: `Milestone "${milestone.title}" supprimé`,
        entityType: "project",
        entityId: milestone.projectId,
        userName: "Admin",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 }
    );
  }
}
