"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Facebook,
  Instagram,
  Users,
  Briefcase,
  FileText,
  History,
  Edit,
  Trash2,
  Plus,
  ExternalLink,
  Star,
  Upload,
  Download,
  File,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  address?: string;
  phone?: string;
  type?: string;
  mainContactName?: string;
  mainContactEmail?: string;
  description?: string;
  industry?: string;
  insight?: string;
  engagements?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  isClient: boolean;
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

interface Opportunity {
  id: string;
  name: string;
  value?: number;
  stage: string;
}

interface Project {
  id: string;
  name: string;
  status?: string;
  year?: string;
}

interface Document {
  id: string;
  name: string;
  url: string;
  type?: string;
  size?: number;
  createdAt: string;
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
  { id: "overview", label: "Vue d'ensemble", icon: Building2 },
  { id: "team", label: "Équipe", icon: Users },
  { id: "opportunities", label: "Opportunités", icon: Briefcase },
  { id: "projects", label: "Mandats", icon: FileText },
  { id: "documents", label: "Documents", icon: File },
  { id: "history", label: "Historique", icon: History },
];

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCompany();
      fetchRelatedData();
    }
  }, [params.id]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      }
    } catch (error) {
      console.error("Error fetching company:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      // Fetch contacts working at this company
      const contactsResponse = await fetch(`/api/contacts?company=${params.id}`);
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData);
      }

      // Fetch opportunities linked to this company
      const oppResponse = await fetch(`/api/opportunities?company=${params.id}`);
      if (oppResponse.ok) {
        const oppData = await oppResponse.json();
        setOpportunities(oppData);
      }

      // Fetch projects for this company
      const projectsResponse = await fetch(`/api/projects?client=${params.id}`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // Fetch documents
      const docsResponse = await fetch(`/api/documents?companyId=${params.id}`);
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData);
      }

      // Fetch notes
      const notesResponse = await fetch(`/api/notes?entityType=company&entityId=${params.id}`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setNotes(notesData);
      }

      // Fetch activity log
      const activityResponse = await fetch(`/api/activity?entityType=company&entityId=${params.id}`);
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivities(activityData);
      }
    } catch (error) {
      console.error("Error fetching related data:", error);
    }
  };

  const handleEnrich = async () => {
    if (!company?.website) {
      alert("Veuillez d'abord ajouter un site web à cette organisation");
      return;
    }
    setEnriching(true);
    try {
      const response = await fetch(`/api/companies/${params.id}/enrich`, {
        method: "POST",
      });
      if (response.ok) {
        const enrichedData = await response.json();
        setCompany({ ...company, ...enrichedData });
        alert("Organisation enrichie avec succès !");
      } else {
        alert("Erreur lors de l'enrichissement");
      }
    } catch (error) {
      console.error("Error enriching company:", error);
      alert("Erreur lors de l'enrichissement");
    } finally {
      setEnriching(false);
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
          entityType: "company",
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

  const handleDeleteCompany = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette organisation ?")) return;
    try {
      const response = await fetch(`/api/companies/${params.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/reseau/entreprises");
      }
    } catch (error) {
      console.error("Error deleting company:", error);
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  if (!company) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Organisation non trouvée</p>
            <button
              onClick={() => router.push("/reseau/entreprises")}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Retour aux entreprises
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
            onClick={() => router.push("/reseau/entreprises")}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
              {company.isClient && (
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <p className="text-muted-foreground">{company.industry}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnrich}
              disabled={enriching}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {enriching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Enrichir
            </button>
            <button
              onClick={() => router.push(`/reseau/entreprises/${params.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={handleDeleteCompany}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Company Card */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-20 h-20 rounded-xl object-cover bg-muted"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {getInitials(company.name)}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {company.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {company.mainContactEmail && (
                  <a
                    href={`mailto:${company.mainContactEmail}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {company.mainContactEmail}
                  </a>
                )}
                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {company.phone}
                  </a>
                )}
              </div>
              <div className="space-y-3">
                {company.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {company.address}
                  </div>
                )}
                {company.mainContactName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {company.mainContactName}
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-2">
              {company.linkedinUrl && (
                <a
                  href={company.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 rounded-lg transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {company.facebookUrl && (
                <a
                  href={company.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-[#1877F2] hover:bg-[#1877F2]/10 rounded-lg transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {company.instagramUrl && (
                <a
                  href={company.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-[#E4405F] hover:bg-[#E4405F]/10 rounded-lg transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">{company.description}</p>
            </div>
          )}

          {/* Insight */}
          {company.insight && (
            <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-500">Insights stratégiques</span>
              </div>
              <p className="text-sm text-foreground">{company.insight}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informations</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">Type</label>
                      <p className="text-foreground">{company.type || "Non spécifié"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">Industrie</label>
                      <p className="text-foreground">{company.industry || "Non spécifié"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">Statut client</label>
                      <p className="text-foreground">{company.isClient ? "Client actif" : "Non client"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Statistiques</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-foreground">{contacts.length}</p>
                      <p className="text-sm text-muted-foreground">Contacts</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-foreground">{opportunities.length}</p>
                      <p className="text-sm text-muted-foreground">Opportunités</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                      <p className="text-sm text-muted-foreground">Mandats</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-foreground">{documents.length}</p>
                      <p className="text-sm text-muted-foreground">Documents</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes section in overview */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Notes récentes</h3>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ajouter une note..."
                  className="w-full p-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-2"
                  rows={2}
                />
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
                {notes.slice(0, 3).map((note) => (
                  <div key={note.id} className="p-3 bg-muted/50 rounded-lg mb-2">
                    <p className="text-sm text-foreground">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {note.authorName} • {new Date(note.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Équipe ({contacts.length})</h3>
              {contacts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun contact associé à cette organisation</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => router.push(`/reseau/contacts/${contact.id}`)}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      {contact.photoUrl ? (
                        <img src={contact.photoUrl} alt={contact.fullName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-medium text-primary">{getInitials(contact.fullName)}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{contact.fullName}</p>
                        <p className="text-sm text-muted-foreground">{contact.position}</p>
                        {contact.email && (
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "opportunities" && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Opportunités ({opportunities.length})</h3>
              {opportunities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune opportunité pour cette organisation</p>
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
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{opp.stage}</span>
                      </div>
                      <p className="font-medium text-foreground">
                        {opp.value?.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Mandats ({projects.length})</h3>
              {projects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun mandat pour cette organisation</p>
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
                        <p className="text-sm text-muted-foreground">{project.year}</p>
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

          {activeTab === "documents" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Documents ({documents.length})</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun document attaché</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <File className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.type} • {formatFileSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
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
