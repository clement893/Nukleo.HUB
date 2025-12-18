import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

/**
 * POST /api/submissions/[id]/approve
 * Approuve une soumission (change le statut de draft/pending_approval à sent)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { sendToClient = false } = body;

    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Soumission non trouvée" },
        { status: 404 }
      );
    }

    if (submission.status === "accepted" || submission.status === "rejected") {
      return NextResponse.json(
        { error: "Cette soumission a déjà été traitée" },
        { status: 400 }
      );
    }

    // Mettre à jour le statut
    const newStatus = sendToClient ? "sent" : "pending_approval";
    const updateData: {
      status: string;
      approvedAt?: Date;
      approvedBy?: string;
      sentAt?: Date;
    } = {
      status: newStatus,
      approvedAt: new Date(),
      approvedBy: auth.id,
    };

    if (sendToClient) {
      updateData.sentAt = new Date();
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Submission approved: ${id}`, "SUBMISSIONS_API", {
      submissionId: id,
      approvedBy: auth.id,
      newStatus,
      sendToClient,
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    logger.error("Error approving submission", error as Error, "SUBMISSIONS_API");
    return NextResponse.json(
      { error: "Erreur lors de l'approbation de la soumission" },
      { status: 500 }
    );
  }
}

