"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Search,
  Building2,
  Megaphone,
  Calendar,
  Target,
  Lightbulb,
  TrendingUp,
  Users,
  ExternalLink,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Globe,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";

interface CommunicationClient {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  monthlyBudget: number | null;
  description: string | null;
  createdAt: string;
  _count?: {
    contentCalendar: number;
    briefs: number;
    strategies: number;
    contentIdeas: number;
  };
}

const STATUS_OPTIONS = [
  { value: "active", label: "Actif", color: "bg-emerald-500" },
  { value: "inactive", label: "Inactif", color: "bg-[#0a0a0f]0" },
  { value: "pending", label: "En attente", color: "bg-amber-500" },
  { value: "paused", label: "En pause", color: "bg-blue-500" },
];

export default function CommunicationHubsPage() {
  const [clients, setClients] = useState<CommunicationClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<CommunicationClient | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/communication/clients?includeStats=true");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const clientData = {
      name: formData.get("name"),
      website: formData.get("website") || null,
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      description: formData.get("description") || null,
      monthlyBudget: formData.get("monthlyBudget") ? parseInt(formData.get("monthlyBudget") as string) : null,
      status: formData.get("status") || "active",
    };

    try {
      const res = await fetch("/api/communication/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchClients();
      }
    } catch (error) {
      console.error("Error creating client:", error);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;

    const formData = new FormData(e.currentTarget);
    
    const clientData = {
      id: editingClient.id,
      name: formData.get("name"),
      website: formData.get("website") || null,
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      description: formData.get("description") || null,
      monthlyBudget: formData.get("monthlyBudget") ? parseInt(formData.get("monthlyBudget") as string) : null,
      status: formData.get("status") || "active",
    };

    try {
      const res = await fetch("/api/communication/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });

      if (res.ok) {
        setEditingClient(null);
        fetchClients();
      }
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client et tout son contenu ?")) return;

    try {
      const res = await fetch(`/api/communication/clients?id=${clientId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchClients();
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === "active").length,
    totalBudget: clients.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0),
    totalContent: clients.reduce((sum, c) => sum + (c._count?.contentCalendar || 0), 0),
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Megaphone className="w-8 h-8" />
                  Hubs de Communication
                </h1>
                <p className="text-white/80 mt-1">
                  Gérez les communications numériques de vos clients
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#12121a] hover:bg-[#12121a]/90 text-violet-600 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Nouveau client
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-[#12121a]/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-white/80" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalClients}</div>
                    <div className="text-sm text-white/70">Clients total</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#12121a]/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white/80" />
                  <div>
                    <div className="text-2xl font-bold">{stats.activeClients}</div>
                    <div className="text-sm text-white/70">Clients actifs</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#12121a]/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-white/80" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalBudget.toLocaleString("fr-CA")} $</div>
                    <div className="text-sm text-white/70">Budget mensuel total</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#12121a]/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-white/80" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalContent}</div>
                    <div className="text-sm text-white/70">Publications planifiées</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg"
            >
              <option value="">Tous les statuts</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* Clients Grid */}
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
              {filteredClients.map(client => (
                <div
                  key={client.id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all group"
                >
                  {/* Client Header */}
                  <div className="p-5 border-b border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {client.logoUrl ? (
                          <Image
                            src={client.logoUrl}
                            alt={client.name}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {client.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{client.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${STATUS_OPTIONS.find(s => s.value === client.status)?.color}`} />
                            <span className="text-xs text-muted-foreground">
                              {STATUS_OPTIONS.find(s => s.value === client.status)?.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingClient(client)}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    {client.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {client.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 divide-x divide-border">
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-foreground">
                        {client._count?.contentCalendar || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Publications</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-foreground">
                        {client._count?.briefs || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Briefs</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-foreground">
                        {client._count?.strategies || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Stratégies</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-foreground">
                        {client._count?.contentIdeas || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Idées</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-muted/30">
                    <Link
                      href={`/communication/${client.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      Ouvrir le Hub
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || statusFilter ? "Aucun client trouvé" : "Aucun client"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter
                  ? "Essayez de modifier vos filtres"
                  : "Créez votre premier client pour commencer"}
              </p>
              {!searchQuery && !statusFilter && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Créer un client
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Client Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Nouveau client</h2>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Brève description du client..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Site web
                    </label>
                    <input
                      type="url"
                      name="website"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="contact@..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="(514) 555-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Budget mensuel ($)
                    </label>
                    <input
                      type="number"
                      name="monthlyBudget"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="5000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Statut
                  </label>
                  <select
                    name="status"
                    defaultValue="active"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Créer le client
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Client Modal */}
        {editingClient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Modifier le client</h2>
                <button onClick={() => setEditingClient(null)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleUpdateClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingClient.name}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingClient.description || ""}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Site web
                    </label>
                    <input
                      type="url"
                      name="website"
                      defaultValue={editingClient.website || ""}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingClient.email || ""}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingClient.phone || ""}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Budget mensuel ($)
                    </label>
                    <input
                      type="number"
                      name="monthlyBudget"
                      defaultValue={editingClient.monthlyBudget || ""}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Statut
                  </label>
                  <select
                    name="status"
                    defaultValue={editingClient.status}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
