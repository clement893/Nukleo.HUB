import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Schéma pour créer un workflow de révision structuré
const createRevisionWorkflowSchema = z.object({
  workflowType: z.enum(["structured", "simple", "parallel"]).default("structured"),
  levels: z.array(z.object({
    levelNumber: z.number(),
    name: z.string(),
    description: z.string().optional(),
    approverType: z.enum(["client", "employee", "manager", "director", "specific_user"]),
    approverId: z.string().optional(),
    approverName: z.string().optional(),
    approverEmail: z.string().optional(),
    isRequired: z.boolean().default(true),
    canDelegate: z.boolean().default(false),
    minApprovers: z.number().default(1),
    maxApprovers: z.number().default(1),
    deadline: z.string().optional(), // ISO date string
  })),
  checklistTemplateId: z.string().optional(),
});

// GET - Récupérer le workflow de révision d'un livrable
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;

    const deliverable = await prisma.clientDeliverable.findUnique({
      where: { id },
      include: {
        versions: {
          include: {
            revisionWorkflow: {
              include: {
                levels: {
                  include: {
                    approvers: true,
                    comments: true,
                  },
                  orderBy: { levelNumber: "asc" },
                },
                revisions: {
                  orderBy: { roundNumber: "desc" },
                },
                checklist: {
                  include: {
                    items: {
                      orderBy: { createdAt: "asc" },
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
    });

    if (!deliverable) {
      return NextResponse.json({ error: "Livrable non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ deliverable });
  } catch (error) {
    logger.error("Error fetching revision workflow", error instanceof Error ? error : new Error(String(error)), "REVISION_WORKFLOW", {});
    return NextResponse.json(
      { error: "Erreur lors de la récupération du workflow" },
      { status: 500 }
    );
  }
}

// POST - Créer un workflow de révision structuré
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = createRevisionWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { workflowType, levels, checklistTemplateId } = validation.data;

    // Vérifier que le livrable existe
    const deliverable = await prisma.clientDeliverable.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!deliverable) {
      return NextResponse.json({ error: "Livrable non trouvé" }, { status: 404 });
    }

    // Utiliser la dernière version ou créer une nouvelle version
    let version = deliverable.versions[0];
    if (!version) {
      version = await prisma.deliverableVersion.create({
        data: {
          deliverableId: id,
          versionNumber: 1,
          status: "draft",
        },
      });
    }

    // Vérifier qu'il n'y a pas déjà un workflow
    const existingWorkflow = await prisma.revisionWorkflow.findUnique({
      where: { versionId: version.id },
    });

    if (existingWorkflow) {
      return NextResponse.json(
        { error: "Un workflow existe déjà pour cette version" },
        { status: 400 }
      );
    }

    // Créer le workflow avec les niveaux
    const workflow = await prisma.revisionWorkflow.create({
      data: {
        versionId: version.id,
        workflowType,
        currentLevel: 1,
        status: "draft",
        revisionRound: 1,
        levels: {
          create: levels.map((level) => ({
            levelNumber: level.levelNumber,
            name: level.name,
            description: level.description,
            approverType: level.approverType,
            approverId: level.approverId,
            approverName: level.approverName,
            approverEmail: level.approverEmail,
            isRequired: level.isRequired,
            canDelegate: level.canDelegate,
            minApprovers: level.minApprovers,
            maxApprovers: level.maxApprovers,
            deadline: level.deadline ? new Date(level.deadline) : null,
            approvers: level.approverName
              ? {
                  create: {
                    approverType: level.approverType,
                    approverName: level.approverName,
                    approverEmail: level.approverEmail,
                    status: "pending",
                  },
                }
              : undefined,
          })),
        },
        checklist: checklistTemplateId
          ? {
              create: {
                templateId: checklistTemplateId,
                status: "pending",
              },
            }
          : undefined,
      },
      include: {
        levels: {
          include: {
            approvers: true,
          },
          orderBy: { levelNumber: "asc" },
        },
        checklist: {
          include: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    logger.error("Error creating revision workflow", error instanceof Error ? error : new Error(String(error)), "REVISION_WORKFLOW", {});
    return NextResponse.json(
      { error: "Erreur lors de la création du workflow" },
      { status: 500 }
    );
  }
}
