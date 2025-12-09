"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Briefcase,
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

interface Contact {
  id: string;
  fullName: string;
  position?: string;
  email?: string;
  photoUrl?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  zone: string;
  priority?: string;
  dueDate?: string;
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
  { id: "details", label: "Détails", icon: FileText },
  { id: "team", label: "Équipe", icon: Users },
  { id: "tasks", label: "Tâches", icon: CheckSquare },
  { id: "discussion", label: "Discussion", icon: MessageSquare },
  { id: "history", label: "Historique", icon: History },
];

const STATUS_COLORS: Record<string, string> = {
  "Planification": "bg-blue-500/10 text-blue-500",
  "Production": "bg-yellow-500/10 text-yellow-500",
  "Révision interne": "bg-purple-500/10 text-purple-500",
  "Validation client": "bg-orange-500/10 text-orange-500",
  "Ajustements": "bg-pink-500/10 text-pink-500",
  "Livré": "bg-green-500/10 text-green-500",
  "Facturé": "bg-emerald-500/10 text-emerald-500",
  "Clôturé": "bg-gray-500/10 text-gray-500",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [newNote, setNewNote] = useState("");

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
                <span className={`px-3 py-1 text-sm rounded-full ${STATUS_COLORS[project.status] || "bg-gray-500/10 text-gray-500"}`}>
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
                <Users className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Équipe</p>
                <p className="font-semibold text-foreground truncate">{project.team || "N/A"}</p>
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
          {activeTab === "details" && (
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
                </div>
              </div>
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

          {activeTab === "tasks" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Tâches ({tasks.length})</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" />
                  Ajouter une tâche
                </button>
              </div>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune tâche pour ce projet</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckSquare className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{task.title}</p>
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
                          {task.priority || "Normal"}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-500/10 text-gray-500">
                          {task.zone}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  );
}
