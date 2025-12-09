"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  Send,
  ChevronDown,
  ChevronUp,
  Trash2,
  Link as LinkIcon,
  Eye,
  X,
} from "lucide-react";

interface ClientPortal {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string | null;
  companyId: string | null;
  isActive: boolean;
  welcomeMessage: string | null;
  createdAt: string;
  _count: { tickets: number };
}

interface Ticket {
  id: string;
  portalId: string;
  projectId: string | null;
  subject: string;
  description: string;
  category: string | null;
  priority: string;
  status: string;
  submittedBy: string | null;
  submittedEmail: string | null;
  assignedToId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  portal: { clientName: string; clientEmail: string | null };
  responses: Array<{
    id: string;
    content: string;
    isInternal: boolean;
    authorType: string;
    authorName: string | null;
    createdAt: string;
  }>;
  _count: { responses: number };
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
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export default function TicketsPage() {
  const [portals, setPortals] = useState<ClientPortal[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tickets" | "portals">("tickets");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // Modal nouveau portail
  const [showNewPortal, setShowNewPortal] = useState(false);
  const [newPortal, setNewPortal] = useState({
    clientName: "",
    clientEmail: "",
    welcomeMessage: "",
  });

  // Réponse ticket
  const [replyContent, setReplyContent] = useState("");
  const [replyIsInternal, setReplyIsInternal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [portalsRes, ticketsRes] = await Promise.all([
        fetch("/api/client-portals"),
        fetch("/api/tickets"),
      ]);

      if (portalsRes.ok) {
        const portalsData = await portalsRes.json();
        setPortals(portalsData);
      }

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/client-portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPortal),
      });

