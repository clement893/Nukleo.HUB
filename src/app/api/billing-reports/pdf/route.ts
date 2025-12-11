import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const viewMode = searchParams.get("viewMode") || "project";

    // Calculer les dates
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Récupérer les données
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        status: "completed",
        startTime: { gte: startDate, lte: endDate },
      },
    });

    const [employees, projects] = await Promise.all([
      prisma.employee.findMany(),
      prisma.project.findMany(),
    ]);

    const employeesMap = new Map(employees.map((e) => [e.id, e]));
    const projectsMap = new Map(projects.map((p) => [p.id, p]));

    // Calculer les totaux
    const totalMinutes = timeEntries.reduce((acc, e) => acc + (e.duration || 0), 0);
    const billableMinutes = timeEntries.filter((e) => e.billable).reduce((acc, e) => acc + (e.duration || 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 100) / 100;
    const billableHours = Math.round(billableMinutes / 60 * 100) / 100;

    // Grouper les données
    const byProject: Record<string, { name: string; client: string | null; hours: number; billableHours: number }> = {};
    const byEmployee: Record<string, { name: string; dept: string; hours: number; billableHours: number }> = {};

    timeEntries.forEach((entry) => {
      const duration = entry.duration || 0;
      const billableDuration = entry.billable ? duration : 0;

      // Par projet
      const projectKey = entry.projectId || "no-project";
      const project = entry.projectId ? projectsMap.get(entry.projectId) : null;
      if (!byProject[projectKey]) {
        byProject[projectKey] = {
          name: project?.name || "Sans projet",
          client: project?.client || null,
          hours: 0,
          billableHours: 0,
        };
      }
      byProject[projectKey].hours += duration / 60;
      byProject[projectKey].billableHours += billableDuration / 60;

      // Par employé
      const employee = employeesMap.get(entry.employeeId);
      if (employee) {
        if (!byEmployee[employee.id]) {
          byEmployee[employee.id] = {
            name: employee.name,
            dept: employee.department,
            hours: 0,
            billableHours: 0,
          };
        }
        byEmployee[employee.id].hours += duration / 60;
        byEmployee[employee.id].billableHours += billableDuration / 60;
      }
    });

    // Générer le HTML pour le PDF
    const monthName = startDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    
    const projectRows = Object.values(byProject)
      .sort((a, b) => b.hours - a.hours)
      .map((p) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.client || "-"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${p.hours.toFixed(2)}h</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #10b981;">${p.billableHours.toFixed(2)}h</td>
        </tr>
      `).join("");

    const employeeRows = Object.values(byEmployee)
      .sort((a, b) => b.hours - a.hours)
      .map((e) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${e.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${e.dept}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${e.hours.toFixed(2)}h</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #10b981;">${e.billableHours.toFixed(2)}h</td>
        </tr>
      `).join("");

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport de facturation - ${monthName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; }
    h1 { color: #111827; margin-bottom: 8px; }
    h2 { color: #374151; margin-top: 32px; margin-bottom: 16px; }
    .subtitle { color: #6b7280; margin-bottom: 32px; }
    .summary { display: flex; gap: 24px; margin-bottom: 32px; }
    .stat { background: #f9fafb; padding: 16px; border-radius: 8px; flex: 1; }
    .stat-value { font-size: 24px; font-weight: bold; color: #111827; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 8px; background: #f3f4f6; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>Rapport de facturation</h1>
  <p class="subtitle">${monthName} - Nukleo</p>
  
  <div class="summary">
    <div class="stat">
      <div class="stat-value">${totalHours}h</div>
      <div class="stat-label">Heures totales</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #10b981;">${billableHours}h</div>
      <div class="stat-label">Heures facturables</div>
    </div>
    <div class="stat">
      <div class="stat-value">${totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0}%</div>
      <div class="stat-label">Taux facturable</div>
    </div>
    <div class="stat">
      <div class="stat-value">${timeEntries.length}</div>
      <div class="stat-label">Entrées de temps</div>
    </div>
  </div>

  <h2>Par projet</h2>
  <table>
    <thead>
      <tr>
        <th>Projet</th>
        <th>Client</th>
        <th>Heures totales</th>
        <th>Heures facturables</th>
      </tr>
    </thead>
    <tbody>
      ${projectRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #9ca3af;">Aucune donnée</td></tr>'}
    </tbody>
  </table>

  <h2>Par employé</h2>
  <table>
    <thead>
      <tr>
        <th>Employé</th>
        <th>Département</th>
        <th>Heures totales</th>
        <th>Heures facturables</th>
      </tr>
    </thead>
    <tbody>
      ${employeeRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #9ca3af;">Aucune donnée</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    Généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="rapport-facturation-${month || "current"}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF report:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}
