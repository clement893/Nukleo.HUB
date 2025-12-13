import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { companyCreateSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.read);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const isClient = searchParams.get("isClient");

    const where = isClient === "true" ? { isClient: true } : {};

    const companies = await prisma.company.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(companies);
  } catch (error) {
    logger.error("Error fetching companies", error as Error, "COMPANIES_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des entreprises."
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
    
    // Validation avec Zod
    const validation = validateBody(companyCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: validation.data,
    });
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    logger.error("Error creating company", error as Error, "COMPANIES_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création de l'entreprise."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
