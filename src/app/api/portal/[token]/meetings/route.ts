import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les réunions du client
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
    const projectId = searchParams.get("projectId");
    const upcoming = searchParams.get("upcoming") === "true";
    const past = searchParams.get("past") === "true";

    const where: Record<string, unknown> = { portalId: portal.id };
    if (projectId) where.projectId = projectId;
    
    const now = new Date();
    if (upcoming) {
      where.meetingDate = { gte: now };
      where.status = { in: ["scheduled", "rescheduled"] };
    } else if (past) {
      where.OR = [
        { meetingDate: { lt: now } },
        { status: "completed" },
      ];
    }

    const meetings = await prisma.clientMeeting.findMany({
      where,
      orderBy: { meetingDate: upcoming ? "asc" : "desc" },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Erreur récupération réunions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Demander une réunion (le client peut proposer un créneau)
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
    const { title, description, preferredDate, projectId, meetingType } = body;

    if (!title || !preferredDate) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const meeting = await prisma.clientMeeting.create({
      data: {
        portalId: portal.id,
        projectId: projectId || null,
        title,
        description: description || null,
        meetingDate: new Date(preferredDate),
        meetingType: meetingType || "video",
        status: "scheduled",
        createdBy: portal.clientName,
      },
    });

    // Créer une notification pour l'équipe
    await prisma.clientNotification.create({
      data: {
        portalId: portal.id,
        type: "meeting_requested",
        title: "Demande de réunion",
        message: `${portal.clientName} a demandé une réunion: ${title}`,
        link: `/meetings/${meeting.id}`,
      },
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Erreur création réunion:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
