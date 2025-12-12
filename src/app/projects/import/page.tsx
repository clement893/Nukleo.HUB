"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ProjectsImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier que c'est un fichier Excel
      if (
        !selectedFile.name.endsWith(".xlsx") &&
        !selectedFile.name.endsWith(".xls")
      ) {
        setError("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/projects/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de l'import");
      } else {
        setResult(data);
        setFile(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'import"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/projects/template");
      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du modèle");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modele_projets.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du téléchargement"
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Upload className="w-8 h-8 text-primary" />
            Importer des projets
          </h1>
          <p className="text-muted-foreground mt-1">
            Importez plusieurs projets à partir d'un fichier Excel
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl">
          {/* Template Download */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Modèle Excel
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Téléchargez le modèle Excel pour voir la structure requise
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Télécharger le modèle
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Importer des projets
            </h2>

            {/* File Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Sélectionner un fichier Excel
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    {file ? file.name : "Cliquez pour sélectionner un fichier"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ou glissez-déposez un fichier Excel
                  </span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Erreur</p>
                  <p className="text-red-400/80 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importation en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importer les projets
                </>
              )}
            </button>

            {/* Results */}
            {result && (
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">
                        Succès
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">
                      {result.success}
                    </p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">Erreurs</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">
                      {result.failed}
                    </p>
                  </div>
                </div>

                {/* Error Details */}
                {result.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 font-medium mb-3">
                      Détails des erreurs :
                    </p>
                    <ul className="space-y-2">
                      {result.errors.map((error, index) => (
                        <li
                          key={index}
                          className="text-red-400/80 text-sm flex items-start gap-2"
                        >
                          <span className="text-red-400 flex-shrink-0">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">
              Instructions
            </h3>
            <ul className="space-y-2 text-sm text-blue-400/80">
              <li>
                1. Téléchargez le modèle Excel en cliquant sur le bouton
                ci-dessus
              </li>
              <li>2. Remplissez les colonnes avec vos données de projets</li>
              <li>
                3. Le champ "name" (nom du projet) est obligatoire pour chaque
                ligne
              </li>
              <li>4. Les autres champs sont optionnels</li>
              <li>5. Sélectionnez votre fichier rempli et cliquez sur Importer</li>
              <li>
                6. Vérifiez les résultats et corrigez les erreurs si nécessaire
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
