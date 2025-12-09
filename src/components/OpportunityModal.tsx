"use client";

import { useState, useEffect } from "react";
import { Opportunity, PIPELINE_STAGES, REGIONS, SEGMENTS } from "@/types/opportunity";
import {
  X,
  Building2,
  DollarSign,
  User,
  MapPin,
  Calendar,
  FileText,
  Tag,
  Save,
  Trash2,
} from "lucide-react";

interface OpportunityModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (opportunity: Opportunity) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function OpportunityModal({
  opportunity,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: OpportunityModalProps) {
  const [formData, setFormData] = useState<Partial<Opportunity>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (opportunity) {
      setFormData({ ...opportunity });
    }
  }, [opportunity]);

  if (!isOpen || !opportunity) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : parseFloat(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData as Opportunity);
      onClose();
    } catch (error) {
      console.error("Error saving opportunity:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !opportunity.id) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette opportunité ?")) return;
    
    setDeleting(true);
    try {
      await onDelete(opportunity.id);
      onClose();
    } catch (error) {
      console.error("Error deleting opportunity:", error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDateForInput = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Modifier l&apos;opportunité
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom de l&apos;opportunité *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Valeur et Étape */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Valeur estimée
              </label>
              <input
                type="number"
                name="value"
                value={formData.value || ""}
                onChange={handleNumberChange}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Étape
              </label>
              <select
                name="stage"
                value={formData.stage || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Entreprise et Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Building2 className="inline w-4 h-4 mr-1" />
                Entreprise
              </label>
              <input
                type="text"
                name="company"
                value={formData.company || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Contact
              </label>
              <input
                type="text"
                name="contact"
                value={formData.contact || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Région et Segment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Région
              </label>
              <select
                name="region"
                value={formData.region || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Sélectionner...</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Segment
              </label>
              <select
                name="segment"
                value={formData.segment || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Sélectionner...</option>
                {SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsable et Référent */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Responsable
              </label>
              <input
                type="text"
                name="assignee"
                value={formData.assignee || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Référent
              </label>
              <input
                type="text"
                name="referredBy"
                value={formData.referredBy || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Type de projet et Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type de projet
              </label>
              <input
                type="text"
                name="projectType"
                value={formData.projectType || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Source du lead
              </label>
              <input
                type="text"
                name="leadSourceType"
                value={formData.leadSourceType || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date d&apos;ouverture
              </label>
              <input
                type="date"
                name="openDate"
                value={formatDateForInput(formData.openDate)}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Proposition envoyée
              </label>
              <input
                type="date"
                name="proposalSentDate"
                value={formatDateForInput(formData.proposalSentDate)}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date de clôture
              </label>
              <input
                type="date"
                name="closedDate"
                value={formatDateForInput(formData.closedDate)}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Proposition */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Notes / Proposition
            </label>
            <textarea
              name="proposal"
              value={formData.proposal || ""}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Détails de la proposition, notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
