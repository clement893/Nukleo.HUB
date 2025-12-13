import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { contactCreateSchema, validateBody } from "@/lib/validations";
import { cache, CACHE_TTL } from "@/lib/cache";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const CACHE_KEY = "contacts:list";

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.read);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    // Vérifier le cache
    const cached = cache.get<object[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const contacts = await prisma.contact.findMany({
      orderBy: { fullName: "asc" },
    });

    // Mettre en cache pour 2 minutes
    cache.set(CACHE_KEY, contacts, CACHE_TTL.MEDIUM);

    return NextResponse.json(contacts);
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
    cache.delete(CACHE_KEY);

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
