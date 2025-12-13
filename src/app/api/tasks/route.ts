import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { taskCreateSchema, validateBody } from "@/lib/validations";
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
    const department = searchParams.get("department");
    const zone = searchParams.get("zone");
    const projectId = searchParams.get("projectId");
    const { page, limit } = getPaginationParams(searchParams);
    const skip = getSkip(page, limit);

    const where: Record<string, string> = {};
    if (department) where.department = department;
    if (zone) where.zone = zone;
    if (projectId) where.projectId = projectId;

    // Clé de cache
    const cacheKey = `tasks:${JSON.stringify({ where, page, limit })}`;
    const cached = cache.get<PaginatedResponse<unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Requêtes parallèles
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          zone: true,
          department: true,
          status: true,
          priority: true,
          estimatedHours: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              id: true,
              name: true,
              client: true,
            },
          },
          assignedEmployee: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.task.count({ where }),
    ]);

    const response = createPaginatedResponse(tasks, total, page, limit);
    cache.set(cacheKey, response, CACHE_TTL.SHORT); // Cache court car les tâches changent souvent
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching tasks", error as Error, "TASKS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des tâches."
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
    const validation = validateBody(taskCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: validation.data.title,
        description: validation.data.description || null,
        zone: "shelf", // Valeur par défaut
        department: validation.data.department || "Lab",
        status: validation.data.status || "todo",
        projectId: validation.data.projectId || null,
        priority: validation.data.priority || "medium",
        estimatedHours: validation.data.estimatedHours || 2,
        dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: true,
          },
        },
      },
    });

    // Invalider le cache
    cache.invalidatePattern("tasks:*");
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    logger.error("Error creating task", error as Error, "TASKS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création de la tâche."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
