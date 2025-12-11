import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste tous les accès employés
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (employeeId) {
      // Récupérer l'accès d'un employé spécifique
      const access = await prisma.employeeAccess.findUnique({
        where: { employeeId },
        include: {
          employee: {
            select: { id: true, name: true, department: true, photoUrl: true },
          },
        },
      });

      const leoContext = await prisma.employeeLeoContext.findUnique({
        where: { employeeId },
      });

      return NextResponse.json({ access, leoContext });
    }

    // Liste tous les employés avec leurs accès
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        photoUrl: true,
        access: true,
        leoContext: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employee access:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour les accès d'un employé
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, access, leoContext } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId requis" },
        { status: 400 }
      );
    }

    // Upsert accès
    if (access) {
      await prisma.employeeAccess.upsert({
        where: { employeeId },
        create: {
          employeeId,
          accessType: access.accessType || "all",
          clientAccess: access.clientAccess || "*",
          projectAccess: access.projectAccess || "*",
        },
        update: {
          accessType: access.accessType,
          clientAccess: access.clientAccess,
          projectAccess: access.projectAccess,
        },
      });
    }

    // Upsert contexte Leo
    if (leoContext) {
      await prisma.employeeLeoContext.upsert({
        where: { employeeId },
        create: {
          employeeId,
          canAccessTasks: leoContext.canAccessTasks ?? true,
          canAccessProjects: leoContext.canAccessProjects ?? true,
          canAccessClients: leoContext.canAccessClients ?? false,
          canAccessContacts: leoContext.canAccessContacts ?? false,
          canAccessFinancials: leoContext.canAccessFinancials ?? false,
          canAccessTeam: leoContext.canAccessTeam ?? false,
          canAccessOpportunities: leoContext.canAccessOpportunities ?? false,
          customInstructions: leoContext.customInstructions || null,
          restrictedTopics: leoContext.restrictedTopics || null,
        },
        update: {
          canAccessTasks: leoContext.canAccessTasks,
          canAccessProjects: leoContext.canAccessProjects,
          canAccessClients: leoContext.canAccessClients,
          canAccessContacts: leoContext.canAccessContacts,
          canAccessFinancials: leoContext.canAccessFinancials,
          canAccessTeam: leoContext.canAccessTeam,
          canAccessOpportunities: leoContext.canAccessOpportunities,
          customInstructions: leoContext.customInstructions,
          restrictedTopics: leoContext.restrictedTopics,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating employee access:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
