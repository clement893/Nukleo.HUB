import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Schéma pour approuver/rejeter un niveau
const approveLevelSchema = z.object({
  action: z.enum(["approve", "reject", "request_revision"]),
  comments: z.string().optional(),
  delegatedTo: z.string().optional(),
});

// POST - Approuver/rejeter un niveau d'approbation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id, levelId } = await params;
    const body = await request.json();
    const validation = approveLevelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { action, comments, delegatedTo } = validation.data;

    // Récupérer le niveau
    const level = await prisma.approvalLevel.findUnique({
      where: { id: levelId },
      include: {
        workflow: {
          include: {
            version: {
              include: {
                deliverable: true,
              },
            },
          },
        },
        approvers: true,
      },
    });

    if (!level) {
      return NextResponse.json({ error: "Niveau non trouvé" }, { status: 404 });
    }

    // Vérifier que le workflow appartient au bon livrable
    if (level.workflow.version.deliverableId !== id) {
      return NextResponse.json({ error: "Niveau non trouvé" }, { status: 404 });
    }

    // Trouver ou créer l'approbateur
    let approver = level.approvers.find(
      (a) => a.approverId === user.id || a.approverName === user.name
    );

    if (!approver) {
      approver = await prisma.levelApprover.create({
        data: {
          levelId: level.id,
          approverType: user.role === "admin" || user.role === "super_admin" ? "employee" : "client",
          approverId: user.id,
          approverName: user.name || user.email,
          approverEmail: user.email,
          status: "pending",
        },
      });
    }

    // Mettre à jour le statut de l'approbateur
    const updateData: any = {
      comments: comments || approver.comments,
      updatedAt: new Date(),
    };

    if (action === "approve") {
      updateData.status = "approved";
      updateData.approvedAt = new Date();
    } else if (action === "reject") {
      updateData.status = "rejected";
      updateData.rejectedAt = new Date();
    } else if (action === "request_revision" && delegatedTo) {
      updateData.status = "delegated";
      updateData.delegatedTo = delegatedTo;
    }

    await prisma.levelApprover.update({
      where: { id: approver.id },
      data: updateData,
    });

    // Ajouter un commentaire si fourni
    if (comments) {
      await prisma.levelComment.create({
        data: {
          levelId: level.id,
          commentType: action === "request_revision" ? "revision_request" : action === "approve" ? "approval_note" : "feedback",
          content: comments,
          authorType: user.role === "admin" || user.role === "super_admin" ? "employee" : "client",
          authorName: user.name || user.email,
          authorId: user.id,
          isInternal: false,
        },
      });
    }

    // Vérifier si tous les approbateurs requis ont approuvé
    const approvedCount = level.approvers.filter((a) => a.status === "approved").length;
    const requiredCount = level.minApprovers;

    if (action === "approve" && approvedCount >= requiredCount) {
      // Marquer le niveau comme approuvé
      await prisma.approvalLevel.update({
        where: { id: level.id },
        data: {
          status: "approved",
          completedAt: new Date(),
        },
      });

      // Passer au niveau suivant ou marquer le workflow comme approuvé
      const workflow = level.workflow;
      const allLevels = await prisma.approvalLevel.findMany({
        where: { workflowId: workflow.id },
        orderBy: { levelNumber: "asc" },
      });

      const currentLevelIndex = allLevels.findIndex((l) => l.id === level.id);
      const nextLevel = allLevels[currentLevelIndex + 1];

      if (nextLevel) {
        // Passer au niveau suivant
        await prisma.revisionWorkflow.update({
          where: { id: workflow.id },
          data: {
            currentLevel: nextLevel.levelNumber,
            status: "in_review",
          },
        });

        // Démarrer le niveau suivant
        await prisma.approvalLevel.update({
          where: { id: nextLevel.id },
          data: {
            status: "in_progress",
            startedAt: new Date(),
          },
        });
      } else {
        // Tous les niveaux sont approuvés
        await prisma.revisionWorkflow.update({
          where: { id: workflow.id },
          data: {
            status: "approved",
          },
        });

        // Marquer la version comme approuvée
        await prisma.deliverableVersion.update({
          where: { id: workflow.versionId },
          data: {
            status: "approved",
            approvedAt: new Date(),
            approvedBy: user.id,
          },
        });
      }
    } else if (action === "reject") {
      // Marquer le niveau et le workflow comme rejeté
      await prisma.approvalLevel.update({
        where: { id: level.id },
        data: {
          status: "rejected",
          completedAt: new Date(),
        },
      });

      await prisma.revisionWorkflow.update({
        where: { id: level.workflow.id },
        data: {
          status: "rejected",
        },
      });

      await prisma.deliverableVersion.update({
        where: { id: level.workflow.versionId },
        data: {
          status: "rejected",
        },
      });
    } else if (action === "request_revision") {
      // Créer un nouveau round de révision
      await prisma.revisionRound.create({
        data: {
          workflowId: level.workflow.id,
          roundNumber: level.workflow.revisionRound + 1,
          status: "in_progress",
          requestedBy: user.name || user.email,
          requestedById: user.id,
          reason: comments || "Révision demandée",
          requestedChanges: comments,
        },
      });

      await prisma.revisionWorkflow.update({
        where: { id: level.workflow.id },
        data: {
          status: "revision_requested",
          revisionRound: level.workflow.revisionRound + 1,
          currentLevel: 1, // Recommencer depuis le début
        },
      });

      // Réinitialiser tous les niveaux
      await prisma.approvalLevel.updateMany({
        where: { workflowId: level.workflow.id },
        data: {
          status: "pending",
          startedAt: null,
          completedAt: null,
        },
      });
    }

    // Récupérer le workflow mis à jour
    const updatedWorkflow = await prisma.revisionWorkflow.findUnique({
      where: { id: level.workflow.id },
      include: {
        levels: {
          include: {
            approvers: true,
            comments: true,
          },
          orderBy: { levelNumber: "asc" },
        },
      },
    });

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    logger.error("Error approving level", error instanceof Error ? error : new Error(String(error)), "APPROVAL_LEVEL", {});
    return NextResponse.json(
      { error: "Erreur lors de l'approbation" },
      { status: 500 }
    );
  }
}
