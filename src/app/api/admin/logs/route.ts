import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action") || "";
    const entityType = searchParams.get("entityType") || "";
    const userId = searchParams.get("userId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (userId) {
      where.userId = userId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    
    const log = await prisma.activityLog.create({
      data: {
        action: body.action,
        entityType: body.entityType,
        entityId: body.entityId || "",
        description: body.entityName || body.description,
        userId: body.userId,
        userName: body.userName,
        oldValue: body.details ? JSON.stringify(body.details) : null,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { error: "Failed to create activity log" },
      { status: 500 }
    );
  }
}
