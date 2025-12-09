"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  User,
  Clock,
  Calendar,
  Timer,
  Play,
  Square,
  TrendingUp,
  FolderOpen,
  CheckCircle2,
  BarChart3,
  Linkedin,
  Mail,
  Briefcase,
  Edit,
  Trash2,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  role: string | null;
  department: string;
  capacity: number | null;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  taskId: string | null;
  projectId: string | null;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  billable: boolean;
  status: string;
  notes: string | null;
}

interface Task {
  id: string;
  title: string;
  projectId: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface TimeStats {
  period: string;
  totalMinutes: number;
  totalHours: number;
  billableMinutes: number;
  billableHours: number;
  billablePercentage: number;
  entriesCount: number;
  entriesByDay: Record<string, number>;
  entriesByProject: { minutes: number; projectId: string }[];
  runningEntry: TimeEntry | null;
  recentEntries: TimeEntry[];
}

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("week");
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id, selectedPeriod]);

  // Timer update
  useEffect(() => {
    if (timeStats?.runningEntry) {
      const interval = setInterval(() => {
        const start = new Date(timeStats.runningEntry!.startTime).getTime();
        setTimerSeconds(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeStats?.runningEntry]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employee
      const empRes = await fetch(`/api/employees/${resolvedParams.id}`);
      const empData = await empRes.json();
      setEmployee(empData);

      // Fetch time stats
      const statsRes = await fetch(`/api/time-entries/stats?employeeId=${resolvedParams.id}&period=${selectedPeriod}`);
      const statsData = await statsRes.json();
      setTimeStats(statsData);

      // Fetch all time entries for the period
      const entriesRes = await fetch(`/api/time-entries?employeeId=${resolvedParams.id}`);
      const entriesData = await entriesRes.json();
      setTimeEntries(entriesData);

      // Fetch tasks and projects for reference
      const [tasksRes, projectsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
      ]);
      const [tasksData, projectsData] = await Promise.all([tasksRes.json(), projectsRes.json()]);
      
      const tasksMap: Record<string, Task> = {};
      tasksData.forEach((t: Task) => { tasksMap[t.id] = t; });
      setTasks(tasksMap);

      const projectsMap: Record<string, Project> = {};
      projectsData.forEach((p: Project) => { projectsMap[p.id] = p; });
      setProjects(projectsMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleStopTimer = async () => {
    if (!timeStats?.runningEntry) return;
    try {
      await fetch("/api/time-entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: timeStats.runningEntry.id, action: "stop" }),
      });
      fetchData();
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Supprimer cette entrée de temps ?")) return;
    try {
      await fetch(`/api/time-entries?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    return `${h}h ${m}min`;
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getDepartmentColor = (dept: string) => {
    switch (dept) {
      case "Lab": return "#8b5cf6";
      case "Bureau": return "#3b82f6";
      case "Studio": return "#ec4899";
      case "Admin": return "#9333ea";
      default: return "#6b7280";
    }
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

  if (!employee) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-64 flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Employé non trouvé</p>
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
          <div className="flex h-16 items-center gap-4 px-8">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Profil employé</h1>
              <p className="text-sm text-muted-foreground">Time tracking et statistiques</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-3 gap-6">
            {/* Left column - Profile */}
            <div className="space-y-6">
              {/* Profile card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4"
                    style={{ backgroundColor: getDepartmentColor(employee.department) }}
                  >
                    {employee.photoUrl ? (
                      <img
                        src={employee.photoUrl}
                        alt={employee.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(employee.name)
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{employee.name}</h2>
                  <p className="text-muted-foreground">{employee.role || "Membre"}</p>
                  <span
                    className="mt-2 px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${getDepartmentColor(employee.department)}20`,
                      color: getDepartmentColor(employee.department),
                    }}
                  >
                    {employee.department}
                  </span>

                  <div className="flex gap-3 mt-4">
                    {employee.email && (
                      <a
                        href={`mailto:${employee.email}`}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        title={employee.email}
                      >
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </a>
                    )}
                    {employee.linkedinUrl && (
                      <a
                        href={employee.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Linkedin className="h-5 w-5 text-blue-500" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Capacité hebdo</span>
                    <span className="font-medium text-foreground">{employee.capacity || 40}h</span>
                  </div>
                </div>
              </div>

              {/* Running timer */}
              {timeStats?.runningEntry && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Timer className="h-5 w-5 text-emerald-500 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Timer en cours</p>
                      <p className="text-sm text-muted-foreground">
                        {tasks[timeStats.runningEntry.taskId || ""]?.title || "Tâche inconnue"}
                      </p>
                    </div>
                  </div>
                  <div className="text-4xl font-mono font-bold text-emerald-500 text-center my-4">
                    {formatTime(timerSeconds)}
                  </div>
                  <button
                    onClick={handleStopTimer}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <Square className="h-4 w-4" />
                    Arrêter le timer
                  </button>
                </div>
              )}
            </div>

            {/* Right column - Stats and entries */}
            <div className="col-span-2 space-y-6">
              {/* Period selector */}
              <div className="flex gap-2">
                {(["day", "week", "month"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {period === "day" ? "Aujourd'hui" : period === "week" ? "Cette semaine" : "Ce mois"}
                  </button>
                ))}
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Clock className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{timeStats?.totalHours || 0}h</p>
                      <p className="text-sm text-muted-foreground">Temps total</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{timeStats?.billableHours || 0}h</p>
                      <p className="text-sm text-muted-foreground">Facturable</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <BarChart3 className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{timeStats?.billablePercentage || 0}%</p>
                      <p className="text-sm text-muted-foreground">Taux facturable</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{timeStats?.entriesCount || 0}</p>
                      <p className="text-sm text-muted-foreground">Entrées</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time by project */}
              {timeStats?.entriesByProject && timeStats.entriesByProject.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Temps par projet
                  </h3>
                  <div className="space-y-3">
                    {timeStats.entriesByProject.map((entry) => {
                      const project = projects[entry.projectId];
                      const percentage = timeStats.totalMinutes > 0
                        ? Math.round((entry.minutes / timeStats.totalMinutes) * 100)
                        : 0;
                      return (
                        <div key={entry.projectId}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground">{project?.name || "Projet inconnu"}</span>
                            <span className="text-muted-foreground">{formatDuration(entry.minutes)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent entries */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Entrées de temps récentes
                </h3>
                {timeEntries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune entrée de temps</p>
                ) : (
                  <div className="space-y-3">
                    {timeEntries.slice(0, 20).map((entry) => {
                      const task = tasks[entry.taskId || ""];
                      const project = projects[entry.projectId || ""];
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                        >
                          <div className={`p-2 rounded-lg ${entry.status === "running" ? "bg-emerald-500/10" : "bg-muted"}`}>
                            {entry.status === "running" ? (
                              <Timer className="h-4 w-4 text-emerald-500 animate-pulse" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {task?.title || entry.description || "Sans titre"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {project?.name || "Pas de projet"} • {new Date(entry.startTime).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">
                              {entry.status === "running" ? (
                                <span className="text-emerald-500">En cours</span>
                              ) : (
                                formatDuration(entry.duration || 0)
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              {entry.endTime && ` - ${new Date(entry.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
