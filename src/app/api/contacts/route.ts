import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { contactCreateSchema, validateBody } from "@/lib/validations";
import { cache, CACHE_TTL } from "@/lib/cache";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getPaginationParams, getSkip, createPaginatedResponse, type PaginatedResponse } from "@/lib/pagination";

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
      const cacheKey = "contacts:simple";
      const cached = cache.get<unknown[]>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      const contacts = await prisma.contact.findMany({
        orderBy: { fullName: "asc" },
      });

      cache.set(cacheKey, contacts, CACHE_TTL.MEDIUM);
      return NextResponse.json(contacts);
    }

    // Mode paginé
    const { page, limit } = pagination;
    const skip = getSkip(page, limit);
    const cacheKey = `contacts:${page}:${limit}`;
    
    const cached = cache.get<PaginatedResponse<unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Requêtes parallèles
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        skip,
        take: limit,
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          company: true,
          position: true,
          photoUrl: true,
          linkedinUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.contact.count(),
    ]);

    const response = createPaginatedResponse(contacts, total, page, limit);
    cache.set(cacheKey, response, CACHE_TTL.MEDIUM);

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching contacts", error as Error, "CONTACTS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des contacts."
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
    const validation = validateBody(contactCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: validation.data,
    });

    // Invalider le cache après création
    cache.invalidatePattern("contacts:*");

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    logger.error("Error creating contact", error as Error, "CONTACTS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création du contact."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
