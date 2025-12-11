"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  User,
  MoreVertical,
  Check,
  X,
  Loader2,
  Crown,
  UserCog,
  UserX,
  Trash2,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "Utilisateur",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  admin: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  user: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Crown className="w-3 h-3" />,
  admin: <ShieldCheck className="w-3 h-3" />,
  user: <User className="w-3 h-3" />,
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setCurrentUserRole(data.currentUserRole || "");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setUpdating(null);
      setActionMenuOpen(null);
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setUpdating(null);
      setActionMenuOpen(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.name && user.name.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Jamais";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" />
              Gestion des Utilisateurs
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez les accès et les permissions des utilisateurs
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {users.length} utilisateur{users.length > 1 ? "s" : ""}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Utilisateur
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Rôle
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Statut
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Dernière connexion
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.photoUrl ? (
                        <img
                          src={user.photoUrl}
                          alt={user.name || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {user.name || "Sans nom"}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                      {roleIcons[user.role]}
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleUserActive(user.id, !user.isActive)}
                      disabled={updating === user.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      {updating === user.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : user.isActive ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      {user.isActive ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {actionMenuOpen === user.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg z-10 py-1">
                          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                            Changer le rôle
                          </div>
                          
                          {currentUserRole === "super_admin" && (
                            <button
                              onClick={() => updateUserRole(user.id, "super_admin")}
                              disabled={user.role === "super_admin"}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors disabled:opacity-50"
                            >
                              <Crown className="w-4 h-4 text-purple-400" />
                              Super Admin
                            </button>
                          )}
                          
                          <button
                            onClick={() => updateUserRole(user.id, "admin")}
                            disabled={user.role === "admin"}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                            Admin
                          </button>
                          
                          <button
                            onClick={() => updateUserRole(user.id, "user")}
                            disabled={user.role === "user"}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            Utilisateur
                          </button>

                          <div className="border-t border-border mt-1 pt-1">
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <span>Super Admin : Accès total, peut gérer tous les utilisateurs</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Admin : Peut gérer les utilisateurs standards</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span>Utilisateur : Accès en lecture seule</span>
          </div>
        </div>
      </div>
    </div>
  );
}
