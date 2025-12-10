import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/milestones?projectId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}

// POST /api/milestones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, startDate, dueDate, progress, deliverables, projectId, order } = body;

    if (!title || !projectId) {
      return NextResponse.json(
        { error: "title and projectId are required" },
        { status: 400 }
      );
    }

    const milestone = await prisma.milestone.create({
      data: {
        title,
        description,
        status: status || "pending",
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        progress: progress || 0,
        deliverables: deliverables ? JSON.stringify(deliverables) : null,
        projectId,
        order: order || 0,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "milestone_created",
        description: `Milestone "${title}" créé`,
        entityType: "project",
        entityId: projectId,
        userName: "Admin",
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}
