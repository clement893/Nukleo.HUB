import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createNoteSchema = z.object({
  content: z.string().min(1),
  isShared: z.boolean().default(true),
});

// GET - Récupérer les notes d'une réunion
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
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    const notes = await (prisma as any).meetingNote.findMany({
      where: {
        meetingId: id,
        isShared: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    logger.error("Erreur récupération notes réunion", error as Error, "GET /api/portal/[token]/meetings/[id]/notes");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Ajouter une note à une réunion
export async function POST(
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
    const validation = createNoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const note = await (prisma as any).meetingNote.create({
      data: {
        meetingId: id,
        content: validation.data.content,
        authorType: "client",
        authorName: portal.clientName,
        isShared: validation.data.isShared,
      },
    });

    // Marquer les notes comme partagées sur la réunion
    if (validation.data.isShared) {
      await prisma.clientMeeting.update({
        where: { id },
        data: {
          notes: meeting.notes ? `${meeting.notes}\n\n${validation.data.content}` : validation.data.content,
        },
      });
    }

    return NextResponse.json(note);
  } catch (error) {
    logger.error("Erreur création note réunion", error as Error, "POST /api/portal/[token]/meetings/[id]/notes");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
