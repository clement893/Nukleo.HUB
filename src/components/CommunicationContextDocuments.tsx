"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2, FileText, Loader2, AlertCircle } from "lucide-react";

interface ContextDocument {
  id: string;
  title: string;
  description: string | null;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface CommunicationContextDocumentsProps {
  clientId: string;
}

const DOCUMENT_TYPES = [
  { value: "brand_guide", label: "Guide de marque" },
  { value: "company_profile", label: "Profil de l'entreprise" },
  { value: "product_info", label: "Informations produit" },
  { value: "audience_data", label: "Données audience" },
  { value: "campaign_brief", label: "Brief campagne" },
  { value: "style_guide", label: "Guide de style" },
  { value: "other", label: "Autre" },
];

export default function CommunicationContextDocuments({
  clientId,
}: CommunicationContextDocumentsProps) {
  const [documents, setDocuments] = useState<ContextDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/communication/${clientId}/context-documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setMessage({ type: "error", text: "Erreur lors du chargement des documents" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch(`/api/communication/${clientId}/context-documents`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newDoc = await response.json();
        setDocuments([newDoc, ...documents]);
        setMessage({ type: "success", text: "Document uploadé avec succès" });
        setShowUploadModal(false);
        e.currentTarget.reset();
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de l'upload" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    try {
      const response = await fetch(
        `/api/communication/${clientId}/context-documents?documentId=${documentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setDocuments(documents.filter((d) => d.id !== documentId));
        setMessage({ type: "success", text: "Document supprimé" });
      } else {
        setMessage({ type: "error", text: "Erreur lors de la suppression" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de la suppression" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{message.text}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Documents de contexte</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Upload className="w-4 h-4" />
          Uploader un document
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0a0a0f] border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Uploader un document
            </h4>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Guide de marque 2024"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Type de document
                </label>
                <select
                  name="documentType"
                  required
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                >
                  <option value="">Sélectionner un type</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  name="description"
                  placeholder="Décrivez le contenu du document..."
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Fichier
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  accept=".pdf,.txt,.doc,.docx"
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    "Uploader"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Aucun document uploadé</p>
          <p className="text-sm text-muted-foreground mt-2">
            Uploadez des documents pour fournir du contexte à Leo
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-muted/30 transition flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{doc.title}</h4>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-1 rounded">
                      {DOCUMENT_TYPES.find((t) => t.value === doc.documentType)?.label ||
                        doc.documentType}
                    </span>
                    <span>{doc.fileName}</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>
                      Uploadé par {doc.uploadedBy} le{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition ml-4"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
