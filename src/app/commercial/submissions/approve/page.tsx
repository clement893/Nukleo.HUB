"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  CheckCircle,
  XCircle,
  Send,
  Clock,
  User,
  Building,
  Mail,
  DollarSign,
  Calendar,
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
  phases: string | null;
  notes: string | null;
  quote: {
    id: string;
    title: string;
    clientName: string;
    clientCompany: string | null;
    total: number;
  } | null;
}

export default function ApproveSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions?status=draft,pending_approval");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching pending submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, sendToClient: boolean = false) => {
    if (!confirm(`Êtes-vous sûr de vouloir approuver cette soumission${sendToClient ? " et l'envoyer au client" : ""} ?`)) {
      return;
    }

    setApproving(id);
    try {
      const res = await fetch(`/api/submissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendToClient }),
      });

      if (res.ok) {
        fetchPendingSubmissions();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'approbation");
      }
    } catch (error) {
      console.error("Error approving submission:", error);
      alert("Erreur lors de l'approbation");
    } finally {
      setApproving(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non spécifiée";
    return new Date(dateString).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Approbation des Soumissions</h1>
          <p className="text-gray-400">
            Soumissions en attente d'approbation ({submissions.length})
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Aucune soumission en attente d'approbation</p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => {
              const clientName = submission.clientName || submission.quote?.clientName || "Non spécifié";
              const clientCompany = submission.clientCompany || submission.quote?.clientCompany;
              const clientEmail = submission.clientEmail;

              return (
                <div
                  key={submission.id}
                  className="p-6 bg-[#0f0f15] border border-gray-700 rounded-lg hover:border-violet-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-2xl font-bold">{submission.title}</h3>
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          En attente d'approbation
                        </span>
                        {submission.version > 1 && (
                          <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                            Version {submission.version}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-400">
                            <User className="w-4 h-4" />
                            <span className="text-sm">Client:</span>
                            <span className="text-white">{clientName}</span>
                          </div>
                          {clientCompany && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Building className="w-4 h-4" />
                              <span className="text-sm">Entreprise:</span>
                              <span className="text-white">{clientCompany}</span>
                            </div>
                          )}
                          {clientEmail && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm">Email:</span>
                              <span className="text-white">{clientEmail}</span>
                            </div>
                          )}
                          {submission.validUntil && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">Valide jusqu'au:</span>
                              <span className="text-white">{formatDate(submission.validUntil)}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-400">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">Sous-total:</span>
                            <span className="text-white">{formatCurrency(submission.subtotal)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <span className="text-sm">Taxes ({submission.taxRate * 100}%):</span>
                            <span className="text-white">{formatCurrency(submission.taxAmount)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-lg font-bold text-violet-400">
                            <span>Total:</span>
                            <span>{formatCurrency(submission.total)}</span>
                          </div>
                        </div>
                      </div>

                      {submission.description && (
                        <div className="mb-4 p-3 bg-gray-800/50 rounded border border-gray-700">
                          <p className="text-sm text-gray-300">{submission.description}</p>
                        </div>
                      )}

                      {submission.notes && (
                        <div className="mb-4 p-3 bg-blue-900/20 rounded border border-blue-700/50">
                          <p className="text-sm text-blue-300">
                            <strong>Notes:</strong> {submission.notes}
                          </p>
                        </div>
                      )}

                      {submission.quote && (
                        <div className="text-sm text-gray-400">
                          <p>
                            <strong>Devis associé:</strong> {submission.quote.title}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleApprove(submission.id, false)}
                      disabled={approving === submission.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {approving === submission.id ? "Approbation..." : "Approuver"}
                    </button>
                    <button
                      onClick={() => handleApprove(submission.id, true)}
                      disabled={approving === submission.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {approving === submission.id ? "Envoi..." : "Approuver et Envoyer au Client"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Rejeter cette soumission ?")) {
                          fetch(`/api/submissions/${submission.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "rejected" }),
                          }).then(() => fetchPendingSubmissions());
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors ml-auto"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

