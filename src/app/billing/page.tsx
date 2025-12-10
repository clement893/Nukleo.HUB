"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  FileText,
  Download,
  Calendar,
  Clock,
  DollarSign,
  Users,
  FolderOpen,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Building2,
  Filter,
  BarChart3,
  PieChart,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  client: string | null;
}

interface EmployeeDetail {
  employeeId: string;
  employeeName: string;
  hours: number;
  billableHours: number;
  minutes: number;
  billableMinutes: number;
}

interface ProjectDetail {
  projectId: string;
  projectName: string;
  hours: number;
  billableHours: number;
  minutes: number;
  billableMinutes: number;
}

interface ProjectReport {
  projectId: string;
  projectName: string;
  client: string | null;
  totalMinutes: number;
  billableMinutes: number;
  totalHours: number;
  billableHours: number;
  entries: number;
  employees: EmployeeDetail[];
}

interface EmployeeReport {
  employeeId: string;
  employeeName: string;
  department: string;
  totalMinutes: number;
  billableMinutes: number;
  totalHours: number;
  billableHours: number;
  entries: number;
  projects: ProjectDetail[];
}

interface BillingReport {
  period: {
    month: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalMinutes: number;
    totalHours: number;
    billableMinutes: number;
    billableHours: number;
    nonBillableMinutes: number;
    nonBillableHours: number;
    billablePercentage: number;
    entriesCount: number;
    estimatedRevenue: number;
    projectsCount: number;
    employeesCount: number;
  };
  byProject: ProjectReport[];
  byEmployee: EmployeeReport[];
}

