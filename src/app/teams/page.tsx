"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  X,
  Users,
  Beaker,
  Building2,
  Palette,
  Clock,
  AlertTriangle,
  Package,
  Archive,
  Send,
  GripVertical,
  Sparkles,
  TrendingUp,
  Zap,
  User,
  FolderOpen,
  Shield,
  Linkedin,
  Play,
  Pause,
  Square,
  Timer,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  role: string | null;
  department: string;
  currentTask: Task | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  zone: string;
  department: string;
  projectId: string | null;
  project: { id: string; name: string } | null;
  priority: string | null;
  dueDate: string | null;
  assignedEmployee: { id: string; name: string; photoUrl: string | null } | null;
}

interface Project {
  id: string;
  name: string;
  client: string | null;
}

interface DepartmentStats {
  total: number;
  occupied: number;
  available: number;
  tasksReady: number;
  tasksPending: number;
  tasksBlocked: number;
}

const DEPARTMENTS = [
  { id: "Lab", name: "Lab", icon: Beaker, color: "#8b5cf6", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/30", textColor: "text-violet-400" },
  { id: "Bureau", name: "Bureau", icon: Building2, color: "#3b82f6", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30", textColor: "text-blue-400" },
  { id: "Studio", name: "Studio", icon: Palette, color: "#ec4899", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/30", textColor: "text-pink-400" },
  { id: "Admin", name: "Admin", icon: Shield, color: "#9333ea", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30", textColor: "text-purple-400" },
];

const ZONES = [
  { id: "shelf", name: "Shelf", description: "En attente", icon: Package, color: "#f59e0b" },
  { id: "current", name: "Current", description: "En cours", icon: Zap, color: "#10b981" },
  { id: "storage", name: "Storage", description: "Bloqué", icon: Archive, color: "#ef4444" },
  { id: "dock", name: "Dock", description: "Prêt", icon: Send, color: "#6366f1" },
];

const PRIORITIES = [
  { id: "high", name: "Urgent", color: "#ef4444", bgColor: "bg-red-500/20" },
  { id: "medium", name: "Normal", color: "#f59e0b", bgColor: "bg-amber-500/20" },
  { id: "low", name: "Cool", color: "#10b981", bgColor: "bg-emerald-500/20" },
];

export default function TeamsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDepartment, setActiveDepartment] = useState("Lab");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverEmployee, setDragOverEmployee] = useState<string | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);

  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", role: "" });
  const [newTask, setNewTask] = useState({ title: "", description: "", projectId: "", priority: "medium", dueDate: "" });

  useEffect(() => {
    fetchData();
  }, [activeDepartment]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, taskRes, projRes] = await Promise.all([
        fetch(`/api/employees?department=${activeDepartment}`),
        fetch(`/api/tasks?department=${activeDepartment}`),
        fetch("/api/projects"),
      ]);
      const [empData, taskData, projData] = await Promise.all([empRes.json(), taskRes.json(), projRes.json()]);
      setEmployees(empData);
      setTasks(taskData);
      setProjects(projData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const getDepartmentStats = (deptId: string): DepartmentStats => {
    const deptEmployees = employees.filter((e) => e.department === deptId);
    const deptTasks = tasks.filter((t) => t.department === deptId);
    const occupied = deptEmployees.filter((e) => e.currentTask !== null).length;
    return {
      total: deptEmployees.length,
      occupied,
      available: deptEmployees.length - occupied,
      tasksReady: deptTasks.filter((t) => t.zone === "dock").length,
      tasksPending: deptTasks.filter((t) => t.zone === "shelf").length,
      tasksBlocked: deptTasks.filter((t) => t.zone === "storage").length,
    };
  };

  const getZoneTasks = (zone: string) => tasks.filter((t) => t.zone === zone);
  const getPriorityInfo = (priority: string | null) => PRIORITIES.find((p) => p.id === priority) || PRIORITIES[1];
  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const activeDept = DEPARTMENTS.find((d) => d.id === activeDepartment)!;
  const stats = getDepartmentStats(activeDepartment);

  const handleAddEmployee = async () => {
    if (!newEmployee.name) return;
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEmployee, department: activeDepartment }),
      });
      if (res.ok) {
        setShowAddEmployee(false);
        setNewEmployee({ name: "", email: "", role: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding employee:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, department: activeDepartment, zone: "shelf", dueDate: newTask.dueDate || null }),
      });
      if (res.ok) {
        setShowAddTask(false);
        setNewTask({ title: "", description: "", projectId: "", priority: "medium", dueDate: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleDragStart = (task: Task) => setDraggedTask(task);
  const handleDragEnd = () => { setDraggedTask(null); setDragOverEmployee(null); setDragOverZone(null); };

  const handleDropOnEmployee = async (employeeId: string) => {
    if (!draggedTask) return;
    const employee = employees.find((e) => e.id === employeeId);
    if (employee?.currentTask && employee.currentTask.id !== draggedTask.id) {
      alert("Cet employé a déjà une tâche en cours !");
      handleDragEnd();
      return;
    }
    try {
      await fetch(`/api/tasks/${draggedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, zone: "current" }),
      });
      fetchData();
    } catch (error) {
      console.error("Error assigning task:", error);
    }
    handleDragEnd();
  };

  const handleDropOnZone = async (zone: string) => {
    if (!draggedTask) return;
    try {
      await fetch(`/api/tasks/${draggedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone, employeeId: zone === "current" ? draggedTask.assignedEmployee?.id : null }),
      });
      fetchData();
    } catch (error) {
      console.error("Error moving task:", error);
    }
    handleDragEnd();
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Supprimer cet employé ?")) return;
    try {
      await fetch(`/api/employees/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Time tracking state
  const [runningTimers, setRunningTimers] = useState<Record<string, { entryId: string; startTime: Date; taskId: string }>>({});
  const [timerSeconds, setTimerSeconds] = useState<Record<string, number>>({});

  // Charger les timers en cours au démarrage
  useEffect(() => {
    const loadRunningTimers = async () => {
      for (const emp of employees) {
        try {
          const res = await fetch(`/api/time-entries?employeeId=${emp.id}&status=running`);
          const entries = await res.json();
          if (entries.length > 0) {
            const entry = entries[0];
            setRunningTimers(prev => ({
              ...prev,
              [emp.id]: { entryId: entry.id, startTime: new Date(entry.startTime), taskId: entry.taskId }
            }));
          }
        } catch (error) {
          console.error("Error loading timers:", error);
        }
      }
    };
    if (employees.length > 0) loadRunningTimers();
  }, [employees]);

  // Mettre à jour les secondes du timer
  useEffect(() => {
    const interval = setInterval(() => {
      const newSeconds: Record<string, number> = {};
      Object.entries(runningTimers).forEach(([empId, timer]) => {
        newSeconds[empId] = Math.floor((Date.now() - timer.startTime.getTime()) / 1000);
      });
      setTimerSeconds(newSeconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimers]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = async (employeeId: string, taskId: string, projectId: string | null) => {
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, taskId, projectId }),
      });
      if (res.ok) {
        const entry = await res.json();
        setRunningTimers(prev => ({
          ...prev,
          [employeeId]: { entryId: entry.id, startTime: new Date(entry.startTime), taskId }
        }));
      }
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const handleStopTimer = async (employeeId: string) => {
    const timer = runningTimers[employeeId];
    if (!timer) return;
    try {
      await fetch("/api/time-entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: timer.entryId, action: "stop" }),
      });
      setRunningTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[employeeId];
        return newTimers;
      });
      setTimerSeconds(prev => {
        const newSeconds = { ...prev };
        delete newSeconds[employeeId];
        return newSeconds;
      });
    } catch (error) {
      console.error("Error stopping timer:", error);
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Équipes</h1>
              <p className="text-sm text-muted-foreground">Gestion des projets par département</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddEmployee(true)} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <User className="h-4 w-4" />Ajouter employé
              </button>
              <button onClick={() => setShowAddTask(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />Ajouter tâche
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Department Tabs with Stats */}
          <div className="flex gap-3 mb-6">
            {DEPARTMENTS.map((dept) => {
              const deptStats = getDepartmentStats(dept.id);
              const Icon = dept.icon;
              const isActive = activeDepartment === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveDepartment(dept.id)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? `${dept.bgColor} ${dept.borderColor} shadow-lg scale-[1.02]`
                      : "border-border hover:border-border/80 bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? dept.bgColor : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${isActive ? dept.textColor : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold ${isActive ? dept.textColor : "text-foreground"}`}>{dept.name}</div>
                    <div className="text-xs text-muted-foreground">{deptStats.total} membres • {deptStats.occupied} occupés</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className={`${activeDept.bgColor} border ${activeDept.borderColor} rounded-xl p-4 transition-all`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className={`h-4 w-4 ${activeDept.textColor}`} />
                <span className="text-sm text-muted-foreground">Capacité</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${activeDept.textColor}`}>{stats.occupied}/{stats.total}</span>
                <span className="text-sm text-muted-foreground">occupés</span>
              </div>
              <div className="mt-2 h-2 bg-background/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(stats.occupied / Math.max(stats.total, 1)) * 100}%`, backgroundColor: activeDept.color }} />
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-muted-foreground">Prêts à livrer</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400">{stats.tasksReady}</span>
                <span className="text-sm text-muted-foreground">tâches</span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border border-amber-500/30 bg-amber-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-muted-foreground">En attente</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400">{stats.tasksPending}</span>
                <span className="text-sm text-muted-foreground">tâches</span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border border-red-500/30 bg-red-500/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-muted-foreground">Bloqués</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-400">{stats.tasksBlocked}</span>
                <span className="text-sm text-muted-foreground">tâches</span>
              </div>
            </div>
          </div>

          {/* Main Content: Employee-centric view */}
          <div className="glass-card rounded-xl border border-border overflow-hidden mb-6">
            <div className={`px-6 py-4 border-b border-border ${activeDept.bgColor}`}>
              <div className="flex items-center gap-2">
                <Zap className={`h-5 w-5 ${activeDept.textColor}`} />
                <h2 className={`font-semibold ${activeDept.textColor}`}>Tâches en cours</h2>
                <span className="text-sm text-muted-foreground ml-2">— Qui travaille sur quoi ?</span>
              </div>
            </div>

            <div className="p-6">
              {employees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Aucun employé dans ce département</p>
                  <button onClick={() => setShowAddEmployee(true)} className={`px-4 py-2 rounded-lg ${activeDept.bgColor} ${activeDept.textColor} hover:opacity-80 transition-opacity`}>
                    Ajouter un employé
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {employees.map((employee) => {
                    const currentTask = employee.currentTask;
                    const isAvailable = !currentTask;
                    const isDragOver = dragOverEmployee === employee.id;

                    return (
                      <div
                        key={employee.id}
                        onDragOver={(e) => { e.preventDefault(); setDragOverEmployee(employee.id); }}
                        onDragLeave={() => setDragOverEmployee(null)}
                        onDrop={() => handleDropOnEmployee(employee.id)}
                        className={`group relative rounded-xl border-2 p-4 transition-all duration-200 ${
                          isDragOver
                            ? `${activeDept.borderColor} ${activeDept.bgColor} scale-105 shadow-xl`
                            : isAvailable
                            ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                            : "border-border bg-card hover:border-border/80"
                        }`}
                      >
                        {/* Delete button */}
                        <button onClick={() => handleDeleteEmployee(employee.id)} className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                          <X className="h-4 w-4" />
                        </button>

                        {/* Employee header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${isAvailable ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background" : ""}`} style={{ backgroundColor: activeDept.color }}>
                            {employee.photoUrl ? (
                              <img src={employee.photoUrl} alt={employee.name} className="w-full h-full rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              getInitials(employee.name)
                            )}
                            {/* Status indicator */}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background transition-colors ${isAvailable ? "bg-emerald-500" : "bg-amber-500"}`}>
                              {isAvailable && <Sparkles className="h-2 w-2 text-white absolute top-0.5 left-0.5" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link href={`/teams/employees/${employee.id}`} className="font-semibold text-foreground truncate hover:text-primary hover:underline transition-colors relative z-10 cursor-pointer" onClick={(e) => e.stopPropagation()} draggable={false}>{employee.name}</Link>
                              {employee.linkedinUrl && (
                                <a href={employee.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">{employee.role || "Membre"}</div>
                          </div>
                        </div>

                        {/* Current task or available */}
                        {currentTask ? (
                          <div
                            draggable
                            onDragStart={() => handleDragStart(currentTask)}
                            onDragEnd={handleDragEnd}
                            className="group/task relative rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md"
                            style={{ backgroundColor: `${getPriorityInfo(currentTask.priority).color}15`, borderLeft: `4px solid ${getPriorityInfo(currentTask.priority).color}` }}
                          >
                            <div className="flex items-start gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover/task:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate pr-6">{currentTask.title}</div>
                                {currentTask.project && (
                                  <div className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                                    <FolderOpen className="h-3 w-3" /> {currentTask.project.name}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityInfo(currentTask.priority).bgColor}`} style={{ color: getPriorityInfo(currentTask.priority).color }}>
                                    {getPriorityInfo(currentTask.priority).name}
                                  </span>
                                  {currentTask.dueDate && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(currentTask.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                    </span>
                                  )}
                                </div>
                                {/* Timer controls */}
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                                  {runningTimers[employee.id]?.taskId === currentTask.id ? (
                                    <>
                                      <div className="flex items-center gap-1 text-emerald-500 font-mono text-sm">
                                        <Timer className="h-3 w-3 animate-pulse" />
                                        {formatTime(timerSeconds[employee.id] || 0)}
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleStopTimer(employee.id); }}
                                        className="ml-auto p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                        title="Arrêter le timer"
                                      >
                                        <Square className="h-3 w-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleStartTimer(employee.id, currentTask.id, currentTask.projectId); }}
                                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-500 transition-colors"
                                      disabled={!!runningTimers[employee.id]}
                                      title={runningTimers[employee.id] ? "Un timer est déjà en cours" : "Démarrer le timer"}
                                    >
                                      <Play className="h-3 w-3" />
                                      Timer
                                    </button>
                                  )}
                                </div>
                              </div>
                              <button onClick={() => handleDeleteTask(currentTask.id)} className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`rounded-lg border-2 border-dashed p-4 text-center transition-all ${isDragOver ? `${activeDept.borderColor} ${activeDept.bgColor}` : "border-emerald-500/30 hover:border-emerald-500/50"}`}>
                            <Sparkles className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                            <div className="text-sm font-medium text-emerald-500">Disponible</div>
                            <div className="text-xs text-muted-foreground mt-1">Glissez une tâche ici</div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add employee card */}
                  <button
                    onClick={() => setShowAddEmployee(true)}
                    className="rounded-xl border-2 border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[180px]"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                      <Plus className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">Ajouter un membre</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Flow Bar: Other zones */}
          <div className="grid grid-cols-3 gap-4">
            {ZONES.filter((z) => z.id !== "current").map((zone) => {
              const zoneTasks = getZoneTasks(zone.id);
              const isDragOver = dragOverZone === zone.id;
              const ZoneIcon = zone.icon;

              return (
                <div
                  key={zone.id}
                  onDragOver={(e) => { e.preventDefault(); setDragOverZone(zone.id); }}
                  onDragLeave={() => setDragOverZone(null)}
                  onDrop={() => handleDropOnZone(zone.id)}
                  className={`glass-card rounded-xl border transition-all duration-200 ${isDragOver ? "border-primary shadow-xl scale-[1.02]" : "border-border hover:border-border/80"}`}
                >
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ backgroundColor: `${zone.color}10` }}>
                    <div className="flex items-center gap-2">
                      <ZoneIcon className="h-4 w-4" style={{ color: zone.color }} />
                      <span className="font-medium text-foreground">{zone.name}</span>
                      <span className="text-xs text-muted-foreground">— {zone.description}</span>
                    </div>
                    <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${zone.color}20`, color: zone.color }}>
                      {zoneTasks.length}
                    </span>
                  </div>
                  <div className="p-3 max-h-[250px] overflow-y-auto">
                    {zoneTasks.length === 0 ? (
                      <div className={`text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg transition-all ${isDragOver ? "border-primary bg-primary/5" : "border-border"}`}>
                        <ZoneIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <div className="text-sm">Zone vide</div>
                        <div className="text-xs mt-1">Glissez une tâche ici</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {zoneTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={() => handleDragStart(task)}
                            onDragEnd={handleDragEnd}
                            className={`group flex items-center gap-2 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${draggedTask?.id === task.id ? "opacity-50 scale-95" : "bg-muted/50 hover:bg-muted"}`}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getPriorityInfo(task.priority).color }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
                              {task.project && <div className="text-xs text-muted-foreground truncate flex items-center gap-1"><FolderOpen className="h-3 w-3" />{task.project.name}</div>}
                            </div>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Nouvel employé</h2>
                <p className="text-sm text-muted-foreground">Département {activeDepartment}</p>
              </div>
              <button onClick={() => setShowAddEmployee(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nom complet *</label>
                <input type="text" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="jean@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Rôle</label>
                <input type="text" value={newEmployee.role} onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="Designer, Développeur, etc." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowAddEmployee(false)} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Annuler</button>
              <button onClick={handleAddEmployee} disabled={!newEmployee.name} className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Créer l'employé</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Nouvelle tâche</h2>
                <p className="text-sm text-muted-foreground">Sera ajoutée dans Shelf</p>
              </div>
              <button onClick={() => setShowAddTask(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Titre *</label>
                <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="Titre de la tâche" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground resize-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" rows={2} placeholder="Description optionnelle" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Priorité</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
                    {PRIORITIES.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Échéance</label>
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Projet (optionnel)</label>
                <select value={newTask.projectId} onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
                  <option value="">Aucun projet</option>
                  {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowAddTask(false)} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Annuler</button>
              <button onClick={handleAddTask} disabled={!newTask.title} className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Créer la tâche</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
