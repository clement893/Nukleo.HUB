"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
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
  status: string;
  validUntil: string | null;
  createdAt: string;
  quote: {
    id: string;
    title: string;
    clientName: string;
    clientCompany: string | null;
    total: number;
  };
}

interface Quote {
  id: string;
  title: string;
  clientName: string;
  clientCompany: string | null;
  subtotal: number;
  total: number;
  phases: string | null;
  taxRate: number;
  currency: string;
  validUntil: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "bg-gray-500/10 text-gray-500", icon: <Edit className="w-4 h-4" /> },
  sent: { label: "Envoyée", color: "bg-blue-500/10 text-blue-500", icon: <Send className="w-4 h-4" /> },
  accepted: { label: "Acceptée", color: "bg-green-500/10 text-green-500", icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: "Rejetée", color: "bg-red-500/10 text-red-500", icon: <XCircle className="w-4 h-4" /> },
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    phases: [] as Array<{ name: string; description: string; estimatedHours: number; hourlyRate: number; selected: boolean }>,
    notes: "",
    validUntil: "",
  });

  useEffect(() => {
    fetchSubmissions();
    fetchQuotes();
  }, []);

  useEffect(() => {
    if (selectedQuoteId) {
      const quote = quotes.find((q) => q.id === selectedQuoteId);
      if (quote) {
        setSelectedQuote(quote);
        if (quote.phases) {
          setFormData((prev) => ({
            ...prev,
            phases: JSON.parse(quote.phases),
          }));
        }
      }
    }
  }, [selectedQuoteId, quotes]);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions");
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

  const fetchQuotes = async () => {
    try {
      const res = await fetch("/api/quotes");
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
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

  const handleCreate = async () => {
    if (!selectedQuoteId) {
      alert("Veuillez sélectionner un devis");
      return;
    }
    if (!formData.title.trim()) {
      alert("Veuillez entrer un titre pour la soumission");
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${selectedQuoteId}/submissions`, {
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
        setSelectedQuoteId("");
        setSelectedQuote(null);
        setFormData({
          title: "",
          description: "",
          phases: [],
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

  const calculateTotal = () => {
    const subtotal = formData.phases.reduce((acc, phase) => {
      if (phase.selected) {
        return acc + (phase.estimatedHours * phase.hourlyRate);
      }
      return acc;
    }, 0);
    const taxRate = selectedQuote?.taxRate || 0.14975;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-white">
        <Sidebar />
        <div className="flex-1 p-8">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Soumissions</h1>
            <p className="text-gray-400">Gérez toutes les soumissions (variantes de devis)</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Créer une soumission
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6 p-6 bg-[#0f0f15] border border-gray-700 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Créer une nouvelle soumission</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sélectionner un devis *
                </label>
                <select
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">-- Sélectionner un devis --</option>
                  {quotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.title} - {quote.clientName} ({formatCurrency(quote.total)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedQuote && (
                <>
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
                  {formData.phases.length > 0 && (
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
                  )}

                  {/* Totals */}
                  {formData.phases.length > 0 && (
                    <div className="bg-[#0a0a0f] border border-gray-700 rounded-lg p-4">
                      <div className="space-y-2 text-right">
                        <div className="flex justify-between text-gray-400">
                          <span>Sous-total</span>
                          <span>{formatCurrency(calculateTotal().subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Taxes ({(selectedQuote.taxRate * 100).toFixed(3)}%)</span>
                          <span>{formatCurrency(calculateTotal().taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-white border-t border-gray-700 pt-2">
                          <span>Total</span>
                          <span>{formatCurrency(calculateTotal().total)}</span>
                        </div>
                        {selectedQuote && (
                          <div className="text-sm text-gray-500 pt-2 border-t border-gray-700">
                            <div className="flex justify-between">
                              <span>Différence avec devis principal:</span>
                              <span className={calculateTotal().total - selectedQuote.total >= 0 ? "text-green-400" : "text-red-400"}>
                                {calculateTotal().total - selectedQuote.total >= 0 ? "+" : ""}
                                {formatCurrency(calculateTotal().total - selectedQuote.total)}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Date de validité (optionnel)
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
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
                        setSelectedQuoteId("");
                        setSelectedQuote(null);
                        setFormData({
                          title: "",
                          description: "",
                          phases: [],
                          notes: "",
                          validUntil: "",
                        });
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucune soumission créée.
            </div>
          ) : (
            submissions.map((submission) => {
              const statusConfig = STATUS_CONFIG[submission.status] || STATUS_CONFIG.draft;

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
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>
                          <strong>Devis :</strong>{" "}
                          <Link
                            href={`/billing/quotes/${submission.quoteId}`}
                            className="text-violet-400 hover:text-violet-300 hover:underline"
                          >
                            {submission.quote.title}
                          </Link>
                        </p>
                        <p>
                          <strong>Client :</strong> {submission.quote.clientName}
                          {submission.quote.clientCompany && ` - ${submission.quote.clientCompany}`}
                        </p>
                        {submission.description && (
                          <p className="mt-2">{submission.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white mb-1">
                        {formatCurrency(submission.total)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Sous-total: {formatCurrency(submission.subtotal)}
                      </div>
                      <Link
                        href={`/billing/quotes/${submission.quoteId}/submissions`}
                        className="inline-flex items-center gap-1 mt-2 text-sm text-violet-400 hover:text-violet-300"
                      >
                        Voir toutes les soumissions <ArrowRight className="w-3 h-3" />
                      </Link>
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
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

