"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Submission {
  id: string;
  quoteId: string;
  version: number;
  title: string;
  description: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  phases: string | null;
  notes: string | null;
  differences: string | null;
  status: string;
  validUntil: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface Quote {
  id: string;
  title: string;
  clientName: string;
  clientCompany: string | null;
  subtotal: number;
  total: number;
  phases: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "bg-gray-500/10 text-gray-500", icon: <Edit className="w-4 h-4" /> },
  sent: { label: "Envoyée", color: "bg-blue-500/10 text-blue-500", icon: <Send className="w-4 h-4" /> },
  accepted: { label: "Acceptée", color: "bg-green-500/10 text-green-500", icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: "Rejetée", color: "bg-red-500/10 text-red-500", icon: <XCircle className="w-4 h-4" /> },
};

export default function SubmissionsPage() {
  const params = useParams();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    phases: [] as Array<{ name: string; description: string; estimatedHours: number; hourlyRate: number; selected: boolean }>,
    notes: "",
    validUntil: "",
  });

  useEffect(() => {
    fetchQuote();
    fetchSubmissions();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      const res = await fetch(`/api/quotes?id=${quoteId}`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data);
        // Initialiser les phases du formulaire avec celles du devis
        if (data.phases) {
          setFormData(prev => ({
            ...prev,
            phases: JSON.parse(data.phases),
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert("Veuillez entrer un titre pour la soumission");
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${quoteId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          phases: formData.phases,
          validUntil: formData.validUntil || null,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormData({
          title: "",
          description: "",
          phases: quote?.phases ? JSON.parse(quote.phases) : [],
          notes: "",
          validUntil: "",
        });
        fetchSubmissions();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating submission:", error);
      alert("Erreur lors de la création de la soumission");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette soumission ?")) return;
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const calculateTotal = () => {
    const subtotal = formData.phases.reduce((acc, phase) => {
      if (phase.selected) {
        return acc + (phase.estimatedHours * phase.hourlyRate);
      }
      return acc;
    }, 0);
    const taxRate = 0.14975;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const getDifferences = (submission: Submission) => {
    if (!submission.differences || !quote) return null;
    try {
      return JSON.parse(submission.differences);
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-white">
        <Sidebar />
        <div className="flex-1 p-8">Chargement...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-white">
        <Sidebar />
        <div className="flex-1 p-8">
          <p>Devis non trouvé</p>
          <Link href="/billing/quotes" className="text-violet-500 hover:underline">
            Retour aux devis
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6">
          <Link
            href="/billing/quotes"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux devis
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Soumissions - {quote.title}</h1>
              <p className="text-gray-400">
                Client: {quote.clientName}
                {quote.clientCompany && ` - ${quote.clientCompany}`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Devis principal: {formatCurrency(quote.total)}
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Créer une soumission
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="mb-6 p-6 bg-[#0f0f15] border border-gray-700 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Créer une nouvelle soumission</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Titre de la soumission *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Option Premium, Version All-inclusive"
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description des différences
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Décrivez les différences avec le devis principal..."
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Phases */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phases (modifiez les sélections et tarifs pour cette soumission)
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.phases.map((phase, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-[#0a0a0f] border border-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={phase.selected}
                        onChange={(e) => {
                          const newPhases = [...formData.phases];
                          newPhases[index].selected = e.target.checked;
                          setFormData({ ...formData, phases: newPhases });
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => {
                            const newPhases = [...formData.phases];
                            newPhases[index].name = e.target.value;
                            setFormData({ ...formData, phases: newPhases });
                          }}
                          placeholder="Nom de la phase"
                          className="w-full px-2 py-1 bg-transparent border border-gray-700 rounded text-white text-sm mb-1"
                        />
                        <div className="flex gap-2 mt-1">
                          <input
                            type="number"
                            value={phase.estimatedHours}
                            onChange={(e) => {
                              const newPhases = [...formData.phases];
                              newPhases[index].estimatedHours = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, phases: newPhases });
                            }}
                            placeholder="Heures"
                            className="w-24 px-2 py-1 bg-transparent border border-gray-700 rounded text-white text-sm"
                          />
                          <input
                            type="number"
                            value={phase.hourlyRate}
                            onChange={(e) => {
                              const newPhases = [...formData.phases];
                              newPhases[index].hourlyRate = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, phases: newPhases });
                            }}
                            placeholder="Taux/h"
                            className="w-24 px-2 py-1 bg-transparent border border-gray-700 rounded text-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        {phase.selected && formatCurrency(phase.estimatedHours * phase.hourlyRate)}
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
                    {quote && (
                      <div className="text-sm text-gray-500 pt-2 border-t border-gray-700">
                        <div className="flex justify-between">
                          <span>Différence avec devis principal:</span>
                          <span className={calculateTotal().total - quote.total >= 0 ? "text-green-400" : "text-red-400"}>
                            {calculateTotal().total - quote.total >= 0 ? "+" : ""}
                            {formatCurrency(calculateTotal().total - quote.total)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg"
                >
                  Créer la soumission
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      title: "",
                      description: "",
                      phases: quote.phases ? JSON.parse(quote.phases) : [],
                      notes: "",
                      validUntil: "",
                    });
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des soumissions */}
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucune soumission créée pour ce devis.
            </div>
          ) : (
            submissions.map((submission) => {
              const statusConfig = STATUS_CONFIG[submission.status] || STATUS_CONFIG.draft;
              const differences = getDifferences(submission);

              return (
                <div
                  key={submission.id}
                  className="p-6 bg-[#0f0f15] border border-gray-700 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{submission.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                          Version {submission.version}
                        </span>
                      </div>
                      {submission.description && (
                        <p className="text-gray-400 text-sm mb-2">{submission.description}</p>
                      )}
                      {differences && (
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>
                            Différence:{" "}
                            <span className={differences.totalDiff >= 0 ? "text-green-400" : "text-red-400"}>
                              {differences.totalDiff >= 0 ? "+" : ""}
                              {formatCurrency(differences.totalDiff)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white mb-1">
                        {formatCurrency(submission.total)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Sous-total: {formatCurrency(submission.subtotal)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleStatusChange(submission.id, "sent")}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      disabled={submission.status === "sent"}
                    >
                      <Send className="w-3 h-3" />
                      Envoyer
                    </button>
                    <button
                      onClick={() => handleStatusChange(submission.id, "accepted")}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                      disabled={submission.status === "accepted"}
                    >
                      <CheckCircle className="w-3 h-3" />
                      Accepter
                    </button>
                    <button
                      onClick={() => handleStatusChange(submission.id, "rejected")}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                      disabled={submission.status === "rejected"}
                    >
                      <XCircle className="w-3 h-3" />
                      Rejeter
                    </button>
                    <button
                      onClick={() => handleDelete(submission.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </button>
                  </div>

                  {submission.sentAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Envoyée le: {new Date(submission.sentAt).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

