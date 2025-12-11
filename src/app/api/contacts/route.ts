import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { contactCreateSchema, validateBody } from "@/lib/validations";
import { cache, CACHE_TTL } from "@/lib/cache";

const CACHE_KEY = "contacts:list";

export async function GET() {
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
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
