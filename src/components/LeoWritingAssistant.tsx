"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2, Copy, AlertCircle, X } from "lucide-react";

interface LeoWritingAssistantProps {
  clientId: string;
  contentType?: "email" | "social_media" | "blog" | "newsletter" | "brief";
  onInsert?: (content: string) => void;
}

const CONTENT_TYPES = [
  { value: "email", label: "Email" },
  { value: "social_media", label: "Contenu réseaux sociaux" },
  { value: "blog", label: "Article de blog" },
  { value: "newsletter", label: "Newsletter" },
  { value: "brief", label: "Brief de communication" },
];

const TONES = [
  { value: "professional", label: "Professionnel" },
  { value: "casual", label: "Décontracté" },
  { value: "friendly", label: "Amical" },
  { value: "formal", label: "Formel" },
];

const LENGTHS = [
  { value: "short", label: "Court" },
  { value: "medium", label: "Moyen" },
  { value: "long", label: "Long" },
];

export default function LeoWritingAssistant({
  clientId,
  contentType: initialContentType = "email",
  onInsert,
}: LeoWritingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contentType, setContentType] = useState(initialContentType);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Veuillez entrer un sujet");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedContent("");

    try {
      const response = await fetch("/api/communication/leo/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          contentType,
          topic,
          tone,
          length,
          additionalContext: additionalContext || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération");
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      setError("Erreur lors de la génération du contenu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  const handleInsert = () => {
    if (onInsert) {
      onInsert(generatedContent);
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition"
        title="Assistance de rédaction avec Leo"
      >
        <Sparkles className="w-4 h-4" />
        Leo - Assistance rédaction
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0a0a0f] border border-border rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0f] border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-foreground">Leo - Assistance à la rédaction</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded-lg transition"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 text-red-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {!generatedContent ? (
            // Form
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Type de contenu
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                >
                  {CONTENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Sujet / Titre *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Promotion de notre nouveau produit"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Ton
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                  >
                    {TONES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Longueur
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                  >
                    {LENGTHS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Contexte supplémentaire (optionnel)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Ajoutez des détails supplémentaires pour affiner le contenu généré..."
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !topic.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer avec Leo
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            // Generated Content
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Contenu généré
                </label>
                <div className="p-4 bg-muted border border-border rounded-lg text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {generatedContent}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                >
                  <Copy className="w-4 h-4" />
                  Copier
                </button>
                {onInsert && (
                  <button
                    onClick={handleInsert}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" />
                    Insérer
                  </button>
                )}
                <button
                  onClick={() => setGeneratedContent("")}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium"
                >
                  Nouveau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
