import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

/**
 * GET /api/submissions
 * Liste toutes les soumissions avec leurs devis associés
 * Query params: status (comma-separated list of statuses to filter)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where: { status?: { in: string[] } } = {};
    if (statusFilter) {
      const statuses = statusFilter.split(",").map((s) => s.trim());
      where.status = { in: statuses };
    }

    const submissions = await prisma.submission.findMany({
      where,
      select: {
        id: true,
        quoteId: true,
        version: true,
        title: true,
        description: true,
        clientName: true,
        clientEmail: true,
        clientCompany: true,
        subtotal: true,
        taxRate: true,
        taxAmount: true,
        total: true,
        currency: true,
        status: true,
        validUntil: true,
        createdAt: true,
        phases: true,
        notes: true,
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

/**
 * POST /api/submissions
 * Crée une nouvelle soumission indépendante (pour gros projets)
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const {
      title,
      description,
      clientName,
      clientEmail,
      clientCompany,
      phases,
      notes,
      validUntil,
      taxRate = 0.14975,
      currency = "CAD",
      quoteId, // Optionnel - pour lier à un devis existant
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Le titre de la soumission est requis" },
        { status: 400 }
      );
    }

    if (!clientName || !clientName.trim()) {
      return NextResponse.json(
        { error: "Le nom du client est requis" },
        { status: 400 }
      );
    }

    // Calculer les totaux à partir des phases
    let subtotal = 0;
    let phasesJson: string | null = null;

    if (phases && Array.isArray(phases)) {
      subtotal = phases.reduce((acc: number, phase: { estimatedHours: number; hourlyRate: number; selected: boolean }) => {
        if (phase.selected) {
          return acc + (phase.estimatedHours * phase.hourlyRate);
        }
        return acc;
      }, 0);
      phasesJson = JSON.stringify(phases);
    }

    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Si un quoteId est fourni, vérifier qu'il existe et calculer les différences
    let differences: string | null = null;
    let version = 1;

    if (quoteId && quoteId.trim()) {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
      });

      if (!quote) {
        return NextResponse.json(
          { error: "Devis non trouvé" },
          { status: 404 }
        );
      }

      // Trouver le prochain numéro de version pour ce devis
      const lastSubmission = await prisma.submission.findFirst({
        where: { quoteId },
        orderBy: { version: "desc" },
        select: { version: true },
      });

      version = (lastSubmission?.version || 0) + 1;

      // Calculer les différences avec le devis principal
      differences = JSON.stringify({
        subtotalDiff: subtotal - quote.subtotal,
        totalDiff: total - quote.total,
        phasesChanged: phases ? true : false,
      });
    }

    const submission = await prisma.submission.create({
      data: {
        quoteId: quoteId && quoteId.trim() ? quoteId : null,
        version,
        title: title.trim(),
        description: description || null,
        clientName: clientName?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        clientCompany: clientCompany?.trim() || null,
        subtotal,
        taxRate,
        taxAmount,
        total,
        currency,
        phases: phasesJson,
        notes: notes || null,
        differences,
        status: "draft",
        validUntil: validUntil ? new Date(validUntil) : null,
        createdBy: auth.id,
      },
    });

    logger.info(`Submission created: ${submission.title}`, "SUBMISSIONS_API", {
      submissionId: submission.id,
      quoteId: submission.quoteId,
      createdBy: auth.id,
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    logger.error("Error creating submission", error as Error, "SUBMISSIONS_API");
    return NextResponse.json(
      { error: "Erreur lors de la création de la soumission" },
      { status: 500 }
    );
  }
}

