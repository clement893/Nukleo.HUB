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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "bg-gray-500/10 text-gray-500", icon: <Edit className="w-4 h-4" /> },
  sent: { label: "Envoyée", color: "bg-blue-500/10 text-blue-500", icon: <Send className="w-4 h-4" /> },
  accepted: { label: "Acceptée", color: "bg-green-500/10 text-green-500", icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: "Rejetée", color: "bg-red-500/10 text-red-500", icon: <XCircle className="w-4 h-4" /> },
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

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
          <h1 className="text-3xl font-bold mb-2">Soumissions</h1>
          <p className="text-gray-400">Gérez toutes les soumissions (variantes de devis)</p>
        </div>

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

