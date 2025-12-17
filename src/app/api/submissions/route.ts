import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

/**
 * GET /api/submissions
 * Liste toutes les soumissions avec leurs devis associés
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const submissions = await prisma.submission.findMany({
      include: {
        quote: {
          select: {
            id: true,
            title: true,
            clientName: true,
            clientCompany: true,
            total: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    logger.error("Error fetching all submissions", error as Error, "SUBMISSIONS_API");
    return NextResponse.json(
      { error: "Erreur lors de la récupération des soumissions" },
      { status: 500 }
    );
  }
}

