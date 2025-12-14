"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  ArrowLeft,
  Search,
  ThumbsUp,
  MessageSquare,
  User,
  Building2,
  Clock,
  CheckCircle2,
  Eye,
  Send,
  Loader2,
  TrendingUp,
} from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  sourceType: string;
  employee: { id: string; name: string; photoUrl: string | null; department: string } | null;
  clientPortal: { id: string; clientName: string } | null;
  adminResponse: string | null;
  respondedAt: string | null;
  respondedBy: string | null;
  voteCount: number;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "under_review", label: "En étude", color: "bg-blue-500/20 text-blue-400" },
  { value: "approved", label: "Approuvée", color: "bg-green-500/20 text-green-400" },
  { value: "rejected", label: "Refusée", color: "bg-red-500/20 text-red-400" },
  { value: "implemented", label: "Implémentée", color: "bg-purple-500/20 text-purple-400" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "Général" },
  { value: "process", label: "Processus" },
  { value: "tools", label: "Outils" },
  { value: "environment", label: "Environnement" },
  { value: "communication", label: "Communication" },
  { value: "training", label: "Formation" },
];

export default function AdminRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  async function fetchRecommendations() {
    try {
      const res = await fetch("/api/admin/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateRecommendation() {
    if (!selectedRec) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/recommendations/${selectedRec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus || selectedRec.status,
          adminResponse: adminResponse || null,
        }),
      });

      if (res.ok) {
        fetchRecommendations();
        setShowModal(false);
        setSelectedRec(null);
        setAdminResponse("");
        setNewStatus("");
      }
    } catch (error) {
      console.error("Error updating recommendation:", error);
    } finally {
      setSaving(false);
    }
  }

  function openModal(rec: Recommendation) {
    setSelectedRec(rec);
    setAdminResponse(rec.adminResponse || "");
    setNewStatus(rec.status);
    setShowModal(true);
  }

  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesSearch = rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rec.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || rec.category === categoryFilter;
    const matchesSource = sourceFilter === "all" || rec.sourceType === sourceFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesSource;
  });

  const stats = {
    total: recommendations.length,
    pending: recommendations.filter(r => r.status === "pending").length,
    approved: recommendations.filter(r => r.status === "approved" || r.status === "implemented").length,
    fromEmployees: recommendations.filter(r => r.sourceType === "employee").length,
    fromClients: recommendations.filter(r => r.sourceType === "client").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Lightbulb className="w-7 h-7 text-amber-400" />
                Gestion des recommandations
              </h1>
              <p className="text-slate-400 text-sm">Gérez les suggestions des employés et clients</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              En attente
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Approuvées
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
              <User className="w-4 h-4" />
              Employés
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.fromEmployees}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
              <Building2 className="w-4 h-4" />
              Clients
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.fromClients}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous les statuts</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Toutes les catégories</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Toutes les sources</option>
              <option value="employee">Employés</option>
              <option value="client">Clients</option>
            </select>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          {filteredRecommendations.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-xl">
              <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Aucune recommandation trouvée</p>
            </div>
          ) : (
            filteredRecommendations.map((rec) => {
              const statusOption = STATUS_OPTIONS.find(s => s.value === rec.status);
              return (
                <div key={rec.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Vote Count */}
                    <div className="flex flex-col items-center gap-1 min-w-[50px]">
                      <ThumbsUp className="w-5 h-5 text-amber-400" />
                      <span className="text-lg font-bold text-amber-400">{rec.voteCount}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-white">{rec.title}</h3>
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{rec.description}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${statusOption?.color || "bg-slate-500/20 text-slate-400"}`}>
                          {statusOption?.label || rec.status}
                        </span>
                      </div>

                      <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          {rec.sourceType === "employee" ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          {rec.sourceType === "employee" ? rec.employee?.name : rec.clientPortal?.clientName || "Anonyme"}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-700 rounded">
                          {CATEGORY_OPTIONS.find(c => c.value === rec.category)?.label || rec.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(rec.createdAt).toLocaleDateString("fr-CA")}
                        </span>
                        {rec.adminResponse && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <MessageSquare className="w-3 h-3" />
                            Réponse envoyée
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => openModal(rec)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal */}
        {showModal && selectedRec && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Détails de la recommandation
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Titre</label>
                  <p className="text-white font-medium">{selectedRec.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <p className="text-slate-300">{selectedRec.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Source</label>
                    <p className="text-white flex items-center gap-2">
                      {selectedRec.sourceType === "employee" ? (
                        <>
                          <User className="w-4 h-4 text-blue-400" />
                          {selectedRec.employee?.name} ({selectedRec.employee?.department})
                        </>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4 text-purple-400" />
                          {selectedRec.clientPortal?.clientName}
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Votes</label>
                    <p className="text-amber-400 font-bold flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      {selectedRec.voteCount}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Statut</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Réponse de l'administration</label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={4}
                    placeholder="Écrivez une réponse pour l'auteur de la recommandation..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={updateRecommendation}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
