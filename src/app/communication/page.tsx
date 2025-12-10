"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Search,
  Building2,
  Globe,
  Mail,
  Phone,
  MoreVertical,
  Share2,
  Megaphone,
  Key,
  MessageSquare,
  CheckSquare,
  TrendingUp,
  Users,
  Zap,
  Sparkles,
  ArrowRight,
  X,
  Calendar,
  DollarSign,
  Trash2,
  Link2,
  Tag,
  Settings,
  Palette,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  description: string | null;
  _count: { clients: number };
}

interface CommunicationClient {
  id: string;
  name: string;
  company: string | null;
  companyId: string | null;
  categoryId: string | null;
  category: ClientCategory | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  status: string;
  monthlyBudget: number | null;
  _count: {
    socialAccounts: number;
    newsletters: number;
    campaigns: number;
    accesses: number;
    messages: number;
    tasks: number;
  };
  tasks: { id: string; status: string }[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Actif" },
  paused: { bg: "bg-amber-500/10", text: "text-amber-500", label: "En pause" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Terminé" },
};

const INDUSTRIES = [
  "Technologie",
  "Santé",
  "Finance",
  "Commerce",
  "Éducation",
  "Immobilier",
  "Restauration",
  "Services",
  "Industrie",
  "Autre",
];

export default function CommunicationHubPage() {
  const [clients, setClients] = useState<CommunicationClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    companyId: "",
    categoryId: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    monthlyBudget: "",
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", color: "#6366f1", description: "" });

  useEffect(() => {
    fetchClients();
    fetchCompanies();
    fetchCategories();
  }, [filterStatus, filterCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/communication/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    try {
      const res = await fetch("/api/communication/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      if (res.ok) {
        setShowCategoryModal(false);
        setNewCategory({ name: "", color: "#6366f1", description: "" });
        fetchCategories();
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ? Les clients associés seront déliés.")) return;
    try {
      await fetch(`/api/communication/categories/${id}`, { method: "DELETE" });
      fetchCategories();
      fetchClients();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies?isClient=true");
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      let url = "/api/communication/clients";
      if (filterStatus) url += `?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
    setLoading(false);
  };

  const handleAddClient = async () => {
    if (!newClient.name) return;
    try {
      const res = await fetch("/api/communication/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newClient,
          companyId: newClient.companyId || null,
          categoryId: newClient.categoryId || null,
          monthlyBudget: newClient.monthlyBudget ? parseInt(newClient.monthlyBudget) : null,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewClient({ name: "", company: "", companyId: "", categoryId: "", email: "", phone: "", website: "", industry: "", monthlyBudget: "" });
        fetchClients();
      }
    } catch (error) {
      console.error("Error adding client:", error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Supprimer ce client et toutes ses données ?")) return;
    try {
      await fetch(`/api/communication/clients/${id}`, { method: "DELETE" });
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || client.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    totalBudget: clients.reduce((acc, c) => acc + (c.monthlyBudget || 0), 0),
    pendingTasks: clients.reduce((acc, c) => acc + c.tasks.filter((t) => t.status !== "done").length, 0),
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

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
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Hub Communication
              </h1>
              <p className="text-sm text-muted-foreground">Gestion intelligente de la communication numérique</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouveau client
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Users className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Clients</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Zap className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Actifs</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalBudget.toLocaleString()}$</p>
                  <p className="text-sm text-muted-foreground">Budget mensuel</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <CheckSquare className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingTasks}</p>
                  <p className="text-sm text-muted-foreground">Tâches en cours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name} ({cat._count.clients})</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="paused">En pause</option>
              <option value="completed">Terminés</option>
            </select>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Tag className="h-4 w-4" />
              Gérer les catégories
            </button>
          </div>

          {/* Clients grid */}
          {filteredClients.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucun client</h3>
              <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier client de communication</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter un client
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {filteredClients.map((client) => {
                const statusInfo = STATUS_COLORS[client.status] || STATUS_COLORS.active;
                return (
                  <div
                    key={client.id}
                    className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {client.logoUrl ? (
                            <img src={client.logoUrl} alt={client.name} className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            getInitials(client.name)
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{client.name}</h3>
                          {client.company && (
                            <p className="text-sm text-muted-foreground">{client.company}</p>
                          )}
                          {client.companyId && (
                            <div className="flex items-center gap-1 mt-1">
                              <Link2 className="h-3 w-3 text-primary" />
                              <span className="text-xs text-primary">Lié à un client</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {client.category && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${client.category.color}20`, color: client.category.color }}
                          >
                            {client.category.name}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Supprimer cet espace"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Share2 className="h-4 w-4" />
                        <span>{client._count.socialAccounts}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Megaphone className="h-4 w-4" />
                        <span>{client._count.campaigns}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckSquare className="h-4 w-4" />
                        <span>{client.tasks.filter((t) => t.status !== "done").length}</span>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-2 mb-4 text-sm">
                      {client.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.website && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <a href={client.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary">
                            {client.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                    </div>

                    {client.monthlyBudget && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <DollarSign className="h-4 w-4" />
                        <span>{client.monthlyBudget.toLocaleString()}$/mois</span>
                      </div>
                    )}

                    <Link
                      href={`/communication/${client.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Gérer
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add client modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Nouveau client</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nom du client *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: Acme Corp"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Lier à un client existant</label>
                    <select
                      value={newClient.companyId}
                      onChange={(e) => {
                        const selectedCompany = companies.find(c => c.id === e.target.value);
                        setNewClient({ 
                          ...newClient, 
                          companyId: e.target.value,
                          company: selectedCompany?.name || newClient.company
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Aucun (standalone)</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Catégorie</label>
                    <select
                      value={newClient.categoryId}
                      onChange={(e) => setNewClient({ ...newClient, categoryId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Aucune catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Entreprise (texte)</label>
                    <input
                      type="text"
                      value={newClient.company}
                      onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nom de l'entreprise"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Industrie</label>
                    <select
                      value={newClient.industry}
                      onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sélectionner</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Site web</label>
                    <input
                      type="url"
                      value={newClient.website}
                      onChange={(e) => setNewClient({ ...newClient, website: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Budget mensuel ($)</label>
                    <input
                      type="number"
                      value={newClient.monthlyBudget}
                      onChange={(e) => setNewClient({ ...newClient, monthlyBudget: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddClient}
                  disabled={!newClient.name}
                  className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Créer le client
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category management modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Gérer les catégories</h2>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Existing categories */}
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune catégorie créée</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium text-foreground">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">({cat._count.clients} clients)</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add new category */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Nouvelle catégorie</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Nom de la catégorie"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="w-full h-10 rounded-lg border border-border cursor-pointer"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Description (optionnel)"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategory.name}
                    className="w-full py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Ajouter la catégorie
                  </button>
                </div>
              </div>

              {/* Suggested categories */}
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Catégories suggérées</h3>
                <div className="flex flex-wrap gap-2">
                  {["Maintenance", "Communication", "Web", "Marketing", "Design", "Développement", "SEO", "Réseaux sociaux"].map((name) => (
                    <button
                      key={name}
                      onClick={() => setNewCategory({ ...newCategory, name })}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
