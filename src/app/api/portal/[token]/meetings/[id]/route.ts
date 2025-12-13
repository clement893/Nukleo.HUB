import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const updateMeetingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  meetingType: z.enum(["video", "phone", "in_person"]).optional(),
  location: z.string().optional(),
  duration: z.number().min(15).max(480).optional(),
  startTime: z.string().optional(),
  status: z.enum(["scheduled", "confirmed", "cancelled", "completed"]).optional(),
  cancellationReason: z.string().optional(),
});

// GET - Récupérer une réunion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  try {
    const { token, id } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    const meeting = await prisma.clientMeeting.findFirst({
      where: {
        id,
        portalId: portal.id,
      },
      include: {
        meetingNotes: {
          orderBy: { createdAt: "desc" },
        },
      } as any,
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    logger.error("Erreur récupération réunion", error as Error, "GET /api/portal/[token]/meetings/[id]");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour une réunion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  try {
    const { token, id } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    const meeting = await prisma.clientMeeting.findFirst({
      where: {
        id,
        portalId: portal.id,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateMeetingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.meetingType !== undefined) updateData.meetingType = data.meetingType;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.duration !== undefined) {
      updateData.duration = data.duration;
    }
    if (data.startTime !== undefined) {
      const startTime = new Date(data.startTime);
      updateData.meetingDate = startTime;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "cancelled") {
        updateData.isCancelled = true;
        updateData.cancelledAt = new Date();
        if (data.cancellationReason) {
          updateData.cancellationReason = data.cancellationReason;
        }
      }
    }

    const updated = await prisma.clientMeeting.update({
      where: { id },
      data: updateData,
      include: {
        meetingNotes: true,
      } as any,
    });

    // TODO: Mettre à jour le calendrier si synchronisé
    // if (updated.googleCalendarEventId || updated.outlookCalendarEventId) {
    //   await updateCalendarEvent(updated);
    // }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Erreur mise à jour réunion", error as Error, "PUT /api/portal/[token]/meetings/[id]");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Annuler une réunion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  try {
    const { token, id } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    const meeting = await prisma.clientMeeting.findFirst({
      where: {
        id,
        portalId: portal.id,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    // Marquer comme annulée plutôt que supprimer
    await prisma.clientMeeting.update({
      where: { id },
      data: {
        status: "cancelled",
      },
    });

    // TODO: Supprimer du calendrier si synchronisé
    // if (meeting.googleCalendarEventId || meeting.outlookCalendarEventId) {
    //   await deleteCalendarEvent(meeting);
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erreur annulation réunion", error as Error, "DELETE /api/portal/[token]/meetings/[id]");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
