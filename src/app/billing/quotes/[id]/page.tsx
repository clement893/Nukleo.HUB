"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Download,
  Printer,
  Mail,
  Edit,
  FileText,
  Calendar,
  Building2,
  User,
  DollarSign,
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
  updatedAt: string;
}

interface Phase {
  name: string;
  description?: string;
  estimatedHours: number;
  hourlyRate: number;
  selected: boolean;
}

export default function QuoteViewPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchQuote(params.id as string);
    }
  }, [params.id]);

  const fetchQuote = async (id: string) => {
    try {
      const res = await fetch(`/api/quotes?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data);
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implémenter la génération PDF
    alert("Génération PDF à venir");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-white">
        <Sidebar />
        <div className="flex-1 p-8 ml-64">Chargement...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-white">
        <Sidebar />
        <div className="flex-1 p-8 ml-64">
          <p className="text-red-400">Devis non trouvé</p>
        </div>
      </div>
    );
  }

  const phases: Phase[] = quote.phases ? JSON.parse(quote.phases) : [];

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />
      <div className="flex-1 p-8 ml-64 overflow-x-auto">
        {/* Header avec actions */}
        <div className="mb-6 flex justify-between items-center print:hidden">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded text-sm"
            >
              <Download className="w-4 h-4" />
              Télécharger PDF
            </button>
            <button
              onClick={() => router.push(`/billing/quotes?edit=${quote.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
          </div>
        </div>

        {/* Document du devis */}
        <div className="max-w-4xl mx-auto bg-white text-gray-900 shadow-2xl print:shadow-none">
          {/* En-tête */}
          <div className="p-8 border-b-2 border-gray-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">NUKLEO</h1>
                <p className="text-gray-600">Agence de transformation numérique</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">DEVIS</h2>
                <p className="text-sm text-gray-600">
                  Date: {formatDate(quote.createdAt) || "N/A"}
                </p>
                {quote.validUntil && (
                  <p className="text-sm text-gray-600">
                    Valide jusqu'au: {formatDate(quote.validUntil)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Facturé à:</h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <p className="font-medium">{quote.clientName}</p>
              </div>
              {quote.clientCompany && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <p>{quote.clientCompany}</p>
                </div>
              )}
              {quote.clientEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <p>{quote.clientEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description du projet */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{quote.title}</h3>
            {quote.description && (
              <p className="text-gray-700 whitespace-pre-wrap">{quote.description}</p>
            )}
          </div>

          {/* Phases et détails */}
          {phases.length > 0 && (
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails des services</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Heures</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Taux horaire</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {phases
                    .filter((p) => p.selected)
                    .map((phase, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">
                          <div>
                            <p className="font-medium">{phase.name}</p>
                            {phase.description && (
                              <p className="text-sm text-gray-500 mt-1">{phase.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          {phase.estimatedHours}h
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          {formatCurrency(phase.hourlyRate)}/h
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {formatCurrency(phase.estimatedHours * phase.hourlyRate)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totaux */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Sous-total:</span>
                  <span>{formatCurrency(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Taxes ({quote.taxRate * 100}%):</span>
                  <span>{formatCurrency(quote.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-300">
                  <span>Total:</span>
                  <span>{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Conditions */}
          {quote.terms && (
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Conditions générales</h3>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{quote.terms}</p>
            </div>
          )}

          {/* Pied de page */}
          <div className="p-8 border-t-2 border-gray-200 bg-gray-50 print:bg-white">
            <div className="text-center text-sm text-gray-600">
              <p className="font-semibold mb-1">NUKLEO</p>
              <p>Merci de votre confiance!</p>
            </div>
          </div>
        </div>

        {/* Styles pour l'impression */}
        <style jsx global>{`
          @media print {
            body {
              background: white;
            }
            .print\\:hidden {
              display: none;
            }
            .print\\:bg-white {
              background: white;
            }
            .print\\:shadow-none {
              box-shadow: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

