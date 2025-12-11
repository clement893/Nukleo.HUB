import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET /api/activity?entityType=contact&entityId=xxx
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    const activities = await prisma.activityLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

// POST /api/activity
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { action, description, entityType, entityId, oldValue, newValue, userName } = body;

    if (!action || !entityType || !entityId) {
      return NextResponse.json(
        { error: "action, entityType, and entityId are required" },
        { status: 400 }
      );
    }

    const activity = await prisma.activityLog.create({
      data: {
        action,
        description,
        entityType,
        entityId,
        oldValue,
        newValue,
        userName: userName || "Système",
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
