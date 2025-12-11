import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les commentaires sur un fichier ou livrable
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
    const fileId = searchParams.get("fileId");
    const deliverableId = searchParams.get("deliverableId");

    const where: Record<string, unknown> = { portalId: portal.id };
    if (fileId) where.fileId = fileId;
    if (deliverableId) where.deliverableId = deliverableId;

    const comments = await prisma.clientFileComment.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Erreur récupération commentaires:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Ajouter un commentaire
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
    const { content, fileId, deliverableId, positionX, positionY, pageNumber } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Commentaire vide" }, { status: 400 });
    }

    if (!fileId && !deliverableId) {
      return NextResponse.json({ error: "Fichier ou livrable requis" }, { status: 400 });
    }

    const comment = await prisma.clientFileComment.create({
      data: {
        portalId: portal.id,
        fileId: fileId || null,
        deliverableId: deliverableId || null,
        content: content.trim(),
        authorType: "client",
        authorName: portal.clientName,
        positionX: positionX || null,
        positionY: positionY || null,
        pageNumber: pageNumber || null,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Erreur création commentaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Marquer un commentaire comme résolu
export async function PATCH(
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
    const { commentId, isResolved } = body;

    const comment = await prisma.clientFileComment.update({
      where: { id: commentId },
      data: { isResolved },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Erreur mise à jour commentaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
