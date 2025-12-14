import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM
    const projectId = searchParams.get("projectId");
    const employeeId = searchParams.get("employeeId");

    // Calculer les dates de début et fin du mois
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
    } else {
      // Par défaut, mois en cours
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Construire le filtre
    const where: Record<string, unknown> = {
      status: "completed",
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Récupérer les entrées de temps
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      orderBy: { startTime: "asc" },
    });

    // Récupérer les employés et projets pour les références
    const [employees, projects] = await Promise.all([
      prisma.employee.findMany(),
      prisma.project.findMany(),
    ]);

    const employeesMap = new Map(employees.map((e) => [e.id, e]));
    const projectsMap = new Map(projects.map((p) => [p.id, p]));

    // Calculer les statistiques globales
    const totalMinutes = timeEntries.reduce((acc, e) => acc + (e.duration || 0), 0);
    const billableMinutes = timeEntries.filter((e) => e.billable).reduce((acc, e) => acc + (e.duration || 0), 0);
    const nonBillableMinutes = totalMinutes - billableMinutes;

    // Grouper par projet
    const byProject: Record<string, {
      projectId: string;
      projectName: string;
      client: string | null;
      totalMinutes: number;
      billableMinutes: number;
      entries: number;
      employees: Record<string, { employeeId: string; employeeName: string; minutes: number; billableMinutes: number }>;
    }> = {};

    // Grouper par employé
    const byEmployee: Record<string, {
      employeeId: string;
      employeeName: string;
      department: string;
      totalMinutes: number;
      billableMinutes: number;
      entries: number;
      projects: Record<string, { projectId: string; projectName: string; minutes: number; billableMinutes: number }>;
    }> = {};

    timeEntries.forEach((entry) => {
      const employee = employeesMap.get(entry.employeeId);
      const project = entry.projectId ? projectsMap.get(entry.projectId) : null;
      const duration = entry.duration || 0;
      const billableDuration = entry.billable ? duration : 0;

      // Par projet
      const projectKey = entry.projectId || "no-project";
      if (!byProject[projectKey]) {
        byProject[projectKey] = {
          projectId: entry.projectId || "",
          projectName: project?.name || "Sans projet",
          client: project?.client || null,
          totalMinutes: 0,
          billableMinutes: 0,
          entries: 0,
          employees: {},
        };
      }
      byProject[projectKey].totalMinutes += duration;
      byProject[projectKey].billableMinutes += billableDuration;
      byProject[projectKey].entries += 1;

      if (employee) {
        if (!byProject[projectKey].employees[employee.id]) {
          byProject[projectKey].employees[employee.id] = {
            employeeId: employee.id,
            employeeName: employee.name,
            minutes: 0,
            billableMinutes: 0,
          };
        }
        byProject[projectKey].employees[employee.id].minutes += duration;
        byProject[projectKey].employees[employee.id].billableMinutes += billableDuration;
      }

      // Par employé
      if (employee) {
        if (!byEmployee[employee.id]) {
          byEmployee[employee.id] = {
            employeeId: employee.id,
            employeeName: employee.name,
            department: employee.department,
            totalMinutes: 0,
            billableMinutes: 0,
            entries: 0,
            projects: {},
          };
        }
        byEmployee[employee.id].totalMinutes += duration;
        byEmployee[employee.id].billableMinutes += billableDuration;
        byEmployee[employee.id].entries += 1;

        if (!byEmployee[employee.id].projects[projectKey]) {
          byEmployee[employee.id].projects[projectKey] = {
            projectId: entry.projectId || "",
            projectName: project?.name || "Sans projet",
            minutes: 0,
            billableMinutes: 0,
          };
        }
        byEmployee[employee.id].projects[projectKey].minutes += duration;
        byEmployee[employee.id].projects[projectKey].billableMinutes += billableDuration;
      }
    });

    // Convertir en tableaux et trier
    const projectsReport = Object.values(byProject)
      .map((p) => ({
        ...p,
        totalHours: Math.round(p.totalMinutes / 60 * 100) / 100,
        billableHours: Math.round(p.billableMinutes / 60 * 100) / 100,
        employees: Object.values(p.employees).map((e) => ({
          ...e,
          hours: Math.round(e.minutes / 60 * 100) / 100,
          billableHours: Math.round(e.billableMinutes / 60 * 100) / 100,
        })),
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    const employeesReport = Object.values(byEmployee)
      .map((e) => ({
        ...e,
        totalHours: Math.round(e.totalMinutes / 60 * 100) / 100,
        billableHours: Math.round(e.billableMinutes / 60 * 100) / 100,
        projects: Object.values(e.projects).map((p) => ({
          ...p,
          hours: Math.round(p.minutes / 60 * 100) / 100,
          billableHours: Math.round(p.billableMinutes / 60 * 100) / 100,
        })),
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Calculer le montant estimé (basé sur les taux horaires des projets)
    let estimatedRevenue = 0;
    for (const entry of timeEntries) {
      if (entry.billable && entry.projectId) {
        const project = projectsMap.get(entry.projectId);
        const hourlyRate = project?.hourlyRate || 150; // Taux par défaut
        estimatedRevenue += ((entry.duration || 0) / 60) * hourlyRate;
      }
    }

    return NextResponse.json({
      period: {
        month: month || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 100) / 100,
        billableMinutes,
        billableHours: Math.round(billableMinutes / 60 * 100) / 100,
        nonBillableMinutes,
        nonBillableHours: Math.round(nonBillableMinutes / 60 * 100) / 100,
        billablePercentage: totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0,
        entriesCount: timeEntries.length,
        estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
        projectsCount: Object.keys(byProject).length,
        employeesCount: Object.keys(byEmployee).length,
      },
      byProject: projectsReport,
      byEmployee: employeesReport,
    });
  } catch (error) {
    console.error("Error generating billing report:", error);
    return NextResponse.json(
      { error: "Failed to generate billing report" },
      { status: 500 }
    );
  }
}
