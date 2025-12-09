"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Users,
  FileText,
  MessageSquare,
  History,
  Edit,
  Trash2,
  Plus,
  ExternalLink,
  CheckSquare,
  Clock,
  Link as LinkIcon,
  User,
  Target,
  CheckCircle2,
  Circle,
  PlayCircle,
  MoreVertical,
  GripVertical,
  Send,
  X,
  Eye,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  client?: string;
  team?: string;
  status?: string;
  stage?: string;
  billing?: string;
  lead?: string;
  clientComm?: string;
  contactName?: string;
  contactMethod?: string;
  hourlyRate?: number;
  proposalUrl?: string;
  budget?: string;
  driveUrl?: string;
  asanaUrl?: string;
  slackUrl?: string;
  timeline?: string;
  projectType?: string;
  year?: string;
  description?: string;
  brief?: string;
  departments?: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  zone: string;
  department?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  completedAt?: string;
  projectId?: string;
}

const DEPARTMENTS = ["Lab", "Bureau", "Studio"];
const PRIORITIES = [
  { value: "low", label: "Basse", color: "bg-green-500/10 text-green-500" },
  { value: "medium", label: "Moyenne", color: "bg-yellow-500/10 text-yellow-500" },
  { value: "high", label: "Haute", color: "bg-red-500/10 text-red-500" },
];

const TASK_STATUSES = [
  { value: "todo", label: "À faire", color: "bg-gray-500/10 text-gray-500", icon: Circle },
  { value: "in_progress", label: "En cours", color: "bg-blue-500/10 text-blue-500", icon: PlayCircle },
  { value: "done", label: "Terminé", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 },
];

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  order: number;
}

interface Note {
  id: string;
  content: string;
  authorName?: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description?: string;
  createdAt: string;
  userName?: string;
}

const TABS = [
  { id: "overview", label: "Vue d'ensemble", icon: Target },
  { id: "milestones", label: "Milestones", icon: CheckSquare },
  { id: "tasks", label: "Tâches", icon: FileText },
  { id: "team", label: "Équipe", icon: Users },
  { id: "discussion", label: "Discussion", icon: MessageSquare },
  { id: "history", label: "Historique", icon: History },
];

