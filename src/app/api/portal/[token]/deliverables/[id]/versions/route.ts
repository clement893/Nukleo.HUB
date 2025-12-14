import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createVersionSchema = z.object({
  fileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  changeLog: z.string().optional(),
});

// GET - Récupérer toutes les versions d'un livrable
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

    const versions = await prisma.deliverableVersion.findMany({
      where: { deliverableId: id },
      orderBy: { versionNumber: "desc" },
    });

    return NextResponse.json(versions);
  } catch (error) {
    logger.error("Erreur récupération versions", error as Error, "GET /api/portal/[token]/deliverables/[id]/versions");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une nouvelle version d'un livrable
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
    const validation = createVersionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Trouver le numéro de version suivant
    const lastVersion = await prisma.deliverableVersion.findFirst({
      where: { deliverableId: id },
      orderBy: { versionNumber: "desc" },
    });

    const nextVersionNumber = (lastVersion?.versionNumber || deliverable.version) + 1;

    // Créer la nouvelle version
    const version = await prisma.deliverableVersion.create({
      data: {
        deliverableId: id,
        versionNumber: nextVersionNumber,
        fileUrl: validation.data.fileUrl || deliverable.fileUrl,
        thumbnailUrl: validation.data.thumbnailUrl || deliverable.thumbnailUrl,
        changeLog: validation.data.changeLog,
        status: "draft",
      },
    });

    // Mettre à jour le numéro de version du livrable
    await prisma.clientDeliverable.update({
      where: { id },
      data: { version: nextVersionNumber },
    });

    // Si un workflow existe, créer un nouveau workflow pour cette version
    const existingWorkflow = await prisma.approvalWorkflow.findUnique({
      where: { deliverableId: id },
      include: { steps: true },
    });

    if (existingWorkflow && existingWorkflow.workflowType === "simple") {
      // Créer un nouveau workflow pour cette version
      const newWorkflow = await prisma.approvalWorkflow.create({
        data: {
          deliverableId: id,
          workflowType: existingWorkflow.workflowType,
          status: "pending",
          currentStep: 1,
        },
      });

      // Copier les étapes
      await prisma.approvalStep.createMany({
        data: existingWorkflow.steps.map((step) => ({
          workflowId: newWorkflow.id,
          stepNumber: step.stepNumber,
          name: step.name,
          description: step.description,
          approverType: step.approverType,
          approverId: step.approverId,
          approverName: step.approverName,
          isRequired: step.isRequired,
          status: "pending",
        })),
      });

      // Lier le workflow à la version
      await prisma.deliverableVersion.update({
        where: { id: version.id },
        data: { workflowId: newWorkflow.id },
      });
    }

    return NextResponse.json(version);
  } catch (error) {
    logger.error("Erreur création version", error as Error, "POST /api/portal/[token]/deliverables/[id]/versions");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
