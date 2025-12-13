import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { projectUpdateSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { canAccessSpecificResource } from "@/lib/authorization";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.read);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            website: true,
            isClient: true,
          },
        },
        contact: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            position: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Vérifier l'accès IDOR
    const hasAccess = await canAccessSpecificResource(auth.id, "project", id);
    if (!hasAccess) {
      logger.warn("Unauthorized project access attempt", "SECURITY", {
        userId: auth.id,
        projectId: id,
      });
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    logger.error("Error fetching project", error as Error, "PROJECT_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération du projet."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.write);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier l'accès IDOR
    const hasAccess = await canAccessSpecificResource(auth.id, "project", id);
    if (!hasAccess) {
      logger.warn("Unauthorized project update attempt", "SECURITY", {
        userId: auth.id,
        projectId: id,
      });
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Validation Zod
    const validation = validateBody(projectUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json(project);
  } catch (error) {
    logger.error("Error updating project", error as Error, "PROJECT_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la mise à jour du projet."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.write);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Vérifier l'accès IDOR
    const hasAccess = await canAccessSpecificResource(auth.id, "project", id);
    if (!hasAccess) {
      logger.warn("Unauthorized project delete attempt", "SECURITY", {
        userId: auth.id,
        projectId: id,
      });
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting project", error as Error, "PROJECT_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la suppression du projet."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