const STATUS_COLORS: Record<string, string> = {
  "Planification": "bg-blue-500/10 text-blue-500 border-blue-500/30",
  "Production": "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  "Révision interne": "bg-purple-500/10 text-purple-500 border-purple-500/30",
  "Validation client": "bg-orange-500/10 text-orange-500 border-orange-500/30",
  "Ajustements": "bg-pink-500/10 text-pink-500 border-pink-500/30",
  "Livré": "bg-green-500/10 text-green-500 border-green-500/30",
  "Facturé": "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  "Clôturé": "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

const MILESTONE_STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Circle className="w-5 h-5 text-muted-foreground" />,
  in_progress: <PlayCircle className="w-5 h-5 text-yellow-500" />,
  completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", dueDate: "" });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", dueDate: "", department: "Lab" });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [sendingToTeam, setSendingToTeam] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProject();
      fetchRelatedData();
    }
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      // Fetch milestones
      const milestonesResponse = await fetch(`/api/milestones?projectId=${params.id}`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
      }

      // Fetch tasks for this project
      const tasksResponse = await fetch(`/api/tasks?projectId=${params.id}`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

      // Fetch notes
      const notesResponse = await fetch(`/api/notes?entityType=project&entityId=${params.id}`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setNotes(notesData);
      }

      // Fetch activity log
      const activityResponse = await fetch(`/api/activity?entityType=project&entityId=${params.id}`);
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivities(activityData);
      }
    } catch (error) {
      console.error("Error fetching related data:", error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote,
          entityType: "project",
          entityId: params.id,
          authorName: "Admin",
        }),
      });
      if (response.ok) {
        const note = await response.json();
        setNotes([note, ...notes]);
        setNewNote("");
      }
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    try {
      const response = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMilestone,
          projectId: params.id,
          order: milestones.length,
        }),
      });
      if (response.ok) {
        const milestone = await response.json();
        setMilestones([...milestones, milestone]);
        setNewMilestone({ title: "", description: "", dueDate: "" });
        setShowMilestoneForm(false);
      }
    } catch (error) {
      console.error("Error adding milestone:", error);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        const updated = await response.json();
        setMilestones(milestones.map(m => m.id === milestoneId ? updated : m));
      }
    } catch (error) {
      console.error("Error updating milestone:", error);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm("Supprimer ce milestone ?")) return;
    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setMilestones(milestones.filter(m => m.id !== milestoneId));
      }
    } catch (error) {
      console.error("Error deleting milestone:", error);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return;
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/projets");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          projectId: params.id,
          zone: "shelf",
        }),
      });
      if (response.ok) {
        const task = await response.json();
        setTasks([...tasks, task]);
        setNewTask({ title: "", description: "", priority: "medium", dueDate: "", department: "Lab" });
        setShowTaskForm(false);
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleSendToTeam = async (taskId: string, department: string) => {
    setSendingToTeam(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: "shelf",
          department: department,
        }),
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
        alert(`Tâche envoyée dans le Shelf de ${department} !`);
      }
    } catch (error) {
      console.error("Error sending task to team:", error);
    } finally {
      setSendingToTeam(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
        setShowTaskDetail(false);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
        if (selectedTask?.id === taskId) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          department: editingTask.department,
          dueDate: editingTask.dueDate,
          status: editingTask.status,
        }),
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
        setShowEditForm(false);
        setEditingTask(null);
        setShowTaskDetail(false);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const getStatusInfo = (status?: string) => {
    return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500";
      case "low":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const completedMilestones = milestones.filter(m => m.status === "completed").length;
  const progressPercent = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Projet non trouvé</p>
            <button
              onClick={() => router.push("/projets")}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Retour aux projets
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-x-hidden max-w-[calc(100vw-16rem)]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/projets")}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              {project.status && (
                <span className={`px-3 py-1 text-sm rounded-full border ${STATUS_COLORS[project.status] || "bg-gray-500/10 text-gray-500 border-gray-500/30"}`}>
                  {project.status}
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{project.client} • {project.year}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/projets/${params.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={handleDeleteProject}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progression du projet</span>
            <span className="text-sm text-muted-foreground">{completedMilestones}/{milestones.length} milestones</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progressPercent}% complété</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-semibold text-foreground">{project.budget || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-semibold text-foreground truncate">{project.client || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <User className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsable</p>
                <p className="font-semibold text-foreground truncate">{project.lead || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Target className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Milestones</p>
                <p className="font-semibold text-foreground">{milestones.length}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <CheckSquare className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tâches</p>
                <p className="font-semibold text-foreground">{tasks.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="glass-card rounded-xl p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Description & Brief */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.description || "Aucune description"}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Brief créatif</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.brief || "Aucun brief"}
                  </p>
                </div>
              </div>

              {/* Project Info */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Informations du mandat</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Type de projet</label>
                    <p className="text-foreground">{project.projectType || "Non spécifié"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Mode de facturation</label>
                    <p className="text-foreground">{project.billing || "Non spécifié"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Taux horaire</label>
                    <p className="text-foreground">
                      {project.hourlyRate ? `${project.hourlyRate} $/h` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Échéancier</label>
                    <p className="text-foreground">{project.timeline || "Non spécifié"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Départements</label>
                    <p className="text-foreground">{project.departments || "Non spécifié"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Contact client</label>
                    <p className="text-foreground">{project.contactName || "Non spécifié"}</p>
                  </div>
                </div>
              </div>

              {/* External Links */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Liens externes</h3>
                <div className="flex flex-wrap gap-3">
                  {project.driveUrl && (
                    <a
                      href={project.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Google Drive
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {project.asanaUrl && (
                    <a
                      href={project.asanaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Asana
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {project.slackUrl && (
                    <a
                      href={project.slackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Slack
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {project.proposalUrl && (
                    <a
                      href={project.proposalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Proposition
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {!project.driveUrl && !project.asanaUrl && !project.slackUrl && !project.proposalUrl && (
                    <p className="text-muted-foreground">Aucun lien externe</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "milestones" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Milestones</h3>
                  <p className="text-sm text-muted-foreground">Les grandes étapes du projet</p>
                </div>
                <button
                  onClick={() => setShowMilestoneForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un milestone
                </button>
              </div>

              {/* Add Milestone Form */}
              {showMilestoneForm && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <h4 className="font-medium text-foreground mb-4">Nouveau milestone</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Titre *</label>
                      <input
                        type="text"
                        value={newMilestone.title}
                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Ex: Livraison maquettes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Date limite</label>
                      <input
                        type="date"
                        value={newMilestone.dueDate}
                        onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-muted-foreground mb-1">Description</label>
                    <textarea
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={2}
                      placeholder="Description du milestone..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowMilestoneForm(false)}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddMilestone}
                      disabled={!newMilestone.title.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      Créer
                    </button>
                  </div>
                </div>
              )}

              {/* Milestones List */}
              {milestones.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun milestone pour ce projet</p>
                  <p className="text-sm text-muted-foreground mt-1">Ajoutez des milestones pour suivre les grandes étapes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                        milestone.status === "completed"
                          ? "bg-green-500/5 border-green-500/20"
                          : milestone.status === "in_progress"
                          ? "bg-yellow-500/5 border-yellow-500/20"
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <button
                          onClick={() => {
                            const nextStatus = milestone.status === "pending" ? "in_progress" : milestone.status === "in_progress" ? "completed" : "pending";
                            handleUpdateMilestoneStatus(milestone.id, nextStatus);
                          }}
                          className="hover:scale-110 transition-transform"
                        >
                          {MILESTONE_STATUS_ICONS[milestone.status]}
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                          <h4 className={`font-medium ${milestone.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {milestone.title}
                          </h4>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                        {milestone.dueDate && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(milestone.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            {milestone.completedAt && (
                              <span className="ml-2 text-green-500">
                                ✓ Complété le {new Date(milestone.completedAt).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "tasks" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Tâches ({tasks.length})</h3>
                <button 
                  onClick={() => setShowTaskForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une tâche
                </button>
              </div>

              {/* Formulaire d'ajout de tâche */}
              {showTaskForm && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <h4 className="font-medium text-foreground mb-4">Nouvelle tâche</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Titre *</label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Ex: Créer les maquettes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Département</label>
                      <select
                        value={newTask.department}
                        onChange={(e) => setNewTask({ ...newTask, department: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Priorité</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Date limite</label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-muted-foreground mb-1">Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={2}
                      placeholder="Description de la tâche..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowTaskForm(false)}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddTask}
                      disabled={!newTask.title.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      Créer
                    </button>
                  </div>
                </div>
              )}

              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune tâche pour ce projet</p>
                  <p className="text-sm text-muted-foreground mt-1">Ajoutez des tâches et envoyez-les aux équipes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors group"
                    >
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                      >
                        {/* Bouton de statut cliquable */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = TASK_STATUSES.findIndex(s => s.value === (task.status || "todo"));
                            const nextIndex = (currentIndex + 1) % TASK_STATUSES.length;
                            handleUpdateTaskStatus(task.id, TASK_STATUSES[nextIndex].value);
                          }}
                          className="hover:scale-110 transition-transform"
                          title="Cliquer pour changer le statut"
                        >
                          {(() => {
                            const statusInfo = getStatusInfo(task.status);
                            const StatusIcon = statusInfo.icon;
                            return <StatusIcon className={`w-5 h-5 ${statusInfo.color.split(" ")[1]}`} />;
                          })()}
                        </button>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority === "high" ? "Haute" : task.priority === "low" ? "Basse" : "Moyenne"}
                        </span>
                        {task.department && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">
                            {task.department}
                          </span>
                        )}
                        {/* Badge de statut */}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusInfo(task.status).color}`}>
                          {getStatusInfo(task.status).label}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-500/10 text-gray-500">
                          {task.zone}
                        </span>
                        
                        {/* Boutons d'action */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <div className="relative group/send">
                            <button
                              className="p-1.5 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded transition-colors"
                              title="Envoyer vers Équipes"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/send:opacity-100 group-hover/send:visible transition-all z-10">
                              <div className="p-2 min-w-[120px]">
                                <p className="text-xs text-muted-foreground px-2 py-1">Envoyer vers</p>
                                {DEPARTMENTS.map((dept) => (
                                  <button
                                    key={dept}
                                    onClick={() => handleSendToTeam(task.id, dept)}
                                    disabled={sendingToTeam === task.id}
                                    className="w-full text-left px-2 py-1.5 text-sm text-foreground hover:bg-muted rounded transition-colors"
                                  >
                                    {dept}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "team" && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Équipe projet</h3>
              <div className="space-y-4">
                {project.lead && (
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{project.lead}</p>
                      <p className="text-sm text-muted-foreground">Responsable de projet</p>
                    </div>
                  </div>
                )}
                {project.team && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Membres de l'équipe</p>
                    <p className="text-foreground">{project.team}</p>
                  </div>
                )}
                {project.contactName && (
                  <div className="flex items-center gap-4 p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{project.contactName}</p>
                      <p className="text-sm text-muted-foreground">Contact client</p>
                      {project.contactMethod && (
                        <p className="text-xs text-muted-foreground">{project.contactMethod}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "discussion" && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Discussion</h3>
              
              {/* Add note form */}
              <div className="mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="w-full p-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Publier
                  </button>
                </div>
              </div>

              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun commentaire</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {getInitials(note.authorName || "A")}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{note.authorName || "Anonyme"}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap pl-10">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Historique</h3>
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune activité enregistrée</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <History className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground">{activity.description || activity.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.userName} • {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modale de détail de tâche */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Détails de la tâche</h3>
              <button
                onClick={() => { setShowTaskDetail(false); setSelectedTask(null); }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Titre</label>
                <p className="text-lg font-medium text-foreground">{selectedTask.title}</p>
              </div>
              
              {selectedTask.description && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Description</label>
                  <p className="text-foreground whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Statut</label>
                  <div className="flex items-center gap-2 mt-1">
                    {TASK_STATUSES.map((status) => {
                      const StatusIcon = status.icon;
                      const isActive = (selectedTask.status || "todo") === status.value;
                      return (
                        <button
                          key={status.value}
                          onClick={() => handleUpdateTaskStatus(selectedTask.id, status.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
                            isActive
                              ? `${status.color} ring-2 ring-offset-2 ring-offset-background`
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Priorité</label>
                  <p className={`inline-block px-2 py-1 text-sm rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority === "high" ? "Haute" : selectedTask.priority === "low" ? "Basse" : "Moyenne"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Zone</label>
                  <p className="text-foreground capitalize">{selectedTask.zone}</p>
                </div>
                {selectedTask.department && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Département</label>
                    <p className="text-foreground">{selectedTask.department}</p>
                  </div>
                )}
                {selectedTask.dueDate && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Date limite</label>
                    <p className="text-foreground">
                      {new Date(selectedTask.dueDate).toLocaleDateString("fr-FR", { 
                        day: "numeric", 
                        month: "long", 
                        year: "numeric" 
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Envoyer vers Équipes</label>
                <div className="flex gap-2">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => {
                        handleSendToTeam(selectedTask.id, dept);
                        setShowTaskDetail(false);
                        setSelectedTask(null);
                      }}
                      disabled={sendingToTeam === selectedTask.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
              <button
                onClick={() => {
                  setEditingTask(selectedTask);
                  setShowEditForm(true);
                  setShowTaskDetail(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => { setShowTaskDetail(false); setSelectedTask(null); }}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de modification de tâche */}
      {showEditForm && editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Modifier la tâche</h3>
              <button
                onClick={() => { setShowEditForm(false); setEditingTask(null); }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Titre *</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Description</label>
                <textarea
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Statut</label>
                  <select
                    value={editingTask.status || "todo"}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Priorité</label>
                  <select
                    value={editingTask.priority || "medium"}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Département</label>
                  <select
                    value={editingTask.department || "Lab"}
                    onChange={(e) => setEditingTask({ ...editingTask, department: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Date limite</label>
                  <input
                    type="date"
                    value={editingTask.dueDate ? editingTask.dueDate.split("T")[0] : ""}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => { setShowEditForm(false); setEditingTask(null); }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateTask}
                disabled={!editingTask.title.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
