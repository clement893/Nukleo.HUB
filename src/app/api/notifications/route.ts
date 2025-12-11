import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Types de notifications
export type NotificationType = 
  | "timesheet_approved"
  | "timesheet_rejected"
  | "task_assigned"
  | "task_updated"
  | "task_completed"
  | "request_approved"
  | "request_rejected"
  | "document_shared"
  | "event_reminder"
  | "general";

// Fonction utilitaire pour créer une notification
export async function createNotification(data: {
  employeeId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const notification = await prisma.employeeNotification.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// POST - Créer une notification (usage interne)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, type, title, message, link, metadata } = body;

    if (!employeeId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Paramètres manquants: employeeId, type, title, message requis" },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      employeeId,
      type,
      title,
      message,
      link,
      metadata,
    });

    if (!notification) {
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Récupérer les notifications (admin)
export async function GET(request: NextRequest) {
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
