import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department") || "";

    const where: Record<string, unknown> = {};
    if (department) {
      where.department = department;
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        currentTask: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculer les heures travaillées ce mois pour chaque employé
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const timeEntriesByEmployee = await prisma.timeEntry.groupBy({
      by: ["employeeId"],
      where: {
        startTime: { gte: startOfMonth },
      },
      _sum: { duration: true },
    });

    const timeEntriesMap = new Map(
      timeEntriesByEmployee.map((te) => [te.employeeId, (te._sum.duration || 0) / 60]) // duration is in minutes, convert to hours
    );

    // Ajouter les stats aux employés
    const employeesWithStats = employees.map((emp) => ({
      ...emp,
      hoursThisMonth: timeEntriesMap.get(emp.id) || 0,
      utilizationRate: emp.capacityHoursPerWeek > 0
        ? Math.round(((timeEntriesMap.get(emp.id) || 0) / (emp.capacityHoursPerWeek * 4)) * 100)
        : 0,
    }));

    // Stats par département
    const departmentStats = await prisma.employee.groupBy({
      by: ["department"],
      _count: { id: true },
      _sum: { capacityHoursPerWeek: true },
    });

    return NextResponse.json({
      employees: employeesWithStats,
      departmentStats: departmentStats.map((d) => ({
        department: d.department,
        count: d._count.id,
        totalCapacity: d._sum.capacityHoursPerWeek || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
