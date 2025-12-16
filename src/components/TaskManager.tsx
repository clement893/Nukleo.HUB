"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Calendar,
  Flag,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PersonalTask {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  section: string;
  order: number;
  createdAt: string;
  completedAt?: string;
}

const SECTIONS = ["My Tasks", "In Progress", "Done"];

const PRIORITY_COLORS = {
  low: "text-blue-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};

const PRIORITY_BG = {
  low: "bg-blue-500/10",
  medium: "bg-yellow-500/10",
  high: "bg-red-500/10",
};

export default function TaskManager() {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Charger les tâches
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/personal-tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch("/api/personal-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || null,
          section: "My Tasks",
        }),
      });

      if (!response.ok) throw new Error("Failed to create task");
      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
      setNewTaskPriority("medium");
      setNewTaskDueDate("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const updateTask = async (id: string, updates: Partial<PersonalTask>) => {
    try {
      const response = await fetch(`/api/personal-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update task");
      const updatedTask = await response.json();
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/personal-tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");
      setTasks(tasks.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const toggleTaskStatus = async (task: PersonalTask) => {
    const newStatus =
      task.status === "done"
        ? "todo"
        : task.status === "todo"
          ? "in_progress"
          : "done";

    const newSection =
      newStatus === "in_progress"
        ? "In Progress"
        : newStatus === "done"
          ? "Done"
          : "My Tasks";

    await updateTask(task.id, {
      status: newStatus,
      section: newSection,
    });
  };

  const groupedTasks = SECTIONS.reduce(
    (acc, section) => {
      acc[section] = tasks.filter((t) => t.section === section);
      return acc;
    },
    {} as Record<string, PersonalTask[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Add Task Form */}
      <div className="bg-card border border-border rounded-lg p-6">
        <form onSubmit={addTask} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Ajouter une nouvelle tâche..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={newTaskPriority}
              onChange={(e) =>
                setNewTaskPriority(e.target.value as "low" | "medium" | "high")
              }
              className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Basse priorité</option>
              <option value="medium">Priorité normale</option>
              <option value="high">Haute priorité</option>
            </select>

            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </form>
      </div>

      {/* Task Sections */}
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section}>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              {section === "In Progress" && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              )}
              {section === "Done" && (
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              )}
              {section === "My Tasks" && (
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
              )}
              {section}
            </h2>

            {groupedTasks[section].length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune tâche dans cette section
              </div>
            ) : (
              <div className="space-y-2">
                {groupedTasks[section].map((task) => (
                  <div
                    key={task.id}
                    className={`group bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all ${
                      task.status === "done" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Button */}
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className="flex-shrink-0 mt-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {task.status === "done" ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() =>
                            setExpandedTask(
                              expandedTask === task.id ? null : task.id
                            )
                          }
                          className="text-left w-full"
                        >
                          <h3
                            className={`font-medium text-foreground ${
                              task.status === "done"
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {task.title}
                          </h3>
                        </button>

                        {/* Task Metadata */}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm">
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(task.dueDate), "d MMM", {
                                locale: fr,
                              })}
                            </div>
                          )}

                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded ${
                              PRIORITY_BG[task.priority]
                            }`}
                          >
                            <Flag className={`w-3 h-3 ${PRIORITY_COLORS[task.priority]}`} />
                            <span className={PRIORITY_COLORS[task.priority]}>
                              {task.priority === "low"
                                ? "Basse"
                                : task.priority === "medium"
                                  ? "Normale"
                                  : "Haute"}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {expandedTask === task.id && task.description && (
                          <p className="mt-3 text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
