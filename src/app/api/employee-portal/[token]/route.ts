import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Trouver le portail avec le token
    const portal = await prisma.employeePortal.findUnique({
      where: { token },
      include: {
        employee: {
          include: {
            currentTask: {
              include: {
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
        },
      },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json(
        { error: "Portail non trouvé ou désactivé" },
        { status: 404 }
      );
    }

    // Vérifier si le token a expiré
    if (portal.expiresAt && new Date(portal.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Ce lien d'accès a expiré. Veuillez contacter l'administration." },
        { status: 403 }
      );
    }

    // Mettre à jour la date de dernier accès
    await prisma.employeePortal.update({
      where: { id: portal.id },
      data: { lastAccess: new Date() },
    });

    const employee = portal.employee;

    // Récupérer les accès de l'employé
    const employeeAccess = await prisma.employeeAccess.findUnique({
      where: { employeeId: employee.id },
    });

    // Déterminer les projets autorisés
    let allowedProjectIds: string[] | null = null;
    let allowedClientIds: string[] | null = null;
    
    if (employeeAccess && employeeAccess.accessType === "selected") {
      if (employeeAccess.projectAccess && employeeAccess.projectAccess !== "*") {
        allowedProjectIds = employeeAccess.projectAccess.split(",").filter(Boolean);
      }
      if (employeeAccess.clientAccess && employeeAccess.clientAccess !== "*") {
        allowedClientIds = employeeAccess.clientAccess.split(",").filter(Boolean);
      }
    }

    // Récupérer les tâches assignées
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignedEmployee: { id: employee.id } },
          { zone: { in: ["shelf", "current"] }, department: employee.department },
        ],
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
      orderBy: [{ zone: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
      take: 20,
    });

    // Récupérer les projets en cours (filtrés selon les accès)
    const projectWhereClause: Record<string, unknown> = {
      OR: [
        { status: "Actif" },
        { status: "En cours" },
      ],
      tasks: {
        some: {
          assignedEmployee: { id: employee.id },
        },
      },
    };
    
    // Appliquer le filtre par projet si défini
    if (allowedProjectIds) {
      projectWhereClause.id = { in: allowedProjectIds };
    }
    
    // Appliquer le filtre par client si défini
    if (allowedClientIds) {
      projectWhereClause.companyId = { in: allowedClientIds };
    }
    
    const projects = await prisma.project.findMany({
      where: projectWhereClause,
      select: {
        id: true,
        name: true,
        client: true,
        status: true,
        timeline: true,
      },
      take: 10,
    });

    // Récupérer les entrées de temps récentes
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: employee.id,
        startTime: { gte: startOfWeek },
      },
      orderBy: { startTime: "desc" },
      take: 20,
    });

    // Calculer les heures cette semaine
    const hoursThisWeek = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;

    // Récupérer les demandes en cours
    const requests = await prisma.employeeRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Récupérer les événements à venir
    const events = await prisma.employeeEvent.findMany({
      where: {
        employeeId: employee.id,
        startDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
      take: 10,
    });

    // Récupérer les documents récents
    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        photoUrl: employee.photoUrl,
        role: employee.role,
        department: employee.department,
        capacityHoursPerWeek: employee.capacityHoursPerWeek,
        currentTask: employee.currentTask,
        onboardingCompleted: employee.onboardingCompleted,
      },
      stats: {
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        tasksInProgress: tasks.filter(t => t.status === "in_progress").length,
        tasksTodo: tasks.filter(t => t.status === "todo").length,
        projectsActive: projects.length,
        pendingRequests: requests.filter(r => r.status === "pending").length,
        upcomingEvents: events.length,
      },
      tasks,
      projects,
      timeEntries,
      requests,
      events,
      documents,
    });
  } catch (error) {
    console.error("Error fetching employee portal:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
