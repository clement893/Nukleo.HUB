import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { companyCreateSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getPaginationParams, getSkip, createPaginatedResponse, type PaginatedResponse } from "@/lib/pagination";
import { cache, CACHE_TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.read);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const isClient = searchParams.get("isClient");
    const { page, limit } = getPaginationParams(searchParams);
    const skip = getSkip(page, limit);

    const where = isClient === "true" ? { isClient: true } : {};

    // Clé de cache
    const cacheKey = `companies:${isClient}:${page}:${limit}`;
    const cached = cache.get<PaginatedResponse<unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Requêtes parallèles
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          website: true,
          industry: true,
          isClient: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.company.count({ where }),
    ]);

    const response = createPaginatedResponse(companies, total, page, limit);
    cache.set(cacheKey, response, CACHE_TTL.MEDIUM);
    
    return NextResponse.json(response);
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
    
    // Invalider le cache
    cache.invalidatePattern("companies:*");
    
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
