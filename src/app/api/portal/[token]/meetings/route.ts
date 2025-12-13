import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createMeetingSchema = z.object({
  projectId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  meetingType: z.enum(["video", "phone", "in_person"]).default("video"),
  location: z.string().optional(),
  duration: z.number().min(15).max(480).default(30),
  startTime: z.string(), // ISO string
  timezone: z.string().default("America/Montreal"),
  clientAttendees: z.string().optional(), // JSON array
});

// GET - Liste des réunions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = { portalId: portal.id };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.meetingDate = {};
      if (startDate) (where.meetingDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.meetingDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const meetings = await prisma.clientMeeting.findMany({
      where,
      include: {
        meetingNotes: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { meetingDate: "asc" },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    logger.error("Erreur récupération réunions", error as Error, "GET /api/portal/[token]/meetings");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une réunion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const validation = createMeetingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + data.duration * 60 * 1000);

    // Vérifier les conflits (simplifié - vérifier juste meetingDate)
    const conflictingMeetings = await prisma.clientMeeting.findMany({
      where: {
        portalId: portal.id,
        status: { in: ["scheduled", "confirmed"] },
        meetingDate: {
          gte: new Date(startTime.getTime() - data.duration * 60 * 1000),
          lte: endTime,
        },
      },
    });

    if (conflictingMeetings.length > 0) {
      return NextResponse.json(
        { error: "Conflit avec une réunion existante", conflicts: conflictingMeetings },
        { status: 409 }
      );
    }

    // Créer la réunion
    const meeting = await prisma.clientMeeting.create({
      data: {
        portalId: portal.id,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        meetingType: data.meetingType,
        location: data.location,
        duration: data.duration,
        meetingDate: startTime,
        timezone: data.timezone,
        clientAttendees: data.clientAttendees,
        createdBy: "client",
        status: "scheduled",
      } as any,
      include: {
        meetingNotes: true,
      } as any,
    });

    // TODO: Synchroniser avec Google Calendar/Outlook
    // await syncMeetingToCalendar(meeting);

    return NextResponse.json(meeting);
  } catch (error) {
    logger.error("Erreur création réunion", error as Error, "POST /api/portal/[token]/meetings");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
