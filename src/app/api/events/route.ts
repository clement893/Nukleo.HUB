import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { eventCreateSchema, validateBody } from "@/lib/validations";
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
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    // Filter by date range
    if (start && end) {
      where.startDate = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Pagination pour les événements (limite par défaut plus élevée car souvent filtrés par date)
    const { page, limit } = getPaginationParams(searchParams);
    const skip = getSkip(page, limit);

    // Clé de cache
    const cacheKey = `events:${JSON.stringify({ where, page, limit })}`;
    const cached = cache.get<PaginatedResponse<unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Requêtes parallèles
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          startDate: true,
          endDate: true,
          allDay: true,
          location: true,
          color: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.event.count({ where }),
    ]);

    const response = createPaginatedResponse(events, total, page, limit);
    cache.set(cacheKey, response, CACHE_TTL.SHORT); // Cache court car les événements changent souvent
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching events", error as Error, "EVENTS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des événements."
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
    const validation = validateBody(eventCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: validation.data.title,
        description: validation.data.description || null,
        type: validation.data.type || "meeting",
        startDate: new Date(validation.data.startDate),
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : null,
        location: validation.data.location || null,
        contactId: validation.data.relatedId || null,
        opportunityId: validation.data.relatedType === "opportunity" ? validation.data.relatedId : null,
        projectId: validation.data.relatedType === "project" ? validation.data.relatedId : null,
        companyId: validation.data.relatedType === "company" ? validation.data.relatedId : null,
      },
    });

    // Invalider le cache
    cache.invalidatePattern("events:*");
    
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    logger.error("Error creating event", error as Error, "EVENTS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création de l'événement."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
