"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Send,
  MessageSquare,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowRight,
  Loader2,
  Building2,
  Calendar,
  Target,
  FileText,
  HelpCircle,
  Bug,
  Lightbulb,
  Headphones,
} from "lucide-react";

interface PortalData {
  portal: {
    id: string;
    clientName: string;
    clientEmail: string | null;
    welcomeMessage: string | null;
  };
  projects: Array<{
    id: string;
    name: string;
    status: string | null;
    stage: string | null;
    projectType: string | null;
    timeline: string | null;
    description: string | null;
    milestones: Array<{
      id: string;
      title: string;
      description: string | null;
      status: string;
      startDate: string | null;
      dueDate: string | null;
      progress: number;
      deliverables: string | null;
    }>;
    _count: { tasks: number; milestones: number };
  }>;
  tickets: Array<{
    id: string;
    subject: string;
    description: string;
    category: string | null;
    priority: string;
    status: string;
    createdAt: string;
    responses: Array<{
      id: string;
      content: string;
      authorType: string;
      authorName: string | null;
      createdAt: string;
    }>;
  }>;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-yellow-500",
  waiting: "bg-purple-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  waiting: "En attente",
  resolved: "Résolu",
  closed: "Fermé",
};

const priorityColors: Record<string, string> = {
  low: "text-gray-500",
  medium: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

const categoryIcons: Record<string, React.ReactNode> = {
  bug: <Bug className="w-4 h-4" />,
  feature: <Lightbulb className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  support: <Headphones className="w-4 h-4" />,
};

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "tickets">("projects");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Formulaire nouveau ticket
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "support",
    priority: "medium",
    projectId: "",
    submittedBy: "",
    submittedEmail: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Formulaire réponse
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchPortalData();
  }, [token]);

  const fetchPortalData = async () => {
    try {
      const res = await fetch(`/api/portal/${token}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Portail non trouvé");
        } else if (res.status === 403) {
          setError("Ce portail est désactivé");
        } else {
          setError("Erreur lors du chargement");
        }
        return;
      }
      const portalData = await res.json();
      setData(portalData);
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalToken: token,
          ...newTicket,
        }),
      });

      if (res.ok) {
        setNewTicket({
          subject: "",
          description: "",
          category: "support",
          priority: "medium",
          projectId: "",
          submittedBy: "",
          submittedEmail: "",
        });
        setShowNewTicket(false);
        fetchPortalData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyContent.trim()) return;

    try {
      const res = await fetch("/api/tickets/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          content: replyContent,
          authorType: "client",
          authorName: data?.portal.clientName,
          portalToken: token,
        }),
      });

      if (res.ok) {
        setReplyContent("");
        setReplyingTo(null);
        fetchPortalData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{error || "Erreur"}</h1>
          <p className="text-gray-400">Vérifiez l&apos;URL ou contactez votre gestionnaire de compte.</p>
        </div>
      </div>
    );
  }

  const openTickets = data.tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length;
  const activeProjects = data.projects.filter((p) => p.status === "En cours" || p.status === "Active").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Bienvenue, {data.portal.clientName}
              </h1>
              <p className="text-gray-400 mt-1">
                Votre espace client Nukleo
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Projets actifs</div>
                <div className="text-2xl font-bold text-white">{activeProjects}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Tickets ouverts</div>
                <div className="text-2xl font-bold text-white">{openTickets}</div>
              </div>
            </div>
          </div>
          {data.portal.welcomeMessage && (
            <div className="mt-4 p-4 bg-violet-500/20 rounded-lg border border-violet-500/30">
              <p className="text-violet-200">{data.portal.welcomeMessage}</p>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "projects"
                ? "bg-violet-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Mes Projets ({data.projects.length})
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "tickets"
                ? "bg-violet-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Mes Tickets ({data.tickets.length})
          </button>
          <button
            onClick={() => setShowNewTicket(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau Ticket
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 pb-8">
        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            {data.projects.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl">
                <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Aucun projet en cours</p>
              </div>
            ) : (
              data.projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() =>
                      setExpandedProject(expandedProject === project.id ? null : project.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                            {project.projectType && <span>{project.projectType}</span>}
                            {project.timeline && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {project.timeline}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            project.status === "En cours" || project.status === "Active"
                              ? "bg-green-500/20 text-green-400"
                              : project.status === "Terminé" || project.status === "Completed"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {project.status || "En cours"}
                        </span>
                        {expandedProject === project.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedProject === project.id && (
                    <div className="border-t border-white/10 p-4 bg-black/20">
                      {project.description && (
                        <p className="text-gray-300 mb-4">{project.description}</p>
                      )}

                      {/* Échéancier du projet */}
                      {project.milestones.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Échéancier du projet
                          </h4>
                          
                          {/* Progress bar global */}
                          {(() => {
                            const completedCount = project.milestones.filter(m => m.status === "completed").length;
                            const totalProgress = project.milestones.reduce((acc, m) => acc + (m.progress || 0), 0) / project.milestones.length;
                            return (
                              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-400">Progression globale</span>
                                  <span className="text-sm font-medium text-white">{Math.round(totalProgress)}%</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                                    style={{ width: `${totalProgress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  {completedCount} / {project.milestones.length} étapes terminées
                                </p>
                              </div>
                            );
                          })()}

                          {/* Liste des milestones */}
                          <div className="space-y-3">
                            {project.milestones.map((milestone) => {
                              const deliverables = milestone.deliverables ? JSON.parse(milestone.deliverables) : [];
                              return (
                                <div
                                  key={milestone.id}
                                  className={`p-3 rounded-lg border transition-all ${
                                    milestone.status === "completed"
                                      ? "bg-green-500/10 border-green-500/30"
                                      : milestone.status === "in_progress"
                                      ? "bg-yellow-500/10 border-yellow-500/30"
                                      : "bg-white/5 border-white/10"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {milestone.status === "completed" ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                                    ) : milestone.status === "in_progress" ? (
                                      <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border-2 border-gray-500 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className={milestone.status === "completed" ? "text-gray-400 line-through" : "text-white font-medium"}>
                                          {milestone.title}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          milestone.status === "completed" ? "bg-green-500/20 text-green-400" :
                                          milestone.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400" :
                                          "bg-gray-500/20 text-gray-400"
                                        }`}>
                                          {milestone.status === "completed" ? "Terminé" :
                                           milestone.status === "in_progress" ? "En cours" : "En attente"}
                                        </span>
                                      </div>
                                      
                                      {milestone.description && (
                                        <p className="text-sm text-gray-400 mt-1">{milestone.description}</p>
                                      )}

                                      {/* Dates */}
                                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        {milestone.startDate && (
                                          <span>Début: {new Date(milestone.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                                        )}
                                        {milestone.dueDate && (
                                          <span>Fin: {new Date(milestone.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                                        )}
                                      </div>

                                      {/* Progress bar */}
                                      {milestone.status !== "completed" && milestone.progress > 0 && (
                                        <div className="mt-2">
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-violet-500 transition-all"
                                                style={{ width: `${milestone.progress}%` }}
                                              />
                                            </div>
                                            <span className="text-xs text-gray-500">{milestone.progress}%</span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Livrables */}
                                      {deliverables.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          {deliverables.map((d: string, i: number) => (
                                            <span key={i} className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded">
                                              {d}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {project.milestones.length === 0 && (
                        <p className="text-gray-500 text-sm">
                          Aucun échéancier défini pour ce projet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {data.tickets.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl">
                <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Aucun ticket soumis</p>
                <button
                  onClick={() => setShowNewTicket(true)}
                  className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                  Créer votre premier ticket
                </button>
              </div>
            ) : (
              data.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() =>
                      setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-3 h-3 rounded-full ${statusColors[ticket.status]}`}
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-white">{ticket.subject}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              {categoryIcons[ticket.category || "support"]}
                              {ticket.category || "Support"}
                            </span>
                            <span>•</span>
                            <span className={priorityColors[ticket.priority]}>
                              {ticket.priority === "urgent"
                                ? "Urgent"
                                : ticket.priority === "high"
                                ? "Haute"
                                : ticket.priority === "low"
                                ? "Basse"
                                : "Moyenne"}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(ticket.createdAt).toLocaleDateString("fr-CA")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            ticket.status === "resolved"
                              ? "bg-green-500/20 text-green-400"
                              : ticket.status === "in_progress"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : ticket.status === "waiting"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {statusLabels[ticket.status]}
                        </span>
                        {ticket.responses.length > 0 && (
                          <span className="text-sm text-gray-400">
                            {ticket.responses.length} réponse(s)
                          </span>
                        )}
                        {expandedTicket === ticket.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedTicket === ticket.id && (
                    <div className="border-t border-white/10 p-4 bg-black/20">
                      {/* Description */}
                      <div className="mb-4 p-3 bg-white/5 rounded-lg">
                        <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                      </div>

                      {/* Responses */}
                      {ticket.responses.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {ticket.responses.map((response) => (
                            <div
                              key={response.id}
                              className={`p-3 rounded-lg ${
                                response.authorType === "client"
                                  ? "bg-violet-500/20 ml-8"
                                  : "bg-blue-500/20 mr-8"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white">
                                  {response.authorName ||
                                    (response.authorType === "client" ? "Vous" : "Équipe Nukleo")}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(response.createdAt).toLocaleString("fr-CA")}
                                </span>
                              </div>
                              <p className="text-gray-300 whitespace-pre-wrap">{response.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply form */}
                      {ticket.status !== "closed" && ticket.status !== "resolved" && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyingTo === ticket.id ? replyContent : ""}
                            onChange={(e) => {
                              setReplyingTo(ticket.id);
                              setReplyContent(e.target.value);
                            }}
                            onFocus={() => setReplyingTo(ticket.id)}
                            placeholder="Ajouter une réponse..."
                            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => handleReply(ticket.id)}
                            disabled={!replyContent.trim() || replyingTo !== ticket.id}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-white/10 w-full max-w-lg">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Nouveau Ticket</h2>
            </div>
            <form onSubmit={handleSubmitTicket} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sujet *
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  placeholder="Décrivez brièvement votre demande"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="support">Support</option>
                    <option value="question">Question</option>
                    <option value="bug">Bug / Problème</option>
                    <option value="feature">Nouvelle fonctionnalité</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Priorité
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {data.projects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Projet concerné
                  </label>
                  <select
                    value={newTicket.projectId}
                    onChange={(e) => setNewTicket({ ...newTicket, projectId: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="">Aucun projet spécifique</option>
                    {data.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Décrivez votre demande en détail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Votre nom
                  </label>
                  <input
                    type="text"
                    value={newTicket.submittedBy}
                    onChange={(e) => setNewTicket({ ...newTicket, submittedBy: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Votre email
                  </label>
                  <input
                    type="email"
                    value={newTicket.submittedEmail}
                    onChange={(e) => setNewTicket({ ...newTicket, submittedEmail: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTicket.subject || !newTicket.description}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Soumettre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
