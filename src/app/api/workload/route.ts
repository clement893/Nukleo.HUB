import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// Helper to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper to get week start date
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const searchParams = request.nextUrl.searchParams;
    const weeks = parseInt(searchParams.get("weeks") || "4");
    const department = searchParams.get("department");

    // Get all employees with their tasks
    const employeeFilter = department ? { department } : {};
    const employees = await prisma.employee.findMany({
      where: employeeFilter,
      include: {
        currentTask: true,
      },
    });

    // Get all pending and in-progress tasks
    const tasks = await prisma.task.findMany({
      where: {
        status: { in: ["todo", "in_progress"] },
        ...(department ? { department } : {}),
      },
      include: {
        project: true,
        assignedEmployee: true,
      },
    });

    // Calculate date range
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + weeks * 7);

    // Group tasks by week
    const weeklyWorkload: Record<string, {
      weekStart: string;
      weekNumber: number;
      tasks: typeof tasks;
      totalHours: number;
      byDepartment: Record<string, { count: number; hours: number }>;
      byEmployee: Record<string, { count: number; hours: number; name: string }>;
    }> = {};

    // Initialize weeks
    for (let i = 0; i < weeks; i++) {
      const weekDate = new Date(today);
      weekDate.setDate(weekDate.getDate() + i * 7);
      const weekStart = getWeekStart(weekDate);
      const weekKey = weekStart.toISOString().split("T")[0];
      const weekNum = getWeekNumber(weekStart);
      
      weeklyWorkload[weekKey] = {
        weekStart: weekKey,
        weekNumber: weekNum,
        tasks: [],
        totalHours: 0,
        byDepartment: {
          Lab: { count: 0, hours: 0 },
          Bureau: { count: 0, hours: 0 },
          Studio: { count: 0, hours: 0 },
        },
        byEmployee: {},
      };
    }

    // Assign tasks to weeks based on due date
    tasks.forEach((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      
      // If no due date, assign to first week
      let targetWeekKey: string;
      if (!dueDate || dueDate < today) {
        targetWeekKey = Object.keys(weeklyWorkload)[0];
      } else if (dueDate > endDate) {
        // Skip tasks beyond our range
        return;
      } else {
        const weekStart = getWeekStart(dueDate);
        targetWeekKey = weekStart.toISOString().split("T")[0];
      }

      if (!weeklyWorkload[targetWeekKey]) return;

      const hours = task.estimatedHours || 2;
      const week = weeklyWorkload[targetWeekKey];
      
      week.tasks.push(task);
      week.totalHours += hours;

      // By department
      const dept = task.department || "Lab";
      if (week.byDepartment[dept]) {
        week.byDepartment[dept].count++;
        week.byDepartment[dept].hours += hours;
      }

      // By employee (if assigned)
      if (task.assignedEmployee) {
        const empId = task.assignedEmployee.id;
        if (!week.byEmployee[empId]) {
          week.byEmployee[empId] = {
            count: 0,
            hours: 0,
            name: task.assignedEmployee.name,
          };
        }
        week.byEmployee[empId].count++;
        week.byEmployee[empId].hours += hours;
      }
    });

    // Calculate employee workload summary
    const employeeWorkload = employees.map((emp) => {
      const empTasks = tasks.filter(
        (t) => t.assignedEmployee?.id === emp.id || 
               (t.department === emp.department && !t.assignedEmployee)
      );
      
      const totalHours = empTasks.reduce(
        (sum, t) => sum + (t.estimatedHours || 2),
        0
      );

      const urgentTasks = empTasks.filter((t) => t.priority === "high").length;
      const overdueTasks = empTasks.filter((t) => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < today;
      }).length;

      // Calculate capacity based on employee's weekly hours
      const capacityPerWeek = emp.capacityHoursPerWeek || 35;
      const totalCapacity = capacityPerWeek * weeks;
      const loadPercentage = totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 100) : 0;

      return {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        role: emp.role,
        photoUrl: emp.photoUrl,
        capacityHoursPerWeek: capacityPerWeek,
        currentTask: emp.currentTask?.title || null,
        isAvailable: !emp.currentTaskId,
        taskCount: empTasks.length,
        totalHours,
        urgentTasks,
        overdueTasks,
        loadPercentage,
        status: loadPercentage > 120 ? "overloaded" : loadPercentage > 80 ? "busy" : loadPercentage > 40 ? "normal" : "available",
      };
    });

    // Calculate department summary
    const departmentWorkload = ["Lab", "Bureau", "Studio"].map((dept) => {
      const deptEmployees = employees.filter((e) => e.department === dept);
      const deptTasks = tasks.filter((t) => t.department === dept);
      
      const totalHours = deptTasks.reduce(
        (sum, t) => sum + (t.estimatedHours || 2),
        0
      );

      // Sum capacity of all employees in department
      const totalCapacity = deptEmployees.reduce(
        (sum, e) => sum + ((e.capacityHoursPerWeek || 35) * weeks),
        0
      );
      const loadPercentage = totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 100) : 0;

      return {
        department: dept,
        employeeCount: deptEmployees.length,
        availableEmployees: deptEmployees.filter((e) => !e.currentTaskId).length,
        taskCount: deptTasks.length,
        totalHours,
        totalCapacity,
        loadPercentage,
        status: loadPercentage > 120 ? "overloaded" : loadPercentage > 80 ? "busy" : loadPercentage > 40 ? "normal" : "available",
      };
    });

    // Overall summary
    const totalCapacity = employees.reduce(
      (sum, e) => sum + ((e.capacityHoursPerWeek || 35) * weeks),
      0
    );
    const totalHours = tasks.reduce(
      (sum, t) => sum + (t.estimatedHours || 2),
      0
    );

    const summary = {
      totalEmployees: employees.length,
      availableEmployees: employees.filter((e) => !e.currentTaskId).length,
      totalTasks: tasks.length,
      urgentTasks: tasks.filter((t) => t.priority === "high").length,
      overdueTasks: tasks.filter((t) => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < today;
      }).length,
      totalHours,
      totalCapacity,
      loadPercentage: totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 100) : 0,
    };

    return NextResponse.json({
      summary,
      weeklyWorkload: Object.values(weeklyWorkload),
      employeeWorkload,
      departmentWorkload,
    });
  } catch (error) {
    console.error("Error calculating workload:", error);
    return NextResponse.json(
      { error: "Failed to calculate workload" },
      { status: 500 }
    );
  }
}