export default function BillingPage() {
  const [report, setReport] = useState<BillingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [viewMode, setViewMode] = useState<"project" | "employee">("project");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterProject, setFilterProject] = useState<string>("");
  const [filterEmployee, setFilterEmployee] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [selectedMonth, filterProject, filterEmployee]);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const [empRes, projRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/projects"),
      ]);
      const [empData, projData] = await Promise.all([empRes.json(), projRes.json()]);
      setEmployees(empData);
      setProjects(projData);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/billing-reports?month=${selectedMonth}`;
      if (filterProject) url += `&projectId=${filterProject}`;
      if (filterEmployee) url += `&employeeId=${filterEmployee}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error("Error fetching report:", error);
    }
    setLoading(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      options.push({
        value,
        label: date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      });
    }
    return options;
  };

  const exportCSV = () => {
    if (!report) return;

    let csv = "Type,Nom,Client/Département,Heures totales,Heures facturables,Entrées\n";

    if (viewMode === "project") {
      report.byProject.forEach((p) => {
        csv += `Projet,"${p.projectName}","${p.client || ""}",${p.totalHours},${p.billableHours},${p.entries}\n`;
        p.employees.forEach((e) => {
          csv += `  Employé,"${e.employeeName}",,${e.hours},${e.billableHours},\n`;
        });
      });
    } else {
      report.byEmployee.forEach((e) => {
        csv += `Employé,"${e.employeeName}","${e.department}",${e.totalHours},${e.billableHours},${e.entries}\n`;
        e.projects.forEach((p) => {
          csv += `  Projet,"${p.projectName}",,${p.hours},${p.billableHours},\n`;
        });
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-facturation-${selectedMonth}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-64 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Rapports de facturation</h1>
              <p className="text-sm text-muted-foreground">Suivi des heures et revenus par projet et employé</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/billing/quotes"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Devis
              </a>
              <button
                onClick={() => window.open(`/api/billing-reports/pdf?month=${selectedMonth}`, '_blank')}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <FileText className="h-4 w-4" />
                Voir PDF
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {generateMonthOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Tous les projets</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Tous les employés</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 ml-auto bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode("project")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "project"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                Par projet
              </button>
              <button
                onClick={() => setViewMode("employee")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "employee"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4" />
                Par employé
              </button>
            </div>
          </div>

          {/* Summary cards */}
          {report && (
            <div className="grid grid-cols-5 gap-4 mb-8">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Clock className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{report.summary.totalHours}h</p>
                    <p className="text-sm text-muted-foreground">Heures totales</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{report.summary.billableHours}h</p>
                    <p className="text-sm text-muted-foreground">Heures facturables</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{report.summary.billablePercentage}%</p>
                    <p className="text-sm text-muted-foreground">Taux facturable</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(report.summary.estimatedRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenus estimés</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/10">
                    <FileText className="h-5 w-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{report.summary.entriesCount}</p>
                    <p className="text-sm text-muted-foreground">Entrées de temps</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report table */}
          {report && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  {viewMode === "project" ? (
                    <>
                      <FolderOpen className="h-5 w-5" />
                      Rapport par projet - {getMonthName(selectedMonth)}
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5" />
                      Rapport par employé - {getMonthName(selectedMonth)}
                    </>
                  )}
                </h2>
              </div>

              {viewMode === "project" ? (
                <div className="divide-y divide-border">
                  {report.byProject.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Aucune donnée pour cette période
                    </div>
                  ) : (
                    report.byProject.map((project) => (
                      <div key={project.projectId || "no-project"}>
                        <button
                          onClick={() => toggleExpand(project.projectId || "no-project")}
                          className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                        >
                          {expandedItems.has(project.projectId || "no-project") ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{project.projectName}</p>
                            {project.client && (
                              <p className="text-sm text-muted-foreground">{project.client}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-8 text-right">
                            <div>
                              <p className="font-medium text-foreground">{project.totalHours}h</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                            <div>
                              <p className="font-medium text-emerald-500">{project.billableHours}h</p>
                              <p className="text-xs text-muted-foreground">Facturable</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{project.entries}</p>
                              <p className="text-xs text-muted-foreground">Entrées</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{project.employees.length}</p>
                              <p className="text-xs text-muted-foreground">Employés</p>
                            </div>
                          </div>
                        </button>
                        {expandedItems.has(project.projectId || "no-project") && (
                          <div className="bg-muted/20 px-6 py-2 border-t border-border">
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs text-muted-foreground uppercase">
                                  <th className="text-left py-2 pl-10">Employé</th>
                                  <th className="text-right py-2">Heures totales</th>
                                  <th className="text-right py-2">Heures facturables</th>
                                </tr>
                              </thead>
                              <tbody>
                                {project.employees.map((emp) => (
                                  <tr key={emp.employeeId} className="border-t border-border/50">
                                    <td className="py-2 pl-10 text-foreground">{emp.employeeName}</td>
                                    <td className="py-2 text-right text-foreground">{emp.hours}h</td>
                                    <td className="py-2 text-right text-emerald-500">{emp.billableHours}h</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {report.byEmployee.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Aucune donnée pour cette période
                    </div>
                  ) : (
                    report.byEmployee.map((employee) => (
                      <div key={employee.employeeId}>
                        <button
                          onClick={() => toggleExpand(employee.employeeId)}
                          className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                        >
                          {expandedItems.has(employee.employeeId) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{employee.employeeName}</p>
                            <p className="text-sm text-muted-foreground">{employee.department}</p>
                          </div>
                          <div className="grid grid-cols-4 gap-8 text-right">
                            <div>
                              <p className="font-medium text-foreground">{employee.totalHours}h</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                            <div>
                              <p className="font-medium text-emerald-500">{employee.billableHours}h</p>
                              <p className="text-xs text-muted-foreground">Facturable</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{employee.entries}</p>
                              <p className="text-xs text-muted-foreground">Entrées</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{employee.projects.length}</p>
                              <p className="text-xs text-muted-foreground">Projets</p>
                            </div>
                          </div>
                        </button>
                        {expandedItems.has(employee.employeeId) && (
                          <div className="bg-muted/20 px-6 py-2 border-t border-border">
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs text-muted-foreground uppercase">
                                  <th className="text-left py-2 pl-10">Projet</th>
                                  <th className="text-right py-2">Heures totales</th>
                                  <th className="text-right py-2">Heures facturables</th>
                                </tr>
                              </thead>
                              <tbody>
                                {employee.projects.map((proj) => (
                                  <tr key={proj.projectId || "no-project"} className="border-t border-border/50">
                                    <td className="py-2 pl-10 text-foreground">{proj.projectName}</td>
                                    <td className="py-2 text-right text-foreground">{proj.hours}h</td>
                                    <td className="py-2 text-right text-emerald-500">{proj.billableHours}h</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
