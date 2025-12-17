import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey, isErrorResponse } from "@/lib/api-auth";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * GET /api/public/testimonials?language={fr|en}
 * 
 * Endpoint public pour récupérer les témoignages en ligne.
 * Nécessite une clé API valide dans le header Authorization: Bearer <key> ou X-API-Key.
 * 
 * Query parameters:
 * - language: "fr" ou "en" (optionnel, défaut: "fr")
 * - featured: "true" pour ne récupérer que les témoignages mis en avant (optionnel)
 * - limit: nombre maximum de témoignages à retourner (optionnel, défaut: 100)
 */
export async function GET(request: NextRequest) {
  // Vérifier la clé API
  const apiKeyAuth = await requireApiKey(request);
  if (isErrorResponse(apiKeyAuth)) {
    return apiKeyAuth;
  }

  // Rate limiting basé sur la clé API
  const rateLimitError = rateLimitMiddleware(
    request,
    { requests: apiKeyAuth.rateLimit, window: 3600 } // Par défaut: rateLimit de la clé par heure
  );
  if (rateLimitError) return rateLimitError;

  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language") || "fr";
    const featured = searchParams.get("featured");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 1000) : 100; // Max 1000

    // Valider la langue
    if (language !== "fr" && language !== "en") {
      return NextResponse.json(
        { error: "Le paramètre 'language' doit être 'fr' ou 'en'" },
        { status: 400 }
      );
    }

    // Construire la clause where
    const where: Record<string, unknown> = {
      status: "online", // Seulement les témoignages en ligne
    };

    if (featured === "true") {
      where.featured = true;
    }

    // Récupérer les témoignages
    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [
        { featured: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
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

    // Formater les résultats pour l'API publique
    const formattedTestimonials = testimonials
      .filter((t) => {
        // Filtrer ceux qui ont du contenu dans la langue demandée
        const text = language === "fr" ? t.textFr : t.textEn;
        return text && text.trim().length > 0;
      })
      .map((t) => ({
        id: t.id,
        clientName: t.clientName,
        companyName: t.companyName,
        text: language === "fr" ? t.textFr : t.textEn,
        title: language === "fr" ? t.titleFr : t.titleEn,
        rating: t.rating,
        featured: t.featured,
        createdAt: t.createdAt.toISOString(),
      }));

    logger.info(
      `API testimonials fetched: ${formattedTestimonials.length} testimonials in ${language}`,
      "PUBLIC_API",
      { apiKeyId: apiKeyAuth.id, language, count: formattedTestimonials.length }
    );

    return NextResponse.json({
      success: true,
      language,
      count: formattedTestimonials.length,
      testimonials: formattedTestimonials,
    });
  } catch (error) {
    logger.error("Error fetching public testimonials", error as Error, "PUBLIC_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des témoignages."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

