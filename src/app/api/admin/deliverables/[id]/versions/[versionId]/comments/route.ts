import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Schéma pour créer un commentaire
const createCommentSchema = z.object({
  commentType: z.enum(["general", "revision_request", "approval_note", "quality_issue"]).default("general"),
  content: z.string().min(1),
  fileReference: z.string().optional(),
  parentCommentId: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// GET - Récupérer les commentaires d'une version
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id, versionId } = await params;

    // Vérifier que la version appartient au livrable
    const version = await prisma.deliverableVersion.findUnique({
      where: { id: versionId },
      include: {
        deliverable: true,
      },
    });

    if (!version || version.deliverableId !== id) {
      return NextResponse.json({ error: "Version non trouvée" }, { status: 404 });
    }

    const comments = await prisma.versionComment.findMany({
      where: { versionId },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    logger.error("Error fetching comments", error instanceof Error ? error : new Error(String(error)), "VERSION_COMMENTS", {});
    return NextResponse.json(
      { error: "Erreur lors de la récupération des commentaires" },
      { status: 500 }
    );
  }
}

// POST - Créer un commentaire sur une version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id, versionId } = await params;
    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { commentType, content, fileReference, parentCommentId, attachments } = validation.data;

    // Vérifier que la version appartient au livrable
    const version = await prisma.deliverableVersion.findUnique({
      where: { id: versionId },
      include: {
        deliverable: true,
      },
    });

    if (!version || version.deliverableId !== id) {
      return NextResponse.json({ error: "Version non trouvée" }, { status: 404 });
    }

    // Si c'est une réponse, vérifier que le commentaire parent existe
    if (parentCommentId) {
      const parentComment = await prisma.versionComment.findUnique({
        where: { id: parentCommentId },
      });

      if (!parentComment || parentComment.versionId !== versionId) {
        return NextResponse.json({ error: "Commentaire parent non trouvé" }, { status: 404 });
      }
    }

    const comment = await prisma.versionComment.create({
      data: {
        versionId,
        commentType,
        content,
        fileReference,
        parentCommentId,
        authorType: user.role === "admin" || user.role === "super_admin" ? "employee" : "client",
        authorName: user.name || user.email,
        authorId: user.id,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
      include: {
        replies: true,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    logger.error("Error creating comment", error instanceof Error ? error : new Error(String(error)), "VERSION_COMMENTS", {});
    return NextResponse.json(
      { error: "Erreur lors de la création du commentaire" },
      { status: 500 }
    );
  }
}

// PATCH - Résoudre un commentaire
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id, versionId } = await params;
    const body = await request.json();
    const { commentId, resolved } = body;

    if (typeof resolved !== "boolean" || !commentId) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const comment = await prisma.versionComment.findUnique({
      where: { id: commentId },
      include: {
        version: {
          include: {
            deliverable: true,
          },
        },
      },
    });

    if (!comment || comment.versionId !== versionId || comment.version.deliverableId !== id) {
      return NextResponse.json({ error: "Commentaire non trouvé" }, { status: 404 });
    }

    const updatedComment = await prisma.versionComment.update({
      where: { id: commentId },
      data: {
        isResolved: resolved,
        resolvedAt: resolved ? new Date() : null,
        resolvedBy: resolved ? user.id : null,
      },
    });

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    logger.error("Error resolving comment", error instanceof Error ? error : new Error(String(error)), "VERSION_COMMENTS", {});
    return NextResponse.json(
      { error: "Erreur lors de la résolution du commentaire" },
      { status: 500 }
    );
  }
}
