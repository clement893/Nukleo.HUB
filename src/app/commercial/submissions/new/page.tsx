"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  Save,
  Send,
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
} from "lucide-react";

interface Phase {
  id: string;
  name: string;
  estimatedHours: number;
  hourlyRate: number;
  selected: boolean;
}

const DEFAULT_PHASES: Phase[] = [
  { id: "1", name: "Diagnostic", estimatedHours: 8, hourlyRate: 150, selected: false },
  { id: "2", name: "Stratégie", estimatedHours: 16, hourlyRate: 150, selected: false },
  { id: "3", name: "Design", estimatedHours: 40, hourlyRate: 150, selected: false },
  { id: "4", name: "Développement", estimatedHours: 80, hourlyRate: 150, selected: false },
  { id: "5", name: "IA & Automatisation", estimatedHours: 24, hourlyRate: 150, selected: false },
  { id: "6", name: "Formation", estimatedHours: 8, hourlyRate: 150, selected: false },
  { id: "7", name: "Déploiement", estimatedHours: 16, hourlyRate: 150, selected: false },
  { id: "8", name: "Suivi", estimatedHours: 8, hourlyRate: 150, selected: false },
];

export default function NewSubmissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    validUntil: "",
    notes: "",
    taxRate: 0.14975,
    currency: "CAD",
  });
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES);

  const calculateTotals = () => {
    const subtotal = phases
      .filter((p) => p.selected)
      .reduce((acc, p) => acc + p.estimatedHours * p.hourlyRate, 0);
    const taxAmount = subtotal * formData.taxRate;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const handlePhaseChange = (id: string, field: keyof Phase, value: unknown) => {
    setPhases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addPhase = () => {
    setPhases((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        estimatedHours: 0,
        hourlyRate: 150,
        selected: true,
      },
    ]);
  };

  const removePhase = (id: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (sendToClient: boolean = false) => {
    if (!formData.title.trim() || !formData.clientName.trim()) {
      alert("Le titre et le nom du client sont requis");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          phases: phases.map((p) => ({
            name: p.name,
            estimatedHours: p.estimatedHours,
            hourlyRate: p.hourlyRate,
            selected: p.selected,
          })),
          validUntil: formData.validUntil || null,
        }),
      });

      if (res.ok) {
        const submission = await res.json();
        if (sendToClient) {
          // Approuver et envoyer
          await fetch(`/api/submissions/${submission.id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sendToClient: true }),
          });
        }
        router.push("/commercial/submissions");
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating submission:", error);
      alert("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />
      <div className="flex-1 p-8 max-w-6xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-3xl font-bold mb-2">Créer une Nouvelle Soumission</h1>
          <p className="text-gray-400">Développez une soumission complète pour un client</p>
        </div>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="p-6 bg-[#0f0f15] border border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Informations Générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                  placeholder="Ex: Option Premium"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom du Client *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email du Client</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Entreprise</label>
                <input
                  type="text"
                  value={formData.clientCompany}
                  onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date de validité</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                placeholder="Description de la soumission..."
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">Notes internes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                placeholder="Notes internes..."
              />
            </div>
          </div>

          {/* Phases */}
          <div className="p-6 bg-[#0f0f15] border border-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Phases du Projet</h2>
              <button
                onClick={addPhase}
                className="flex items-center gap-2 px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter une phase
              </button>
            </div>
            <div className="space-y-3">
              {phases.map((phase) => (
                <div
                  key={phase.id}
                  className="p-4 bg-[#0a0a0f] border border-gray-700 rounded flex items-center gap-4"
                >
                  <input
                    type="checkbox"
                    checked={phase.selected}
                    onChange={(e) => handlePhaseChange(phase.id, "selected", e.target.checked)}
                    className="w-5 h-5"
                  />
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => handlePhaseChange(phase.id, "name", e.target.value)}
                    placeholder="Nom de la phase"
                    className="flex-1 px-3 py-2 bg-[#0f0f15] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={phase.estimatedHours}
                    onChange={(e) => handlePhaseChange(phase.id, "estimatedHours", parseFloat(e.target.value) || 0)}
                    placeholder="Heures"
                    className="w-24 px-3 py-2 bg-[#0f0f15] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                  />
                  <span className="text-gray-400">×</span>
                  <input
                    type="number"
                    value={phase.hourlyRate}
                    onChange={(e) => handlePhaseChange(phase.id, "hourlyRate", parseFloat(e.target.value) || 0)}
                    placeholder="Taux/h"
                    className="w-32 px-3 py-2 bg-[#0f0f15] border border-gray-700 rounded text-white focus:border-violet-500 focus:outline-none"
                  />
                  <span className="text-violet-400 font-semibold w-32 text-right">
                    {formatCurrency(phase.estimatedHours * phase.hourlyRate)}
                  </span>
                  <button
                    onClick={() => removePhase(phase.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé financier */}
          <div className="p-6 bg-[#0f0f15] border border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Résumé Financier</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-400">
                <span>Sous-total:</span>
                <span className="text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Taxes ({formData.taxRate * 100}%):</span>
                <span className="text-white">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-violet-400 pt-3 border-t border-gray-700">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium"
            >
              <Save className="w-4 h-4" />
              {loading ? "Enregistrement..." : "Enregistrer comme Brouillon"}
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium"
            >
              <Send className="w-4 h-4" />
              {loading ? "Envoi..." : "Créer et Envoyer au Client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

