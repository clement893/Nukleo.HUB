"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Beaker,
  Building2,
  Palette,
  Plus,
  User,
  GripVertical,
  Clock,
  Package,
  Archive,
  Send,
  X,
  FolderOpen,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  client: string | null;
}

interface Employee {
  id: string;
  name: string;
  email: string | null;
  photoUrl: string | null;
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
  project: Project | null;
  priority: string | null;
  dueDate: string | null;
  assignedEmployee: { id: string; name: string; photoUrl: string | null } | null;
}

const DEPARTMENTS = [
  { id: "Lab", name: "Lab", icon: Beaker, color: "bg-purple-500" },
  { id: "Bureau", name: "Bureau", icon: Building2, color: "bg-blue-500" },
  { id: "Studio", name: "Studio", icon: Palette, color: "bg-pink-500" },
];

const ZONES = [
  { id: "current", name: "Current", icon: Clock, description: "Tâche en cours" },
  { id: "shelf", name: "Shelf", icon: Package, description: "Projets qui arrivent" },
  { id: "storage", name: "Storage", icon: Archive, description: "En attente client" },
  { id: "dock", name: "Dock", icon: Send, description: "Prêt à envoyer" },
];

export default function TeamsPage() {
  const [activeDepartment, setActiveDepartment] = useState("Lab");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // New employee form
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "",
  });

  // New task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "",
    priority: "medium",
  });

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

      const [empData, taskData, projData] = await Promise.all([
        empRes.json(),
        taskRes.json(),
        projRes.json(),
      ]);

      setEmployees(empData);
      setTasks(taskData);
      setProjects(projData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name) return;

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEmployee,
          department: activeDepartment,
        }),
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
        body: JSON.stringify({
          ...newTask,
          department: activeDepartment,
          zone: "shelf",
        }),
      });

      if (res.ok) {
        setShowAddTask(false);
        setNewTask({ title: "", description: "", projectId: "", priority: "medium" });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (zone: string, employeeId?: string) => {
    if (!draggedTask) return;

    try {
      const body: Record<string, string | undefined> = { zone };
      if (zone === "current" && employeeId) {
        body.employeeId = employeeId;
      }

      await fetch(`/api/tasks/${draggedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      fetchData();
    } catch (error) {
      console.error("Error moving task:", error);
    }

    setDraggedTask(null);
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

  const getTasksByZone = (zone: string) => {
    return tasks.filter((t) => t.zone === zone);
  };

  const currentDept = DEPARTMENTS.find((d) => d.id === activeDepartment);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Équipes</h1>
              <p className="text-sm text-muted-foreground">
                Gestion des projets par département
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddEmployee(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <User className="h-4 w-4" />
                Ajouter employé
              </button>
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90"
              >
                <Plus className="h-4 w-4" />
                Ajouter tâche
              </button>
            </div>
          </div>
        </header>

        {/* Department Tabs */}
        <div className="border-b border-border px-8">
          <div className="flex gap-1">
            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveDepartment(dept.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeDepartment === dept.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {dept.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Employees with Current Tasks */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Current - Tâches en cours
                </h2>
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  onDragOver={handleDragOver}
                >
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="glass-card rounded-xl p-4"
                      onDrop={() => handleDrop("current", employee.id)}
                      onDragOver={handleDragOver}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {employee.photoUrl ? (
                          <img
                            src={employee.photoUrl}
                            alt={employee.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`h-10 w-10 rounded-full ${currentDept?.color} flex items-center justify-center`}>
                            <span className="text-white text-sm font-medium">
                              {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{employee.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{employee.role || "Membre"}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-muted-foreground hover:text-red-500 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Current Task */}
                      {employee.currentTask ? (
                        <div
                          draggable
                          onDragStart={() => handleDragStart(employee.currentTask!)}
                          className="bg-primary/10 border border-primary/20 rounded-lg p-3 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {employee.currentTask.title}
                              </p>
                              {employee.currentTask.project && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                                  <FolderOpen className="h-3 w-3" />
                                  {employee.currentTask.project.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
                          Glissez une tâche ici
                        </div>
                      )}
                    </div>
                  ))}

                  {employees.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Aucun employé dans ce département
                    </div>
                  )}
                </div>
              </section>

              {/* Other Zones */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {ZONES.filter((z) => z.id !== "current").map((zone) => {
                  const Icon = zone.icon;
                  const zoneTasks = getTasksByZone(zone.id);

                  return (
                    <section
                      key={zone.id}
                      className="glass-card rounded-xl p-4"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(zone.id)}
                    >
                      <h3 className="text-md font-semibold text-foreground mb-1 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {zone.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">{zone.description}</p>

                      <div className="space-y-2 min-h-[100px]">
                        {zoneTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={() => handleDragStart(task)}
                            className={`bg-muted/50 border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors ${
                              draggedTask?.id === task.id ? "opacity-50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {task.title}
                                </p>
                                {task.project && (
                                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                                    <FolderOpen className="h-3 w-3" />
                                    {task.project.name}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      task.priority === "high"
                                        ? "bg-red-500/20 text-red-400"
                                        : task.priority === "medium"
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "bg-green-500/20 text-green-400"
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-muted-foreground hover:text-red-500 p-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {zoneTasks.length === 0 && (
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
                            Zone vide
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Ajouter un employé - {activeDepartment}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Rôle
                </label>
                <input
                  type="text"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Designer, Développeur, etc."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddEmployee(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
              <button
                onClick={handleAddEmployee}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Ajouter une tâche - {activeDepartment}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Titre de la tâche"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground resize-none"
                  rows={3}
                  placeholder="Description de la tâche"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Projet lié
                </label>
                <select
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="">Aucun projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} {project.client ? `(${project.client})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Priorité
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
