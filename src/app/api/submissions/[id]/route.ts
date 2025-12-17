import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

/**
 * GET /api/submissions/[id]
 * Récupère une soumission spécifique
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        quote: {
          select: {
            id: true,
            title: true,
            clientName: true,
            clientCompany: true,
            subtotal: true,
            total: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Soumission non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    logger.error("Error fetching submission", error as Error, "SUBMISSIONS_API");
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la soumission" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/submissions/[id]
 * Met à jour une soumission
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { phases, ...data } = body;

    // Recalculer les totaux si les phases sont mises à jour
    let updateData: Record<string, unknown> = { ...data };

    if (phases && Array.isArray(phases)) {
      const subtotal = phases.reduce((acc: number, phase: { estimatedHours: number; hourlyRate: number; selected: boolean }) => {
        if (phase.selected) {
          return acc + (phase.estimatedHours * phase.hourlyRate);
        }
        return acc;
      }, 0);

      const taxRate = data.taxRate || 0.14975;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      updateData = {
        ...updateData,
        phases: JSON.stringify(phases),
        subtotal,
        taxAmount,
        total,
      };
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Submission updated: ${submission.id}`, "SUBMISSIONS_API", {
      submissionId: id,
      updatedBy: auth.id,
    });

    return NextResponse.json(submission);
  } catch (error) {
    logger.error("Error updating submission", error as Error, "SUBMISSIONS_API");
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la soumission" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submissions/[id]
 * Supprime une soumission
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    await prisma.submission.delete({
      where: { id },
    });

    logger.info(`Submission deleted: ${id}`, "SUBMISSIONS_API", {
      submissionId: id,
      deletedBy: auth.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting submission", error as Error, "SUBMISSIONS_API");
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la soumission" },
      { status: 500 }
    );
  }
}

