import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { employeeCreateSchema, validateBody } from "@/lib/validations";
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
    const department = searchParams.get("department");

    const where = department ? { department } : {};

    // Optimisation: utiliser select au lieu de include pour réduire la taille des données transférées
    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        photoUrl: true,
        role: true,
        department: true,
        capacityHoursPerWeek: true,
        currentTask: {
          select: {
            id: true,
            title: true,
            status: true,
            zone: true,
            priority: true,
            dueDate: true,
            project: {
              select: {
                id: true,
                name: true,
                client: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    logger.error("Error fetching employees", error as Error, "EMPLOYEES_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des employés."
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

    // Validation Zod
    const validation = validateBody(employeeCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name: validation.data.firstName + " " + validation.data.lastName,
        email: validation.data.email,
        phone: validation.data.phone || null,
        photoUrl: validation.data.photoUrl || null,
        role: validation.data.position || null,
        department: validation.data.department, // Département requis avec valeur par défaut dans Zod
        capacityHoursPerWeek: 35,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    logger.error("Error creating employee", error as Error, "EMPLOYEES_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création de l'employé."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
