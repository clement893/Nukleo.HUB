import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les messages du chat
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before"); // Pour la pagination

    const where: Record<string, unknown> = { portalId: portal.id };
    if (projectId) where.projectId = projectId;
    if (before) where.createdAt = { lt: new Date(before) };

    const messages = await prisma.clientChatMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Marquer les messages de l'équipe comme lus
    await prisma.clientChatMessage.updateMany({
      where: {
        portalId: portal.id,
        senderType: "employee",
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error("Erreur récupération messages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Envoyer un message
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
    const { content, projectId, attachments } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const message = await prisma.clientChatMessage.create({
      data: {
        portalId: portal.id,
        projectId: projectId || null,
        content: content.trim(),
        senderType: "client",
        senderName: portal.clientName,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
    });

    // Créer une notification interne pour l'équipe
    // (Ici on pourrait envoyer un email ou une notification push)

    return NextResponse.json(message);
  } catch (error) {
    console.error("Erreur envoi message:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
