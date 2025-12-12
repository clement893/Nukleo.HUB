"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Settings2, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface MenuItem {
  id: string;
  key: string;
  label: string;
  category?: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Permission {
  [menuItemId: string]: boolean;
}

export default function MenuPermissionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [permissions, setPermissions] = useState<Permission>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Récupérer les utilisateurs et éléments du menu
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les utilisateurs
        const usersResponse = await fetch("/api/admin/users");
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users || []);
        }

        // Récupérer les éléments du menu
        const menuResponse = await fetch("/api/menu-permissions");
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenuItems(menuData.allItems || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({ type: "error", text: "Erreur lors du chargement des données" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Charger les permissions de l'utilisateur sélectionné
  useEffect(() => {
    if (!selectedUser) return;

    const fetchPermissions = async () => {
      try {
        const response = await fetch(`/api/admin/users/${selectedUser}/menu-permissions`);
        if (response.ok) {
          const data = await response.json();
          setPermissions(data.permissions || {});
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, [selectedUser]);

  // Basculer une permission
  const togglePermission = (menuItemId: string) => {
    setPermissions((prev) => ({
      ...prev,
      [menuItemId]: !prev[menuItemId],
    }));
  };

  // Sauvegarder les permissions
  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      
      // Envoyer les permissions mises à jour
      const response = await fetch("/api/admin/users/menu-permissions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          permissions,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Permissions mises à jour avec succès" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Erreur lors de la mise à jour des permissions" });
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } finally {
      setSaving(false);
    }
  };

  // Grouper les éléments par catégorie
  const groupedItems = menuItems.reduce(
    (acc, item) => {
      const category = item.category || "Autre";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Permissions du menu</h1>
              <p className="text-sm text-muted-foreground">
                Gérez l'accès aux éléments du menu pour chaque utilisateur
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Message */}
          {message && (
            <div className={`mb-6 flex items-center gap-3 rounded-lg p-4 ${
              message.type === "success"
                ? "bg-green-500/10 text-green-700"
                : "bg-red-500/10 text-red-700"
            }`}>
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-4 gap-8">
            {/* Sélection utilisateur */}
            <div className="col-span-1">
              <div className="bg-[#12121a] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Utilisateurs</h2>
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-gray-400 text-sm">Chargement...</div>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          selectedUser === user.id
                            ? "bg-purple-600 text-white"
                            : "bg-[#1a1a24] text-gray-300 hover:bg-[#22222e]"
                        }`}
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs opacity-75">{user.email}</div>
                      </button>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm">Aucun utilisateur</div>
                  )}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="col-span-3">
              {selectedUser ? (
                <div className="bg-[#12121a] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    Éléments du menu
                  </h2>

                  <div className="space-y-6">
                    {Object.entries(groupedItems).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wider">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a24] cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={permissions[item.id] !== false}
                                onChange={() => togglePermission(item.id)}
                                className="w-4 h-4 rounded border-gray-600 text-purple-600 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-white">
                                  {item.label}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-gray-400">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bouton Sauvegarder */}
                  <button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="mt-8 flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Sauvegarder les permissions
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-[#12121a] rounded-xl p-12 text-center">
                  <Settings2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Sélectionnez un utilisateur
                  </h3>
                  <p className="text-gray-400">
                    Choisissez un utilisateur dans la liste de gauche pour gérer ses permissions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
