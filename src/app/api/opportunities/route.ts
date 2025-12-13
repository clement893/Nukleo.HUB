import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { opportunityCreateSchema, validateBody } from "@/lib/validations";
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
    const pagination = getPaginationParams(searchParams);

    // Mode rétrocompatible : si pas de pagination, retourner un tableau simple
    if (!pagination) {
      const cacheKey = "opportunities:simple";
      const cached = cache.get<unknown[]>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      const opportunities = await prisma.opportunity.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          linkedContact: true,
        },
      });

      cache.set(cacheKey, opportunities, CACHE_TTL.MEDIUM);
      return NextResponse.json(opportunities);
    }

    // Mode paginé
    const { page, limit } = pagination;
    const skip = getSkip(page, limit);
    const cacheKey = `opportunities:${page}:${limit}`;
    
    const cached = cache.get<PaginatedResponse<unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Requêtes parallèles
    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          value: true,
          stage: true,
          assignee: true,
          closedDate: true,
          createdAt: true,
          updatedAt: true,
          linkedContact: {
            select: {
              id: true,
              fullName: true,
              email: true,
              photoUrl: true,
            },
          },
        },
      }),
      prisma.opportunity.count(),
    ]);

    const response = createPaginatedResponse(opportunities, total, page, limit);
    cache.set(cacheKey, response, CACHE_TTL.MEDIUM);
    
    return NextResponse.json(response);
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
        contactId: validation.data.contactId,
        stage: validation.data.stage || "00 - Idées de contact",
        assignee: validation.data.assignedTo,
        closedDate: validation.data.expectedCloseDate ? new Date(validation.data.expectedCloseDate) : undefined,
      },
      include: {
        linkedContact: true,
      },
    });
    // Invalider le cache
    cache.invalidatePattern("opportunities:*");
    
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
