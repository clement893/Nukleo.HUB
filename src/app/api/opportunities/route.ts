import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { opportunityCreateSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.read);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        linkedContact: true,
      },
    });
    return NextResponse.json(opportunities);
  } catch (error) {
    logger.error("Error fetching opportunities", error as Error, "OPPORTUNITIES_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des opportunités."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.write);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();

    // Validation Zod
    const validation = validateBody(opportunityCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        name: validation.data.title,
        value: validation.data.value,
        company: validation.data.companyId ? undefined : undefined,
        contactId: validation.data.contactId,
        stage: validation.data.stage || "00 - Idées de contact",
        region: undefined,
        segment: undefined,
        projectType: undefined,
        assignee: validation.data.assignedTo,
        expectedCloseDate: validation.data.expectedCloseDate ? new Date(validation.data.expectedCloseDate) : undefined,
      },
      include: {
        linkedContact: true,
      },
    });
    return NextResponse.json(opportunity);
  } catch (error) {
    logger.error("Error creating opportunity", error as Error, "OPPORTUNITIES_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création de l'opportunité."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