      if (res.ok) {
        setNewPortal({ clientName: "", clientEmail: "", welcomeMessage: "" });
        setShowNewPortal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating portal:", error);
    }
  };

  const handleDeletePortal = async (id: string) => {
    if (!confirm("Supprimer ce portail client ?")) return;
    try {
      await fetch(`/api/client-portals?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting portal:", error);
    }
  };

  const handleTogglePortal = async (portal: ClientPortal) => {
    try {
      await fetch("/api/client-portals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: portal.id, isActive: !portal.isActive }),
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling portal:", error);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status }),
      });
      fetchData();
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyContent.trim()) return;
    try {
      await fetch("/api/tickets/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          content: replyContent,
          isInternal: replyIsInternal,
          authorType: "employee",
          authorName: "Équipe Nukleo",
        }),
      });
      setReplyContent("");
      setReplyIsInternal(false);
      setReplyingTo(null);
      fetchData();
    } catch (error) {
      console.error("Error replying:", error);
    }
  };

  const copyPortalUrl = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    alert("URL copiée !");
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.portal.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openTicketsCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tickets & Portails Clients</h1>
              <p className="text-muted-foreground mt-1">
                Gérez les demandes de vos clients et leurs portails d&apos;accès
              </p>
            </div>
            <button
              onClick={() => setShowNewPortal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau Portail
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tickets ouverts</p>
                  <p className="text-2xl font-bold text-foreground">{openTicketsCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En cours</p>
                  <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Résolus (30j)</p>
                  <p className="text-2xl font-bold text-foreground">
                    {tickets.filter((t) => t.status === "resolved").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Portails actifs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {portals.filter((p) => p.isActive).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("tickets")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "tickets"
                  ? "bg-violet-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab("portals")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "portals"
                  ? "bg-violet-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Portails Clients ({portals.length})
            </button>
          </div>

          {/* Tickets Tab */}
          {activeTab === "tickets" && (
            <>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par sujet ou client..."
                    className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-violet-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="open">Ouvert</option>
                  <option value="in_progress">En cours</option>
                  <option value="waiting">En attente</option>
                  <option value="resolved">Résolu</option>
                  <option value="closed">Fermé</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-violet-500"
                >
                  <option value="">Toutes priorités</option>
                  <option value="urgent">Urgente</option>
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Basse</option>
                </select>
              </div>

              {/* Tickets List */}
              <div className="space-y-4">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-12 bg-card border border-border rounded-xl">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun ticket trouvé</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-card border border-border rounded-xl overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() =>
                          setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${priorityColors[ticket.priority]}`} />
                            <div>
                              <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {ticket.portal.clientName}
                                </span>
                                <span>•</span>
                                <span>{ticket.category || "Support"}</span>
                                <span>•</span>
                                <span>{new Date(ticket.createdAt).toLocaleDateString("fr-CA")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <select
                              value={ticket.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleUpdateTicketStatus(ticket.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`px-3 py-1 rounded-full text-sm border-0 focus:outline-none ${
                                ticket.status === "resolved"
                                  ? "bg-green-500/20 text-green-500"
                                  : ticket.status === "in_progress"
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : ticket.status === "waiting"
                                  ? "bg-purple-500/20 text-purple-500"
                                  : ticket.status === "closed"
                                  ? "bg-gray-500/20 text-gray-500"
                                  : "bg-blue-500/20 text-blue-500"
                              }`}
                            >
                              <option value="open">Ouvert</option>
                              <option value="in_progress">En cours</option>
                              <option value="waiting">En attente</option>
                              <option value="resolved">Résolu</option>
                              <option value="closed">Fermé</option>
                            </select>
                            {ticket._count.responses > 0 && (
                              <span className="text-sm text-muted-foreground">
                                {ticket._count.responses} réponse(s)
                              </span>
                            )}
                            {expandedTicket === ticket.id ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>

                      {expandedTicket === ticket.id && (
                        <div className="border-t border-border p-4 bg-muted/30">
                          {/* Description */}
                          <div className="mb-4 p-3 bg-muted rounded-lg">
                            <p className="text-foreground whitespace-pre-wrap">{ticket.description}</p>
                            {ticket.submittedBy && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Soumis par: {ticket.submittedBy}
                                {ticket.submittedEmail && ` (${ticket.submittedEmail})`}
                              </p>
                            )}
                          </div>

                          {/* Responses */}
                          {ticket.responses.length > 0 && (
                            <div className="space-y-3 mb-4">
                              {ticket.responses.map((response) => (
                                <div
                                  key={response.id}
                                  className={`p-3 rounded-lg ${
                                    response.isInternal
                                      ? "bg-yellow-500/10 border border-yellow-500/30"
                                      : response.authorType === "client"
                                      ? "bg-violet-500/10 ml-8"
                                      : "bg-blue-500/10 mr-8"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground">
                                      {response.authorName || response.authorType}
                                      {response.isInternal && (
                                        <span className="ml-2 text-xs text-yellow-500">(Note interne)</span>
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(response.createdAt).toLocaleString("fr-CA")}
                                    </span>
                                  </div>
                                  <p className="text-foreground whitespace-pre-wrap">{response.content}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply form */}
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <textarea
                                value={replyingTo === ticket.id ? replyContent : ""}
                                onChange={(e) => {
                                  setReplyingTo(ticket.id);
                                  setReplyContent(e.target.value);
                                }}
                                onFocus={() => setReplyingTo(ticket.id)}
                                placeholder="Répondre au ticket..."
                                rows={2}
                                className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500 resize-none"
                              />
                              <button
                                onClick={() => handleReply(ticket.id)}
                                disabled={!replyContent.trim() || replyingTo !== ticket.id}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={replyIsInternal}
                                onChange={(e) => setReplyIsInternal(e.target.checked)}
                                className="rounded"
                              />
                              Note interne (non visible par le client)
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Portals Tab */}
          {activeTab === "portals" && (
            <div className="grid grid-cols-2 gap-4">
              {portals.length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-card border border-border rounded-xl">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun portail client créé</p>
                  <button
                    onClick={() => setShowNewPortal(true)}
                    className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                  >
                    Créer un portail
                  </button>
                </div>
              ) : (
                portals.map((portal) => (
                  <div
                    key={portal.id}
                    className={`bg-card border rounded-xl p-4 ${
                      portal.isActive ? "border-border" : "border-red-500/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{portal.clientName}</h3>
                        {portal.clientEmail && (
                          <p className="text-sm text-muted-foreground">{portal.clientEmail}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePortal(portal)}
                          className={`px-3 py-1 rounded-full text-xs ${
                            portal.isActive
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {portal.isActive ? "Actif" : "Inactif"}
                        </button>
                        <button
                          onClick={() => handleDeletePortal(portal.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      <code className="flex-1 text-xs text-foreground truncate">
                        /portal/{portal.token}
                      </code>
                      <button
                        onClick={() => copyPortalUrl(portal.token)}
                        className="p-1 text-muted-foreground hover:text-violet-500 transition-colors"
                        title="Copier l'URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`/portal/${portal.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-muted-foreground hover:text-violet-500 transition-colors"
                        title="Ouvrir le portail"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{portal._count.tickets} ticket(s)</span>
                      <span>Créé le {new Date(portal.createdAt).toLocaleDateString("fr-CA")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Portal Modal */}
      {showNewPortal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Nouveau Portail Client</h2>
              <button
                onClick={() => setShowNewPortal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePortal} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nom du client *
                </label>
                <input
                  type="text"
                  value={newPortal.clientName}
                  onChange={(e) => setNewPortal({ ...newPortal, clientName: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500"
                  placeholder="Nom de l'entreprise ou du client"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email du client
                </label>
                <input
                  type="email"
                  value={newPortal.clientEmail}
                  onChange={(e) => setNewPortal({ ...newPortal, clientEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500"
                  placeholder="contact@client.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Message de bienvenue
                </label>
                <textarea
                  value={newPortal.welcomeMessage}
                  onChange={(e) => setNewPortal({ ...newPortal, welcomeMessage: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Message affiché sur le portail client..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPortal(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newPortal.clientName}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Créer le portail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
