import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// Priority weights for workload calculation
const PRIORITY_WEIGHTS: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export async function GET(request: NextRequest) {
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
      totalWeight: number;
      byDepartment: Record<string, { count: number; weight: number }>;
      byEmployee: Record<string, { count: number; weight: number; name: string }>;
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
        totalWeight: 0,
        byDepartment: {
          Lab: { count: 0, weight: 0 },
          Bureau: { count: 0, weight: 0 },
          Studio: { count: 0, weight: 0 },
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

      const weight = PRIORITY_WEIGHTS[task.priority || "medium"] || 2;
      const week = weeklyWorkload[targetWeekKey];
      
      week.tasks.push(task);
      week.totalWeight += weight;

      // By department
      const dept = task.department || "Lab";
      if (week.byDepartment[dept]) {
        week.byDepartment[dept].count++;
        week.byDepartment[dept].weight += weight;
      }

      // By employee (if assigned)
      if (task.assignedEmployee) {
        const empId = task.assignedEmployee.id;
        if (!week.byEmployee[empId]) {
          week.byEmployee[empId] = {
            count: 0,
            weight: 0,
            name: task.assignedEmployee.name,
          };
        }
        week.byEmployee[empId].count++;
        week.byEmployee[empId].weight += weight;
      }
    });

    // Calculate employee workload summary
    const employeeWorkload = employees.map((emp) => {
      const empTasks = tasks.filter(
        (t) => t.assignedEmployee?.id === emp.id || 
               (t.department === emp.department && !t.assignedEmployee)
      );
      
      const totalWeight = empTasks.reduce(
        (sum, t) => sum + (PRIORITY_WEIGHTS[t.priority || "medium"] || 2),
        0
      );

      const urgentTasks = empTasks.filter((t) => t.priority === "high").length;
      const overdueTasks = empTasks.filter((t) => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < today;
      }).length;

      // Calculate capacity (assume 5 weight points per week is normal)
      const normalCapacity = 5 * weeks;
      const loadPercentage = Math.round((totalWeight / normalCapacity) * 100);

      return {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        role: emp.role,
        currentTask: emp.currentTask?.title || null,
        isAvailable: !emp.currentTaskId,
        taskCount: empTasks.length,
        totalWeight,
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
      
      const totalWeight = deptTasks.reduce(
        (sum, t) => sum + (PRIORITY_WEIGHTS[t.priority || "medium"] || 2),
        0
      );

      const capacity = deptEmployees.length * 5 * weeks;
      const loadPercentage = capacity > 0 ? Math.round((totalWeight / capacity) * 100) : 0;

      return {
        department: dept,
        employeeCount: deptEmployees.length,
        availableEmployees: deptEmployees.filter((e) => !e.currentTaskId).length,
        taskCount: deptTasks.length,
        totalWeight,
        capacity,
        loadPercentage,
        status: loadPercentage > 120 ? "overloaded" : loadPercentage > 80 ? "busy" : loadPercentage > 40 ? "normal" : "available",
      };
    });

    // Overall summary
    const summary = {
      totalEmployees: employees.length,
      availableEmployees: employees.filter((e) => !e.currentTaskId).length,
      totalTasks: tasks.length,
      urgentTasks: tasks.filter((t) => t.priority === "high").length,
      overdueTasks: tasks.filter((t) => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < today;
      }).length,
      totalWeight: tasks.reduce(
        (sum, t) => sum + (PRIORITY_WEIGHTS[t.priority || "medium"] || 2),
        0
      ),
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
