import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Schéma de validation pour créer un workflow
const createWorkflowSchema = z.object({
  workflowType: z.enum(["simple", "multi_step", "parallel"]).default("simple"),
  steps: z.array(z.object({
    stepNumber: z.number(),
    name: z.string(),
    description: z.string().optional(),
    approverType: z.enum(["client", "employee", "specific_user"]),
    approverId: z.string().optional(),
    approverName: z.string().optional(),
    isRequired: z.boolean().default(true),
  })).optional(),
});

// Schéma pour approuver/rejeter une étape
const approveStepSchema = z.object({
  stepId: z.string(),
  action: z.enum(["approve", "reject", "request_revision"]),
  comments: z.string().optional(),
});

// Schéma pour ajouter une signature
const addSignatureSchema = z.object({
  stepId: z.string().optional(),
  signatureData: z.string(),
  signatureMethod: z.enum(["draw", "type", "upload"]).default("draw"),
});

// GET - Récupérer le workflow d'approbation d'un livrable
export async function GET(
  _request: NextRequest,
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

    const deliverable = await prisma.clientDeliverable.findFirst({
      where: { id, portalId: portal.id },
    });

    if (!deliverable) {
      return NextResponse.json({ error: "Livrable non trouvé" }, { status: 404 });
    }

    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { deliverableId: id },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
        },
        signatures: {
          orderBy: { signedAt: "desc" },
        },
        history: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    return NextResponse.json(workflow || null);
  } catch (error) {
    logger.error("Erreur récupération workflow", error as Error, "GET /api/portal/[token]/deliverables/[id]/approval");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer ou mettre à jour un workflow d'approbation
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

    const deliverable = await prisma.clientDeliverable.findFirst({
      where: { id, portalId: portal.id },
    });

    if (!deliverable) {
      return NextResponse.json({ error: "Livrable non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const validation = createWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { workflowType, steps } = validation.data;

    // Vérifier si un workflow existe déjà
    const existingWorkflow = await prisma.approvalWorkflow.findUnique({
      where: { deliverableId: id },
    });

    let workflow;

    if (existingWorkflow) {
      // Mettre à jour le workflow existant
      workflow = await prisma.approvalWorkflow.update({
        where: { deliverableId: id },
        data: {
          workflowType,
          status: "pending",
          currentStep: 1,
        },
      });

      // Supprimer les anciennes étapes
      await prisma.approvalStep.deleteMany({
        where: { workflowId: workflow.id },
      });
    } else {
      // Créer un nouveau workflow
      workflow = await prisma.approvalWorkflow.create({
        data: {
          deliverableId: id,
          workflowType,
          status: "pending",
          currentStep: 1,
        },
      });

      // Activer le workflow sur le livrable
      await prisma.clientDeliverable.update({
        where: { id },
        data: { workflowEnabled: true },
      });
    }

    // Créer les étapes si fournies
    if (steps && steps.length > 0) {
      await prisma.approvalStep.createMany({
        data: steps.map((step) => ({
          workflowId: workflow.id,
          stepNumber: step.stepNumber,
          name: step.name,
          description: step.description,
          approverType: step.approverType,
          approverId: step.approverId,
          approverName: step.approverName || portal.clientName,
          isRequired: step.isRequired,
          status: "pending",
        })),
      });
    } else if (workflowType === "simple") {
      // Créer une étape simple par défaut
      await prisma.approvalStep.create({
        data: {
          workflowId: workflow.id,
          stepNumber: 1,
          name: "Approbation",
          approverType: "client",
          approverName: portal.clientName,
          isRequired: true,
          status: "pending",
        },
      });
    }

    // Enregistrer dans l'historique
    await prisma.approvalHistory.create({
      data: {
        workflowId: workflow.id,
        action: existingWorkflow ? "workflow_updated" : "workflow_created",
        actorType: "client",
        actorName: portal.clientName,
        comments: `Workflow ${workflowType} ${existingWorkflow ? "mis à jour" : "créé"}`,
      },
    });

    const workflowWithDetails = await prisma.approvalWorkflow.findUnique({
      where: { id: workflow.id },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
        },
        signatures: true,
        history: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json(workflowWithDetails);
  } catch (error) {
    logger.error("Erreur création workflow", error as Error, "POST /api/portal/[token]/deliverables/[id]/approval");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Approuver/rejeter une étape ou ajouter une signature
export async function PATCH(
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

    const deliverable = await prisma.clientDeliverable.findFirst({
      where: { id, portalId: portal.id },
    });

    if (!deliverable) {
      return NextResponse.json({ error: "Livrable non trouvé" }, { status: 404 });
    }

    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { deliverableId: id },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const action = body.action;

    if (action === "approve_step" || action === "reject_step" || action === "request_revision") {
      // Approuver/rejeter une étape
      const validation = approveStepSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Données invalides", details: validation.error.issues },
          { status: 400 }
        );
      }

      const { stepId, action: stepAction, comments } = validation.data;

      const step = await prisma.approvalStep.findFirst({
        where: { id: stepId, workflowId: workflow.id },
      });

      if (!step) {
        return NextResponse.json({ error: "Étape non trouvée" }, { status: 404 });
      }

      // Vérifier que c'est bien l'étape courante
      if (step.stepNumber !== workflow.currentStep) {
        return NextResponse.json(
          { error: "Cette étape n'est pas la prochaine à traiter" },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {
        status: stepAction === "approve" ? "approved" : stepAction === "reject" ? "rejected" : "pending",
        comments: comments || null,
        approvedAt: stepAction === "approve" ? new Date() : null,
        approvedBy: stepAction === "approve" ? portal.clientName : null,
      };

      await prisma.approvalStep.update({
        where: { id: stepId },
        data: updateData,
      });

      // Enregistrer dans l'historique
      await prisma.approvalHistory.create({
        data: {
          workflowId: workflow.id,
          stepId,
          action: stepAction,
          actorType: "client",
          actorName: portal.clientName,
          comments,
        },
      });

      // Mettre à jour le workflow
      if (stepAction === "approve") {
        // Passer à l'étape suivante ou finaliser
        const nextStep = workflow.steps.find((s) => s.stepNumber === step.stepNumber + 1);
        
        if (nextStep) {
          await prisma.approvalWorkflow.update({
            where: { id: workflow.id },
            data: {
              currentStep: nextStep.stepNumber,
              status: "in_progress",
            },
          });
        } else {
          // Toutes les étapes sont approuvées
          await prisma.approvalWorkflow.update({
            where: { id: workflow.id },
            data: {
              status: "approved",
            },
          });

          // Mettre à jour le livrable
          await prisma.clientDeliverable.update({
            where: { id },
            data: {
              status: "approved",
              approvedAt: new Date(),
              approvedBy: portal.clientName,
            },
          });
        }
      } else if (stepAction === "reject") {
        await prisma.approvalWorkflow.update({
          where: { id: workflow.id },
          data: {
            status: "rejected",
          },
        });

        await prisma.clientDeliverable.update({
          where: { id },
          data: {
            status: "rejected",
          },
        });
      } else if (stepAction === "request_revision") {
        await prisma.approvalWorkflow.update({
          where: { id: workflow.id },
          data: {
            status: "pending",
          },
        });

        await prisma.clientDeliverable.update({
          where: { id },
          data: {
            status: "revision_requested",
            clientFeedback: comments || null,
          },
        });
      }

      const updatedWorkflow = await prisma.approvalWorkflow.findUnique({
        where: { id: workflow.id },
        include: {
          steps: {
            orderBy: { stepNumber: "asc" },
          },
          signatures: true,
          history: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      return NextResponse.json(updatedWorkflow);
    } else if (action === "add_signature") {
      // Ajouter une signature
      const validation = addSignatureSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Données invalides", details: validation.error.issues },
          { status: 400 }
        );
      }

      const { stepId, signatureData, signatureMethod } = validation.data;

      // Récupérer l'adresse IP et user agent
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";

      const signature = await prisma.approvalSignature.create({
        data: {
          workflowId: workflow.id,
          stepId: stepId || null,
          signerType: "client",
          signerName: portal.clientName,
          signerEmail: portal.clientEmail,
          signatureData,
          signatureMethod,
          ipAddress,
          userAgent,
        },
      });

      // Enregistrer dans l'historique
      await prisma.approvalHistory.create({
        data: {
          workflowId: workflow.id,
          stepId: stepId || null,
          action: "signature_added",
          actorType: "client",
          actorName: portal.clientName,
          metadata: JSON.stringify({ signatureId: signature.id }),
        },
      });

      const updatedWorkflow = await prisma.approvalWorkflow.findUnique({
        where: { id: workflow.id },
        include: {
          steps: {
            orderBy: { stepNumber: "asc" },
          },
          signatures: {
            orderBy: { signedAt: "desc" },
          },
          history: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      return NextResponse.json(updatedWorkflow);
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    logger.error("Erreur mise à jour workflow", error as Error, "PATCH /api/portal/[token]/deliverables/[id]/approval");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
