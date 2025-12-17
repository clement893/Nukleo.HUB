"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Copy, Trash2, Power, PowerOff, AlertCircle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  rateLimit: number;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKey, setNewKey] = useState<{
    name: string;
    expiresInDays: string;
    rateLimit: string;
    allowedIps: string;
    allowedEndpoints: string;
  }>({
    name: "",
    expiresInDays: "",
    rateLimit: "1000",
    allowedIps: "",
    allowedEndpoints: "",
  });
  const [createdKey, setCreatedKey] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/admin/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (err) {
      console.error("Error fetching API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const body: Record<string, unknown> = {
        name: newKey.name,
        rateLimit: parseInt(newKey.rateLimit, 10) || 1000,
      };

      if (newKey.expiresInDays) {
        body.expiresInDays = parseInt(newKey.expiresInDays, 10);
      }

      if (newKey.allowedIps) {
        body.allowedIps = newKey.allowedIps.split(",").map((ip) => ip.trim()).filter(Boolean);
      }

      if (newKey.allowedEndpoints) {
        body.allowedEndpoints = newKey.allowedEndpoints.split(",").map((endpoint) => endpoint.trim()).filter(Boolean);
      }

      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedKey({ key: data.key, name: data.name });
        setShowCreateForm(false);
        setNewKey({ name: "", expiresInDays: "", rateLimit: "1000", allowedIps: "", allowedEndpoints: "" });
        fetchApiKeys();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur lors de la création de la clé");
      }
    } catch (err) {
      setError("Erreur lors de la création de la clé API");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchApiKeys();
      }
    } catch (err) {
      console.error("Error toggling API key:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir désactiver cette clé API ?")) return;

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchApiKeys();
      }
    } catch (err) {
      console.error("Error deleting API key:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Clé copiée dans le presse-papiers !");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Jamais";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="w-8 h-8" />
          Gestion des clés API
        </h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Créer une clé API
        </button>
      </div>

      {createdKey && (
        <div className="mb-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-yellow-900 dark:text-yellow-100">
                ⚠️ Clé API créée avec succès !
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                <strong>Nom :</strong> {createdKey.name}
              </p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded border-2 border-yellow-400 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Clé API :</p>
                <code className="text-lg font-mono break-all block mb-3">{createdKey.key}</code>
                <button
                  onClick={() => copyToClipboard(createdKey.key)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  <Copy className="w-4 h-4" />
                  Copier la clé
                </button>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ IMPORTANT : Copiez cette clé maintenant, elle ne sera plus affichée après avoir fermé cette alerte !
              </p>
              <button
                onClick={() => setCreatedKey(null)}
                className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 p-6 bg-card border rounded-lg">
          <h2 className="text-xl font-bold mb-4">Créer une nouvelle clé API</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom de la clé *</label>
              <input
                type="text"
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                placeholder="Ex: Site web nukleo.digital"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Limite de requêtes/heure
                </label>
                <input
                  type="number"
                  value={newKey.rateLimit}
                  onChange={(e) => setNewKey({ ...newKey, rateLimit: e.target.value })}
                  min="1"
                  max="100000"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Expire dans (jours) - optionnel
                </label>
                <input
                  type="number"
                  value={newKey.expiresInDays}
                  onChange={(e) => setNewKey({ ...newKey, expiresInDays: e.target.value })}
                  min="1"
                  placeholder="Laissez vide pour jamais"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                IPs autorisées (optionnel, séparées par virgule)
              </label>
              <input
                type="text"
                value={newKey.allowedIps}
                onChange={(e) => setNewKey({ ...newKey, allowedIps: e.target.value })}
                placeholder="192.168.1.1, 10.0.0.1"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Endpoints autorisés (optionnel, séparés par virgule)
              </label>
              <input
                type="text"
                value={newKey.allowedEndpoints}
                onChange={(e) => setNewKey({ ...newKey, allowedEndpoints: e.target.value })}
                placeholder="/api/testimonials, /api/public/testimonials"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Laissez vide pour autoriser tous les endpoints. Exemples: /api/testimonials, /api/public/*
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Créer la clé API
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune clé API créée pour le moment.
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="p-6 bg-card border rounded-lg flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{key.name}</h3>
                  {key.isActive ? (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 text-xs rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    <strong>Préfixe :</strong> <code>{key.keyPrefix}</code>
                  </p>
                  <p>
                    <strong>Limite :</strong> {key.rateLimit} requêtes/heure
                  </p>
                  <p>
                    <strong>Dernière utilisation :</strong> {formatDate(key.lastUsedAt)}
                  </p>
                  {key.expiresAt && (
                    <p>
                      <strong>Expire le :</strong> {formatDate(key.expiresAt)}
                    </p>
                  )}
                  <p>
                    <strong>Créée le :</strong> {formatDate(key.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(key.id, key.isActive)}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title={key.isActive ? "Désactiver" : "Activer"}
                >
                  {key.isActive ? (
                    <PowerOff className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Power className="w-5 h-5 text-green-600" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                  title="Désactiver"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

