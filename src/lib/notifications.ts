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
