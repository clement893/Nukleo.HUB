import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // week, month, quarter, year

    // Calculer les dates pour la période
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        previousStartDate.setMonth(now.getMonth() - 6);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        break;
    }

    // KPIs globaux
    const [
      totalProjects,
      activeProjects,
      totalClients,
      totalContacts,
      totalEmployees,
      totalOpportunities,
      _totalTimeEntries,
      recentProjects,
      projectsByStatus,
      projectsByType,
      opportunitiesByStage,
      employeesByDepartment,
    ] = await Promise.all([
      // Total projets
      prisma.project.count(),
      // Projets actifs
      prisma.project.count({
        where: {
          OR: [
            { status: "Actif" },
            { status: "En cours" },
          ],
        },
      }),
      // Total clients (entreprises marquées comme client)
      prisma.company.count({
        where: { isClient: true },
      }),
      // Total contacts
      prisma.contact.count(),
      // Total employés
      prisma.employee.count(),
      // Total opportunités
      prisma.opportunity.count(),
      // Total entrées de temps ce mois
      prisma.timeEntry.count({
        where: {
          startTime: { gte: startDate },
        },
      }),
      // Projets récents
      prisma.project.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Projets par statut
      prisma.project.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { status: { not: null } },
      }),
      // Projets par type
      prisma.project.groupBy({
        by: ["projectType"],
        _count: { id: true },
        where: { projectType: { not: null } },
      }),
      // Opportunités par étape
      prisma.opportunity.groupBy({
        by: ["stage"],
        _count: { id: true },
        _sum: { value: true },
      }),
      // Employés par département
      prisma.employee.groupBy({
        by: ["department"],
        _count: { id: true },
      }),
    ]);

    // Calculer les heures totales
    const timeEntriesData = await prisma.timeEntry.aggregate({
      where: {
        startTime: { gte: startDate },
      },
      _sum: { duration: true },
    });

    // Revenus estimés (opportunités gagnées)
    const revenueData = await prisma.opportunity.aggregate({
      where: {
        stage: { contains: "Gagn" },
        closedDate: { gte: startDate },
      },
      _sum: { value: true },
    });

    // Pipeline des opportunités
    const pipelineValue = await prisma.opportunity.aggregate({
      where: {
        AND: [
          { stage: { not: { contains: "Perdu" } } },
          { stage: { not: { contains: "Gagn" } } },
        ],
      },
      _sum: { value: true },
    });

    // Activité récente (derniers logs)
    let recentActivity: Array<{
      id: string;
      action: string;
      entityType: string;
      description: string | null;
      userName: string | null;
      createdAt: Date;
    }> = [];
    
    try {
      recentActivity = await prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          entityType: true,
          description: true,
          userName: true,
          createdAt: true,
        },
      });
    } catch {
      // Table might not exist yet
    }

    // Tickets ouverts
    const openTickets = await prisma.ticket.count({
      where: {
        status: { in: ["open", "in_progress", "waiting"] },
      },
    });

    return NextResponse.json({
      kpis: {
        totalProjects,
        activeProjects,
        totalClients,
        totalContacts,
        totalEmployees,
        totalOpportunities,
        recentProjects,
        totalHours: (timeEntriesData._sum.duration || 0) / 60, // duration is in minutes, convert to hours
        revenue: revenueData._sum.value || 0,
        pipelineValue: pipelineValue._sum.value || 0,
        openTickets,
      },
      charts: {
        projectsByStatus: projectsByStatus.map((p) => ({
          status: p.status || "Non défini",
          count: p._count.id,
        })),
        projectsByType: projectsByType.map((p) => ({
          type: p.projectType || "Non défini",
          count: p._count.id,
        })),
        opportunitiesByStage: opportunitiesByStage.map((o) => ({
          stage: o.stage,
          count: o._count.id,
          value: o._sum.value || 0,
        })),
        employeesByDepartment: employeesByDepartment.map((e) => ({
          department: e.department,
          count: e._count.id,
        })),
      },
      recentActivity,
      period,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
