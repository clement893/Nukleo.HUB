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
  Clock,
} from "lucide-react";

interface Submission {
  id: string;
  quoteId: string | null;
  version: number;
  title: string;
  description: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientCompany: string | null;
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
  } | null;
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
  pending_approval: { label: "En attente", color: "bg-yellow-500/10 text-yellow-500", icon: <Clock className="w-4 h-4" /> },
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
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    phases: [] as Array<{ name: string; description: string; estimatedHours: number; hourlyRate: number; selected: boolean }>,
    notes: "",
    validUntil: "",
    taxRate: "0.14975",
    currency: "CAD",
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
        if (quote.phases && quote.phases.trim()) {
          try {
            const phasesString = quote.phases;
            if (phasesString) {
              setFormData((prev) => ({
                ...prev,
                phases: JSON.parse(phasesString),
              }));
            }
          } catch (error) {
            console.error("Error parsing phases:", error);
            setFormData((prev) => ({
              ...prev,
              phases: [],
            }));
          }
        } else {
          setFormData((prev) => ({
            ...prev,
            phases: [],
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
    if (!formData.title.trim()) {
      alert("Veuillez entrer un titre pour la soumission");
      return;
    }

    if (!formData.clientName.trim()) {
      alert("Veuillez entrer le nom du client");
      return;
    }

    try {
      // Si un devis est sélectionné, créer via l'API des soumissions de devis
      // Sinon, créer une soumission indépendante
      const url = selectedQuoteId 
        ? `/api/quotes/${selectedQuoteId}/submissions`
        : `/api/submissions`;
      
      const body = selectedQuoteId
        ? {
            ...formData,
            phases: formData.phases,
            validUntil: formData.validUntil || null,
          }
        : {
            title: formData.title,
            description: formData.description,
            clientName: formData.clientName,
            clientEmail: formData.clientEmail || null,
            clientCompany: formData.clientCompany || null,
            phases: formData.phases,
            notes: formData.notes,
            validUntil: formData.validUntil || null,
            taxRate: parseFloat(formData.taxRate),
            currency: formData.currency,
            quoteId: null, // Soumission indépendante
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setSelectedQuoteId("");
        setSelectedQuote(null);
        setFormData({
          title: "",
          description: "",
          clientName: "",
          clientEmail: "",
          clientCompany: "",
          phases: [],
          notes: "",
          validUntil: "",
          taxRate: "0.14975",
          currency: "CAD",
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
    const taxRate = parseFloat(formData.taxRate) || (selectedQuote?.taxRate || 0.14975);
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const addPhase = () => {
    setFormData({
      ...formData,
      phases: [
        ...formData.phases,
        {
          name: "",
          description: "",
          estimatedHours: 0,
          hourlyRate: 150,
          selected: true,
        },
      ],
    });
  };

  const removePhase = (index: number) => {
    const newPhases = formData.phases.filter((_, i) => i !== index);
    setFormData({ ...formData, phases: newPhases });
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
      <div className="flex-1 p-8 overflow-x-auto ml-64">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Soumissions</h1>
            <p className="text-gray-400">Gérez toutes les soumissions (variantes de devis)</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/commercial/submissions/new"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded text-sm font-medium"
            >
              Créer une Soumission
            </Link>
            <Link
              href="/commercial/submissions/approve"
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium"
            >
              Approbations
            </Link>
          </div>
        </div>

        {showCreateForm && (
          <div className="mb-6 p-6 bg-[#0f0f15] border border-gray-700 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Créer une nouvelle soumission</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Lier à un devis existant (optionnel)
                </label>
                <select
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">-- Créer une soumission indépendante --</option>
                  {quotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.title} - {quote.clientName} ({formatCurrency(quote.total)})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Les soumissions sont pour les gros projets. Vous pouvez créer une soumission indépendante ou la lier à un devis existant.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Titre de la soumission *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Soumission - Projet de transformation numérique"
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Nom du client"
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Entreprise du client
                  </label>
                  <input
                    type="text"
                    value={formData.clientCompany}
                    onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                    placeholder="Nom de l'entreprise"
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email du client
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description du projet
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Décrivez le projet et la soumission..."
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>

                  {/* Phases */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Phases du projet
                      </label>
                      <button
                        type="button"
                        onClick={addPhase}
                        className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Ajouter une phase
                      </button>
                    </div>
                    {formData.phases.length > 0 ? (
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
                            <button
                              type="button"
                              onClick={() => removePhase(index)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Aucune phase ajoutée. Cliquez sur "Ajouter une phase" pour commencer.</p>
                    )}
                  </div>

                  {/* Totals */}
                  {formData.phases.length > 0 && (
                    <div className="bg-[#0a0a0f] border border-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Taux de taxes
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={formData.taxRate}
                            onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                            className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Devise
                          </label>
                          <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded text-white text-sm"
                          >
                            <option value="CAD">CAD</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="flex justify-between text-gray-400">
                          <span>Sous-total</span>
                          <span>{formatCurrency(calculateTotal().subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Taxes ({(parseFloat(formData.taxRate) * 100).toFixed(3)}%)</span>
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
                          clientName: "",
                          clientEmail: "",
                          clientCompany: "",
                          phases: [],
                          notes: "",
                          validUntil: "",
                          taxRate: "0.14975",
                          currency: "CAD",
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
                        {submission.quote ? (
                          <>
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
                          </>
                        ) : (
                          <>
                            <p>
                              <strong>Client :</strong> {submission.clientName || "Non spécifié"}
                              {submission.clientCompany && ` - ${submission.clientCompany}`}
                            </p>
                            {submission.clientEmail && (
                              <p>
                                <strong>Email :</strong> {submission.clientEmail}
                              </p>
                            )}
                          </>
                        )}
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
                      {submission.quoteId && (
                        <Link
                          href={`/billing/quotes/${submission.quoteId}/submissions`}
                          className="inline-flex items-center gap-1 mt-2 text-sm text-violet-400 hover:text-violet-300"
                        >
                          Voir toutes les soumissions <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
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

