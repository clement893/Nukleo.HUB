import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { testimonialCreateSchema, validateBody } from "@/lib/validations";
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
    const status = searchParams.get("status");
    const featured = searchParams.get("featured");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (featured === "true") where.featured = true;

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [
        { featured: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    logger.error("Error fetching testimonials", error as Error, "TESTIMONIALS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des témoignages."
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
    const validation = validateBody(testimonialCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        clientName: validation.data.clientName,
        companyName: validation.data.clientCompany || null,
        textFr: validation.data.content || null,
        textEn: null,
        rating: validation.data.rating || 5,
        featured: validation.data.isPublished || false,
        companyId: validation.data.projectId || null, // Note: projectId utilisé comme companyId dans le schéma
        status: "received",
      },
    });

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    logger.error("Error creating testimonial", error as Error, "TESTIMONIALS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création du témoignage."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
