import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
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

    // Mettre à jour la date de dernier accès
    await prisma.employeePortal.update({
      where: { id: portal.id },
      data: { lastAccess: new Date() },
    });

    const employee = portal.employee;

    // Récupérer les tâches assignées
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { currentEmployee: { id: employee.id } },
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

    // Récupérer les projets en cours
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { status: "Actif" },
          { status: "En cours" },
        ],
        tasks: {
          some: {
            currentEmployee: { id: employee.id },
          },
        },
      },
      select: {
        id: true,
        name: true,
        client: true,
        status: true,
        startDate: true,
        endDate: true,
        progress: true,
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
