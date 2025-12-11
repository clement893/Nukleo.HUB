import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const period = searchParams.get("period") || "week"; // day, week, month, year

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    // Calculer les dates de début selon la période
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }

    // Récupérer les entrées de temps
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId,
        startTime: { gte: startDate },
        status: "completed",
      },
      orderBy: { startTime: "desc" },
    });

    // Calculer les statistiques
    const totalMinutes = timeEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);
    const billableMinutes = timeEntries
      .filter((e) => e.billable)
      .reduce((acc, entry) => acc + (entry.duration || 0), 0);
    const nonBillableMinutes = totalMinutes - billableMinutes;

    // Grouper par jour
    const entriesByDay: Record<string, number> = {};
    timeEntries.forEach((entry) => {
      const day = entry.startTime.toISOString().split("T")[0];
      entriesByDay[day] = (entriesByDay[day] || 0) + (entry.duration || 0);
    });

    // Grouper par projet
    const entriesByProject: Record<string, { minutes: number; projectId: string }> = {};
    timeEntries.forEach((entry) => {
      if (entry.projectId) {
        if (!entriesByProject[entry.projectId]) {
          entriesByProject[entry.projectId] = { minutes: 0, projectId: entry.projectId };
        }
        entriesByProject[entry.projectId].minutes += entry.duration || 0;
      }
    });

    // Grouper par tâche
    const entriesByTask: Record<string, { minutes: number; taskId: string }> = {};
    timeEntries.forEach((entry) => {
      if (entry.taskId) {
        if (!entriesByTask[entry.taskId]) {
          entriesByTask[entry.taskId] = { minutes: 0, taskId: entry.taskId };
        }
        entriesByTask[entry.taskId].minutes += entry.duration || 0;
      }
    });

    // Timer en cours
    const runningEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
        status: "running",
      },
    });

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 100) / 100,
      billableMinutes,
      billableHours: Math.round(billableMinutes / 60 * 100) / 100,
      nonBillableMinutes,
      nonBillableHours: Math.round(nonBillableMinutes / 60 * 100) / 100,
      billablePercentage: totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0,
      entriesCount: timeEntries.length,
      entriesByDay,
      entriesByProject: Object.values(entriesByProject),
      entriesByTask: Object.values(entriesByTask),
      runningEntry,
      recentEntries: timeEntries.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching time stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch time stats" },
      { status: 500 }
    );
  }
}
