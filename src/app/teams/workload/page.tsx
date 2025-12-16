"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Building2,
  Calendar,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface WorkloadData {
  summary: {
    totalEmployees: number;
    availableEmployees: number;
    totalTasks: number;
    urgentTasks: number;
    overdueTasks: number;
    totalHours: number;
    totalCapacity: number;
    loadPercentage: number;
  };
  weeklyWorkload: Array<{
    weekStart: string;
    weekNumber: number;
    tasks: Array<{ id: string; title: string; priority: string; estimatedHours?: number }>;
    totalHours: number;
    byDepartment: Record<string, { count: number; hours: number }>;
    byEmployee: Record<string, { count: number; hours: number; name: string }>;
  }>;
  employeeWorkload: Array<{
    id: string;
    name: string;
    department: string;
    role: string;
    photoUrl?: string;
    capacityHoursPerWeek: number;
    currentTask: string | null;
    isAvailable: boolean;
    taskCount: number;
    totalHours: number;
    urgentTasks: number;
    overdueTasks: number;
    loadPercentage: number;
    status: string;
  }>;
  departmentWorkload: Array<{
    department: string;
    employeeCount: number;
    availableEmployees: number;
    taskCount: number;
    totalHours: number;
    totalCapacity: number;
    loadPercentage: number;
    status: string;
  }>;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  overloaded: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30" },
  busy: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
  normal: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  available: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30" },
};

const DEPT_COLORS: Record<string, string> = {
  Lab: "bg-purple-500",
  Bureau: "bg-blue-500",
  Studio: "bg-green-500",
};

export default function WorkloadPage() {
  const [data, setData] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState(4);
  const [selectedDepartment, _setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkload();
  }, [weeks]);

  const fetchWorkload = async () => {
    setLoading(true);
    try {
      const url = `/api/workload?weeks=${weeks}${selectedDepartment ? `&department=${selectedDepartment}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching workload:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatWeekLabel = (weekStart: string, weekNumber: number) => {
    const date = new Date(weekStart);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 6);
    return `S${weekNumber} (${date.getDate()}/${date.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1})`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "overloaded": return "Surchargé";
      case "busy": return "Chargé";
      case "normal": return "Normal";
      case "available": return "Disponible";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Erreur de chargement des données</p>
        </main>
      </div>
    );
  }

  const maxWeekHours = Math.max(...data.weeklyWorkload.map(w => w.totalHours), 1);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Charge de travail</h1>
            <p className="text-muted-foreground mt-1">Visualisez la charge à venir par employé et département</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
              className="px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value={2}>2 semaines</option>
              <option value={4}>4 semaines</option>
              <option value={8}>8 semaines</option>
              <option value={12}>12 semaines</option>
            </select>
            <button
              onClick={fetchWorkload}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.summary.totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Employés ({data.summary.availableEmployees} dispo)</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.summary.totalTasks}</p>
                <p className="text-xs text-muted-foreground">Tâches à venir</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.summary.urgentTasks}</p>
                <p className="text-xs text-muted-foreground">Urgentes</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.summary.overdueTasks}</p>
                <p className="text-xs text-muted-foreground">En retard</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.summary.totalHours}h</p>
                <p className="text-xs text-muted-foreground">Heures planifiées</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Department Workload */}
          <div className="lg:col-span-1 p-6 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Charge par département
            </h2>
            <div className="space-y-4">
              {data.departmentWorkload.map((dept) => {
                const colors = STATUS_COLORS[dept.status] || STATUS_COLORS.normal;
                return (
                  <div key={dept.department} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${DEPT_COLORS[dept.department]}`} />
                        <span className="font-medium text-foreground">{dept.department}</span>
                      </div>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        {getStatusLabel(dept.status)}
                      </span>
                    </div>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                          dept.loadPercentage > 100 ? "bg-red-500" : 
                          dept.loadPercentage > 80 ? "bg-orange-500" : 
                          dept.loadPercentage > 40 ? "bg-blue-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(dept.loadPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{dept.employeeCount} employés ({dept.availableEmployees} dispo)</span>
                      <span>{dept.loadPercentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Timeline */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Charge par semaine
            </h2>
            <div className="space-y-3">
              {data.weeklyWorkload.map((week, _index) => (
                <div key={week.weekStart} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {formatWeekLabel(week.weekStart, week.weekNumber)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {week.tasks.length} tâches • {week.totalHours}h
                    </span>
                  </div>
                  <div className="relative h-8 bg-muted rounded-lg overflow-hidden flex">
                    {["Lab", "Bureau", "Studio"].map((dept) => {
                      const deptData = week.byDepartment[dept];
                      if (!deptData || deptData.hours === 0) return null;
                      const width = (deptData.hours / maxWeekHours) * 100;
                      return (
                        <div
                          key={dept}
                          className={`h-full ${DEPT_COLORS[dept]} flex items-center justify-center text-xs text-white font-medium`}
                          style={{ width: `${width}%` }}
                          title={`${dept}: ${deptData.count} tâches (${deptData.hours}h)`}
                        >
                          {width > 15 && `${dept}`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              {["Lab", "Bureau", "Studio"].map((dept) => (
                <div key={dept} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${DEPT_COLORS[dept]}`} />
                  <span className="text-xs text-muted-foreground">{dept}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Workload */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Charge par employé
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employé</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Département</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Tâches</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Heures</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Capacité</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Urgentes</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">En retard</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Charge</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.employeeWorkload.map((emp) => {
                  const colors = STATUS_COLORS[emp.status] || STATUS_COLORS.normal;
                  return (
                    <tr key={emp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {emp.photoUrl ? (
                              <img 
                                src={emp.photoUrl} 
                                alt={emp.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary text-xs font-semibold">
                                {emp.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                              emp.isAvailable ? 'bg-green-500' : 'bg-orange-500'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{emp.name}</p>
                            {emp.role && <p className="text-xs text-muted-foreground">{emp.role}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.department === "Lab" ? "bg-purple-500/10 text-purple-500" :
                          emp.department === "Bureau" ? "bg-blue-500/10 text-blue-500" :
                          "bg-green-500/10 text-green-500"
                        }`}>
                          {emp.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-foreground">{emp.taskCount}</td>
                      <td className="py-3 px-4 text-center text-foreground">{emp.totalHours}h</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{emp.capacityHoursPerWeek}h/sem</td>
                      <td className="py-3 px-4 text-center">
                        {emp.urgentTasks > 0 ? (
                          <span className="text-red-500 font-medium">{emp.urgentTasks}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {emp.overdueTasks > 0 ? (
                          <span className="text-orange-500 font-medium">{emp.overdueTasks}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                emp.loadPercentage > 100 ? "bg-red-500" : 
                                emp.loadPercentage > 80 ? "bg-orange-500" : 
                                emp.loadPercentage > 40 ? "bg-blue-500" : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(emp.loadPercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{emp.loadPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {getStatusLabel(emp.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.employeeWorkload.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun employé trouvé
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
