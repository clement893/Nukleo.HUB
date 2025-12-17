import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

/**
 * GET /api/quotes/[id]/submissions
 * Liste toutes les soumissions d'un devis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Vérifier que le devis existe
    const quote = await prisma.quote.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: { quoteId: id },
      orderBy: { version: "asc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    logger.error("Error fetching submissions", error as Error, "SUBMISSIONS_API");
    return NextResponse.json(
      { error: "Erreur lors de la récupération des soumissions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotes/[id]/submissions
 * Crée une nouvelle soumission (variante) d'un devis
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

    // Vérifier que le devis existe et récupérer ses données
    const quote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }

    // Trouver le prochain numéro de version
    const lastSubmission = await prisma.submission.findFirst({
      where: { quoteId: id },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (lastSubmission?.version || 0) + 1;

    // Calculer les totaux à partir des phases si fournies
    let subtotal = body.subtotal || quote.subtotal;
    let phases = body.phases || quote.phases;

    if (body.phases && Array.isArray(body.phases)) {
      subtotal = body.phases.reduce((acc: number, phase: { estimatedHours: number; hourlyRate: number; selected: boolean }) => {
        if (phase.selected) {
          return acc + (phase.estimatedHours * phase.hourlyRate);
        }
        return acc;
      }, 0);
      phases = JSON.stringify(body.phases);
    }

    const taxRate = body.taxRate ?? quote.taxRate;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Calculer les différences avec le devis principal
    const differences = {
      subtotalDiff: subtotal - quote.subtotal,
      totalDiff: total - quote.total,
      phasesChanged: body.phases ? true : false,
    };

    const submission = await prisma.submission.create({
      data: {
        quoteId: id,
        version: nextVersion,
        title: body.title || `Version ${nextVersion}`,
        description: body.description || null,
        subtotal,
        taxRate,
        taxAmount,
        total,
        currency: body.currency || quote.currency,
        phases,
        notes: body.notes || null,
        differences: JSON.stringify(differences),
        status: body.status || "draft",
        validUntil: body.validUntil || quote.validUntil || null,
        createdBy: auth.id,
      },
    });

    logger.info(`Submission created: ${submission.title} for quote ${id}`, "SUBMISSIONS_API", {
      submissionId: submission.id,
      quoteId: id,
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

