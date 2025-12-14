"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  FileText,
  Plus,
  Search,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  DollarSign,
  Calendar,
  Building2,
  ArrowLeft,
} from "lucide-react";

interface Quote {
  id: string;
  projectId: string | null;
  clientName: string;
  clientEmail: string | null;
  clientCompany: string | null;
  title: string;
  description: string | null;
  status: string;
  validUntil: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  phases: string | null;
  notes: string | null;
  terms: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  client: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "bg-gray-500/10 text-gray-500", icon: <Edit className="w-4 h-4" /> },
  sent: { label: "Envoyé", color: "bg-blue-500/10 text-blue-500", icon: <Send className="w-4 h-4" /> },
  accepted: { label: "Accepté", color: "bg-green-500/10 text-green-500", icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: "Refusé", color: "bg-red-500/10 text-red-500", icon: <XCircle className="w-4 h-4" /> },
  expired: { label: "Expiré", color: "bg-amber-500/10 text-amber-500", icon: <Clock className="w-4 h-4" /> },
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState({
    projectId: "",
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    title: "",
    description: "",
    validUntil: "",
    notes: "",
    terms: "Paiement dû dans les 30 jours suivant l'acceptation du devis.",
    phases: [] as Array<{ name: string; description: string; estimatedHours: number; hourlyRate: number; selected: boolean }>,
  });

  useEffect(() => {
    fetchQuotes();
    fetchProjects();
  }, [filterStatus]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      let url = "/api/quotes";
      if (filterStatus) url += `?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      setQuotes(data);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.title) return;

    try {
      const method = editingQuote ? "PATCH" : "POST";
      const body = editingQuote
        ? { id: editingQuote.id, ...formData }
        : formData;

      const res = await fetch("/api/quotes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchQuotes();
      }
    } catch (error) {
      console.error("Error saving quote:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce devis ?")) return;
    try {
      await fetch(`/api/quotes?id=${id}`, { method: "DELETE" });
      fetchQuotes();
    } catch (error) {
      console.error("Error deleting quote:", error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchQuotes();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: "",
      clientName: "",
      clientEmail: "",
      clientCompany: "",
      title: "",
      description: "",
      validUntil: "",
      notes: "",
      terms: "Paiement dû dans les 30 jours suivant l'acceptation du devis.",
      phases: [],
    });
    setEditingQuote(null);
  };

  const openEditModal = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      projectId: quote.projectId || "",
      clientName: quote.clientName,
      clientEmail: quote.clientEmail || "",
      clientCompany: quote.clientCompany || "",
      title: quote.title,
      description: quote.description || "",
      validUntil: quote.validUntil ? quote.validUntil.split("T")[0] : "",
      notes: quote.notes || "",
      terms: quote.terms || "",
      phases: quote.phases ? JSON.parse(quote.phases) : [],
    });
    setShowModal(true);
  };

  const addPhase = () => {
    setFormData({
      ...formData,
      phases: [
        ...formData.phases,
        { name: "", description: "", estimatedHours: 0, hourlyRate: 125, selected: true },
      ],
    });
  };

  const updatePhase = (index: number, field: string, value: string | number | boolean) => {
    const newPhases = [...formData.phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setFormData({ ...formData, phases: newPhases });
  };

  const removePhase = (index: number) => {
    setFormData({
      ...formData,
      phases: formData.phases.filter((_, i) => i !== index),
    });
  };

  const calculateTotal = () => {
    const subtotal = formData.phases
      .filter((p) => p.selected)
      .reduce((acc, p) => acc + p.estimatedHours * p.hourlyRate, 0);
    const taxAmount = subtotal * 0.14975;
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const filteredQuotes = quotes.filter(
    (q) =>
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clientCompany?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    totalValue: quotes.filter((q) => q.status === "accepted").reduce((acc, q) => acc + q.total, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="pl-64 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/billing"
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Devis</h1>
                <p className="text-gray-400 mt-1">Gérez vos devis et propositions commerciales</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau devis
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-sm text-gray-400">Total devis</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/20 rounded-lg">
                  <Edit className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.draft}</p>
                  <p className="text-sm text-gray-400">Brouillons</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Send className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.sent}</p>
                  <p className="text-sm text-gray-400">Envoyés</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.accepted}</p>
                  <p className="text-sm text-gray-400">Acceptés</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-sm text-gray-400">Valeur acceptée</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher un devis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-[#1a1a2e] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="sent">Envoyés</option>
              <option value="accepted">Acceptés</option>
              <option value="rejected">Refusés</option>
              <option value="expired">Expirés</option>
            </select>
          </div>

          {/* Quotes List */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Chargement...</div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun devis trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => {
                const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
                return (
                  <div
                    key={quote.id}
                    className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{quote.title}</h3>
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" />
                            {quote.clientName}
                            {quote.clientCompany && ` - ${quote.clientCompany}`}
                          </span>
                          {quote.validUntil && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              Valide jusqu'au {new Date(quote.validUntil).toLocaleDateString("fr-CA")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">{formatCurrency(quote.total)}</p>
                          <p className="text-xs text-gray-500">TTC</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {quote.status === "draft" && (
                            <button
                              onClick={() => handleStatusChange(quote.id, "sent")}
                              className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                              title="Marquer comme envoyé"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {quote.status === "sent" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(quote.id, "accepted")}
                                className="p-2 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                                title="Marquer comme accepté"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(quote.id, "rejected")}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Marquer comme refusé"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEditModal(quote)}
                            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(quote.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-6">
                {editingQuote ? "Modifier le devis" : "Nouveau devis"}
              </h2>

              <div className="space-y-6">
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nom du client *</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Entreprise</label>
                    <input
                      type="text"
                      value={formData.clientCompany}
                      onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Projet lié</label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="">Aucun projet</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quote Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Titre du devis *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      placeholder="Ex: Développement site web e-commerce"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Valide jusqu'au</label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Phases */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-300">Phases du projet</label>
                    <button
                      onClick={addPhase}
                      className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une phase
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.phases.map((phase, index) => (
                      <div key={index} className="p-4 bg-[#0a0a0f] border border-gray-700 rounded-lg">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={phase.selected}
                            onChange={(e) => updatePhase(index, "selected", e.target.checked)}
                            className="mt-1"
                          />
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={phase.name}
                                onChange={(e) => updatePhase(index, "name", e.target.value)}
                                placeholder="Nom de la phase"
                                className="w-full px-2 py-1 bg-transparent border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-violet-500"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                value={phase.estimatedHours}
                                onChange={(e) => updatePhase(index, "estimatedHours", parseFloat(e.target.value) || 0)}
                                placeholder="Heures"
                                className="w-full px-2 py-1 bg-transparent border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-violet-500"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                value={phase.hourlyRate}
                                onChange={(e) => updatePhase(index, "hourlyRate", parseFloat(e.target.value) || 0)}
                                placeholder="$/h"
                                className="w-full px-2 py-1 bg-transparent border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-violet-500"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removePhase(index)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2 ml-6">
                          <input
                            type="text"
                            value={phase.description}
                            onChange={(e) => updatePhase(index, "description", e.target.value)}
                            placeholder="Description de la phase"
                            className="w-full px-2 py-1 bg-transparent border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-violet-500"
                          />
                        </div>
                        <div className="mt-2 ml-6 text-right text-sm text-gray-400">
                          {phase.selected && `${formatCurrency(phase.estimatedHours * phase.hourlyRate)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                {formData.phases.length > 0 && (
                  <div className="bg-[#0a0a0f] border border-gray-700 rounded-lg p-4">
                    <div className="space-y-2 text-right">
                      <div className="flex justify-between text-gray-400">
                        <span>Sous-total</span>
                        <span>{formatCurrency(calculateTotal().subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Taxes (14.975%)</span>
                        <span>{formatCurrency(calculateTotal().taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-white border-t border-gray-700 pt-2">
                        <span>Total</span>
                        <span>{formatCurrency(calculateTotal().total)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes & Terms */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Conditions</label>
                    <textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.clientName || !formData.title}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {editingQuote ? "Mettre à jour" : "Créer le devis"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
