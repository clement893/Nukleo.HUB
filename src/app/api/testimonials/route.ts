import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireApiKey, verifyApiKey, isErrorResponse } from "@/lib/api-auth";
import { testimonialCreateSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");
    const status = searchParams.get("status");
    const featured = searchParams.get("featured");

    // Vérifier si une clé API est fournie (accès public)
    const apiKey = await verifyApiKey(request);
    const isPublicAccess = !!apiKey;

    // Si accès public, vérifier la clé API et appliquer le rate limiting
    if (isPublicAccess) {
      const apiKeyAuth = await requireApiKey(request);
      if (apiKeyAuth instanceof NextResponse) {
        return apiKeyAuth;
      }

      // Rate limiting basé sur la clé API
      const rateLimitError = rateLimitMiddleware(
        request,
        { requests: apiKeyAuth.rateLimit, window: 3600 }
      );
      if (rateLimitError) return rateLimitError;

      // Pour l'accès public, on ne retourne que les témoignages en ligne
      const where: Record<string, unknown> = {
        status: "online",
      };

      if (featured === "true") {
        where.featured = true;
      }

      // Valider la langue si fournie
      const lang = language || "both"; // Par défaut, retourner les deux langues
      if (lang !== "fr" && lang !== "en" && lang !== "both") {
        return NextResponse.json(
          { error: "Le paramètre 'language' doit être 'fr', 'en' ou 'both'" },
          { status: 400 }
        );
      }

      const testimonials = await prisma.testimonial.findMany({
        where,
        orderBy: [
          { featured: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          clientName: true,
          companyName: true,
          textFr: true,
          textEn: true,
          titleFr: true,
          titleEn: true,
          rating: true,
          featured: true,
          createdAt: true,
        },
      });

      // Formater pour l'API publique avec filtre de langue
      let formattedTestimonials;
      
      if (lang === "both") {
        // Retourner les deux langues
        formattedTestimonials = testimonials
          .filter((t) => {
            // Inclure si au moins une langue a du contenu
            return (t.textFr && t.textFr.trim().length > 0) || 
                   (t.textEn && t.textEn.trim().length > 0);
          })
          .map((t) => ({
            id: t.id,
            clientName: t.clientName,
            companyName: t.companyName,
            textFr: t.textFr || null,
            textEn: t.textEn || null,
            titleFr: t.titleFr || null,
            titleEn: t.titleEn || null,
            rating: t.rating,
            featured: t.featured,
            createdAt: t.createdAt.toISOString(),
          }));
      } else {
        // Retourner une seule langue
        formattedTestimonials = testimonials
          .filter((t) => {
            const text = lang === "fr" ? t.textFr : t.textEn;
            return text && text.trim().length > 0;
          })
          .map((t) => ({
            id: t.id,
            clientName: t.clientName,
            companyName: t.companyName,
            text: lang === "fr" ? t.textFr : t.textEn,
            title: lang === "fr" ? t.titleFr : t.titleEn,
            rating: t.rating,
            featured: t.featured,
            createdAt: t.createdAt.toISOString(),
          }));
      }

      logger.info(
        `Public API testimonials fetched: ${formattedTestimonials.length} testimonials (language: ${lang})`,
        "PUBLIC_API",
        { apiKeyId: apiKeyAuth.id, language: lang, count: formattedTestimonials.length }
      );

      return NextResponse.json({
        success: true,
        language: lang,
        count: formattedTestimonials.length,
        testimonials: formattedTestimonials,
      });
    }

    // Accès authentifié (utilisateur connecté) - comportement existant
    const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.read);
    if (rateLimitError) return rateLimitError;

    const auth = await requireAuth();
    if (isErrorResponse(auth)) return auth;

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
