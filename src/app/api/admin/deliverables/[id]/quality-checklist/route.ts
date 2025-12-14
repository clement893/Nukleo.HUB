import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Schéma pour créer/mettre à jour une checklist qualité
const updateCheckSchema = z.object({
  checkId: z.string(),
  status: z.enum(["pending", "passed", "failed", "n_a"]),
  notes: z.string().optional(),
  evidence: z.array(z.string()).optional(),
  score: z.number().min(0).max(100).optional(),
});

// GET - Récupérer la checklist qualité d'un livrable
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
          },
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!deliverable) {
      return NextResponse.json({ error: "Livrable non trouvé" }, { status: 404 });
    }

    const checklist = deliverable.versions[0]?.revisionWorkflow?.checklist;

    return NextResponse.json({ checklist });
  } catch (error) {
    logger.error("Error fetching quality checklist", error instanceof Error ? error : new Error(String(error)), "QUALITY_CHECKLIST", {});
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la checklist" },
      { status: 500 }
    );
  }
}

// POST - Mettre à jour un item de la checklist
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
    const validation = updateCheckSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { checkId, status, notes, evidence, score } = validation.data;

    // Mettre à jour l'item
    const check = await prisma.qualityCheck.update({
      where: { id: checkId },
      data: {
        status,
        notes,
        evidence: evidence ? JSON.stringify(evidence) : undefined,
        score,
        checkedBy: user.name || user.email,
        checkedById: user.id,
        checkedAt: new Date(),
      },
      include: {
        checklist: {
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
          },
        },
      },
    });

    // Vérifier que le check appartient au bon livrable
    if (check.checklist?.workflow?.version?.deliverableId !== id) {
      return NextResponse.json({ error: "Check non trouvé" }, { status: 404 });
    }

    // Recalculer le score global de la checklist
    const checklistId = check.checklistId;
    if (checklistId) {
      const allChecks = await prisma.qualityCheck.findMany({
        where: { checklistId },
      });

      const passedChecks = allChecks.filter((c) => c.status === "passed").length;
      const requiredChecks = allChecks.filter((c) => c.isRequired && c.status !== "n_a").length;
      const scoredChecks = allChecks.filter((c) => c.score !== null);

      let overallScore: number | null = null;
      if (scoredChecks.length > 0) {
        const totalScore = scoredChecks.reduce((sum, c) => sum + (c.score || 0), 0);
        overallScore = totalScore / scoredChecks.length;
      }

      const checklistStatus =
        requiredChecks > 0 && passedChecks === requiredChecks
          ? "passed"
          : allChecks.some((c) => c.status === "failed")
          ? "failed"
          : allChecks.some((c) => c.status === "in_progress")
          ? "in_progress"
          : "pending";

      await prisma.qualityChecklist.update({
        where: { id: checklistId },
        data: {
          overallScore,
          status: checklistStatus,
          passedAt: checklistStatus === "passed" ? new Date() : undefined,
          failedAt: checklistStatus === "failed" ? new Date() : undefined,
          reviewedBy: user.id,
        },
      });
    }

    // Récupérer la checklist mise à jour
    const updatedChecklist = await prisma.qualityChecklist.findUnique({
      where: { id: checklistId! },
      include: {
        items: {
          orderBy: [
            { category: "asc" },
            { createdAt: "asc" },
          ],
        },
      },
    });

    return NextResponse.json({ checklist: updatedChecklist });
  } catch (error) {
    logger.error("Error updating quality check", error instanceof Error ? error : new Error(String(error)), "QUALITY_CHECKLIST", {});
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la checklist" },
      { status: 500 }
    );
  }
}
