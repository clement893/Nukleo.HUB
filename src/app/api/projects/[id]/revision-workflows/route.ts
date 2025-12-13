import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET - Récupérer tous les workflows de révision d'un projet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;

    // Récupérer tous les livrables du projet avec leurs workflows
    const deliverables = await prisma.clientDeliverable.findMany({
      where: {
        projectId: id,
      },
      include: {
        versions: {
          include: {
            revisionWorkflow: {
              include: {
                levels: {
                  include: {
                    approvers: {
                      orderBy: { createdAt: "asc" },
                    },
                    comments: {
                      orderBy: { createdAt: "desc" },
                    },
                  },
                  orderBy: { levelNumber: "asc" },
                },
                revisions: {
                  orderBy: { roundNumber: "desc" },
                },
                checklist: {
                  include: {
                    items: {
                      orderBy: [
                        { category: "asc" },
                        { createdAt: "asc" },
                      ],
                    },
                  },
                },
              },
            },
            comments: {
              include: {
                replies: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { versionNumber: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Extraire tous les workflows actifs
    const workflows = deliverables
      .flatMap(d => d.versions)
      .filter(v => v.revisionWorkflow)
      .map(v => ({
        deliverable: {
          id: v.deliverableId,
          title: deliverables.find(d => d.id === v.deliverableId)?.title,
          type: deliverables.find(d => d.id === v.deliverableId)?.type,
        },
        version: {
          id: v.id,
          versionNumber: v.versionNumber,
          status: v.status,
          fileUrl: v.fileUrl,
          changeLog: v.changeLog,
          createdAt: v.createdAt,
        },
        workflow: v.revisionWorkflow,
      }));

    return NextResponse.json({
      workflows,
      total: workflows.length,
      byStatus: {
        draft: workflows.filter(w => w.workflow?.status === "draft").length,
        in_review: workflows.filter(w => w.workflow?.status === "in_review").length,
        revision_requested: workflows.filter(w => w.workflow?.status === "revision_requested").length,
        approved: workflows.filter(w => w.workflow?.status === "approved").length,
        rejected: workflows.filter(w => w.workflow?.status === "rejected").length,
      },
    });
  } catch (error) {
    logger.error(
      "Error fetching revision workflows",
      error instanceof Error ? error : new Error(String(error)),
      "REVISION_WORKFLOWS",
      {}
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des workflows" },
      { status: 500 }
    );
  }
}
