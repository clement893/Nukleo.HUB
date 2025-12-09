"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  Globe,
  Calendar,
  Briefcase,
  Users,
  FileText,
  MessageSquare,
  History,
  Edit,
  Trash2,
  Plus,
  ExternalLink,
  Star,
  Tag,
} from "lucide-react";

interface Contact {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  level?: number;
  potentialSale?: boolean;
  photoUrl?: string;
  linkedinUrl?: string;
  position?: string;
  company?: string;
  email?: string;
  phone?: string;
  relation?: string;
  circles?: string;
  employmentField?: string;
  lastUpdated?: string;
  region?: string;
  birthday?: string;
  link?: string;
  tags?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

interface Opportunity {
  id: string;
  name: string;
  value?: number;
  stage: string;
  company?: string;
}

interface Project {
  id: string;
  name: string;
  client?: string;
  status?: string;
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
  { id: "overview", label: "Vue d'ensemble", icon: User },
  { id: "opportunities", label: "Opportunités", icon: Briefcase },
  { id: "projects", label: "Projets", icon: FileText },
  { id: "notes", label: "Notes", icon: MessageSquare },
  { id: "history", label: "Historique", icon: History },
];

const LEVELS: Record<number, string> = {
  1: "Exécutif (C-Level)",
  2: "Direction (VP, Directeur)",
  3: "Management (Gestionnaire)",
  4: "Opérationnel (Contributeur)",
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchContact();
      fetchRelatedData();
    }
  }, [params.id]);

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/contacts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setContact(data);
      }
    } catch (error) {
      console.error("Error fetching contact:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      // Fetch opportunities linked to this contact
      const oppResponse = await fetch(`/api/opportunities?contactId=${params.id}`);
      if (oppResponse.ok) {
        const oppData = await oppResponse.json();
        setOpportunities(oppData);
      }

      // Fetch notes
      const notesResponse = await fetch(`/api/notes?entityType=contact&entityId=${params.id}`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setNotes(notesData);
      }

      // Fetch activity log
      const activityResponse = await fetch(`/api/activity?entityType=contact&entityId=${params.id}`);
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
          entityType: "contact",
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

  const handleDeleteContact = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) return;
    try {
      const response = await fetch(`/api/contacts/${params.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/reseau/contacts");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
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

  if (!contact) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Contact non trouvé</p>
            <button
              onClick={() => router.push("/reseau/contacts")}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Retour aux contacts
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/reseau/contacts")}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{contact.fullName}</h1>
            <p className="text-muted-foreground">
              {contact.position} {contact.company && `chez ${contact.company}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={handleDeleteContact}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {contact.photoUrl ? (
                <img
                  src={contact.photoUrl}
                  alt={contact.fullName}
                  className="w-24 h-24 rounded-xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {getInitials(contact.fullName)}
                  </span>
                </div>
              )}
              {contact.potentialSale && (
                <div className="absolute -top-2 -right-2 p-1.5 bg-yellow-500 rounded-full">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </a>
                )}
                {contact.linkedinUrl && (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#0A66C2] transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="space-y-3">
                {contact.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    {contact.company}
                  </div>
                )}
                {contact.region && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {contact.region}
                  </div>
                )}
                {contact.level && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {LEVELS[contact.level] || `Niveau ${contact.level}`}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              {contact.employmentField && (
                <span className="px-3 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">
                  {contact.employmentField}
                </span>
              )}
              {contact.relation && (
                <span className="px-3 py-1 text-xs rounded-full bg-purple-500/10 text-purple-500">
                  {contact.relation}
                </span>
              )}
              {contact.circles && (
                <span className="px-3 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
                  {contact.circles}
                </span>
              )}
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
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Informations détaillées</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">Langue</label>
                      <p className="text-foreground">{contact.language || "Non spécifié"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">Date de naissance</label>
                      <p className="text-foreground">{contact.birthday || "Non spécifié"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">Tags</label>
                      <p className="text-foreground">{contact.tags || "Aucun"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">Créé le</label>
                      <p className="text-foreground">
                        {new Date(contact.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">Dernière mise à jour</label>
                      <p className="text-foreground">
                        {new Date(contact.updatedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "opportunities" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Opportunités liées</h3>
              </div>
              {opportunities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune opportunité liée à ce contact</p>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => router.push(`/commercial/pipeline?highlight=${opp.id}`)}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{opp.name}</p>
                        <p className="text-sm text-muted-foreground">{opp.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {opp.value?.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                        </p>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {opp.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Projets associés</h3>
              {projects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun projet associé à ce contact</p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/projets/${project.id}`)}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Notes</h3>
              </div>
              
              {/* Add note form */}
              <div className="mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ajouter une note..."
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
                    Ajouter
                  </button>
                </div>
              </div>

              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune note pour ce contact</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{note.authorName || "Anonyme"}</span>
                        <span>•</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Historique des activités</h3>
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
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{activity.userName || "Système"}</span>
                          <span>•</span>
                          <span>
                            {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
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
