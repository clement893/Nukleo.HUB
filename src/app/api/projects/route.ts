import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { projectCreateSchema, validateBody } from "@/lib/validations";
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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const projectType = searchParams.get("projectType") || "";
    const year = searchParams.get("year") || "";
    const department = searchParams.get("department") || "";
    
    // Pagination
    const { page, limit } = getPaginationParams(searchParams);
    const skip = getSkip(page, limit);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { client: { contains: search, mode: "insensitive" } },
        { lead: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = { equals: status, mode: "insensitive" };
    }

    if (projectType) {
      where.projectType = { contains: projectType, mode: "insensitive" };
    }

    if (year) {
      where.year = { equals: year };
    }

    if (department) {
      where.departments = { contains: department, mode: "insensitive" };
    }

    // Clé de cache basée sur les paramètres
    const cacheKey = `projects:${JSON.stringify({ where, page, limit })}`;
    
    // Vérifier le cache
    const cached = cache.get<PaginatedResponse<unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Requêtes parallèles pour meilleures performances
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          projectType: true,
          year: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              isClient: true,
            },
          },
          contact: {
            select: {
              id: true,
              fullName: true,
              photoUrl: true,
              position: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const response = createPaginatedResponse(projects, total, page, limit);
    
    // Mettre en cache pour 2 minutes
    cache.set(cacheKey, response, CACHE_TTL.MEDIUM);

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching projects", error as Error, "PROJECTS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des projets."
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
    const validation = validateBody(projectCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Mapper les données validées vers le format Prisma
    const project = await prisma.project.create({
      data: {
        name: validation.data.name,
        description: validation.data.description || null,
        companyId: validation.data.clientId || null,
        status: validation.data.status || null,
        budget: validation.data.budget !== undefined && validation.data.budget !== null 
          ? String(validation.data.budget) 
          : null,
        lead: validation.data.managerId || null,
      },
    });
    
    // Invalider le cache des projets
    cache.invalidatePattern("projects:*");
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    logger.error("Error creating project", error as Error, "PROJECTS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création du projet."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
