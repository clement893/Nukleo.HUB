import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// POST - Créer une notification (usage interne)
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { employeeId, type, title, message, link, metadata } = body;

    if (!employeeId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Paramètres manquants: employeeId, type, title, message requis" },
        { status: 400 }
      );
    }

    const notification = await prisma.employeeNotification.create({
      data: {
        employeeId,
        type,
        title,
        message,
        link,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Récupérer les notifications (admin)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (type) where.type = type;

    const notifications = await prisma.employeeNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
