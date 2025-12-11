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
  Trash2,
  Mail,
  Plus,
  Copy,
  Clock,
  Settings2,
  Building2,
  FolderKanban,
  LayoutGrid,
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

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  inviter: { name: string | null; email: string };
}

interface UserAccess {
  clientsAccess: string;
  projectsAccess: string;
  spacesAccess: string;
  allowedClients: string[];
  allowedProjects: string[];
  allowedSpaces: string[];
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

const spaceOptions = [
  { id: "commercial", name: "Commercial", icon: Building2 },
  { id: "reseau", name: "Réseau", icon: Users },
  { id: "projects", name: "Projets", icon: FolderKanban },
  { id: "teams", name: "Équipes", icon: Users },
  { id: "billing", name: "Facturation", icon: LayoutGrid },
  { id: "admin", name: "Administration", icon: Shield },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "invitations">("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Modal d'invitation
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  
  // Modal d'accès
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
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

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/admin/invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
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

  const sendInvitation = async () => {
    if (!inviteEmail) return;
    
    setInviting(true);
    setInviteLink("");
    
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setInviteLink(data.invitationLink);
        fetchInvitations();
      } else {
        alert(data.error || "Erreur lors de l'envoi de l'invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
    } finally {
      setInviting(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/admin/invitations?id=${invitationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setInvitations(invitations.filter(i => i.id !== invitationId));
      }
    } catch (error) {
      console.error("Error deleting invitation:", error);
    }
  };

  const openAccessModal = async (user: UserData) => {
    setSelectedUser(user);
    setShowAccessModal(true);
    setLoadingAccess(true);
    
    try {
      const res = await fetch(`/api/admin/users/access?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserAccess(data.access);
      }
    } catch (error) {
      console.error("Error fetching user access:", error);
    } finally {
      setLoadingAccess(false);
    }
  };

  const saveAccess = async () => {
    if (!selectedUser || !userAccess) return;
    
    setSavingAccess(true);
    try {
      const res = await fetch("/api/admin/users/access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...userAccess,
        }),
      });

      if (res.ok) {
        setShowAccessModal(false);
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Error saving access:", error);
    } finally {
      setSavingAccess(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Lien copié !");
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

  const pendingInvitations = invitations.filter(i => !i.acceptedAt && new Date(i.expiresAt) > new Date());

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
          <button
            onClick={() => {
              setShowInviteModal(true);
              setInviteEmail("");
              setInviteRole("user");
              setInviteLink("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Inviter un utilisateur
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs ({users.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "invitations"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invitations en attente ({pendingInvitations.length})
            </div>
          </button>
        </div>

        {activeTab === "users" && (
          <>
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
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Utilisateur</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Rôle</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Statut</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Dernière connexion</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt={user.name || "User"} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{user.name || "Sans nom"}</p>
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
                          {updating === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : user.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {user.isActive ? "Actif" : "Inactif"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAccessModal(user)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Gérer les accès"
                          >
                            <Settings2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>

                            {actionMenuOpen === user.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg z-10 py-1">
                                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">Changer le rôle</div>
                                
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun utilisateur trouvé</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "invitations" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Rôle</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Invité par</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Expire le</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{invitation.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[invitation.role]}`}>
                        {roleIcons[invitation.role]}
                        {roleLabels[invitation.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {invitation.inviter.name || invitation.inviter.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {formatDate(invitation.expiresAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteInvitation(invitation.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Annuler l'invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pendingInvitations.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune invitation en attente</p>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <span>Super Admin : Accès total</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Admin : Gestion des utilisateurs</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span>Utilisateur : Accès standard</span>
          </div>
        </div>
      </div>

      {/* Modal d'invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Inviter un utilisateur
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="nom@nukleo.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Rôle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Admin</option>
                  {currentUserRole === "super_admin" && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>

              {inviteLink && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-sm text-green-400 mb-2">Invitation créée ! Partagez ce lien :</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    />
                    <button
                      onClick={() => copyToClipboard(inviteLink)}
                      className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Fermer
              </button>
              {!inviteLink && (
                <button
                  onClick={sendInvitation}
                  disabled={inviting || !inviteEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Envoyer l'invitation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des accès */}
      {showAccessModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              Gérer les accès
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedUser.name || selectedUser.email}
            </p>

            {loadingAccess ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : userAccess ? (
              <div className="space-y-6">
                {/* Accès aux clients */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                    <Building2 className="w-4 h-4" />
                    Accès aux clients
                  </label>
                  <div className="flex gap-2">
                    {["all", "specific", "none"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setUserAccess({ ...userAccess, clientsAccess: option })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          userAccess.clientsAccess === option
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option === "all" ? "Tous" : option === "specific" ? "Spécifiques" : "Aucun"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accès aux projets */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                    <FolderKanban className="w-4 h-4" />
                    Accès aux projets
                  </label>
                  <div className="flex gap-2">
                    {["all", "specific", "none"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setUserAccess({ ...userAccess, projectsAccess: option })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          userAccess.projectsAccess === option
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option === "all" ? "Tous" : option === "specific" ? "Spécifiques" : "Aucun"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accès aux espaces */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                    <LayoutGrid className="w-4 h-4" />
                    Accès aux espaces
                  </label>
                  <div className="flex gap-2 mb-3">
                    {["all", "specific", "none"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setUserAccess({ ...userAccess, spacesAccess: option })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          userAccess.spacesAccess === option
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option === "all" ? "Tous" : option === "specific" ? "Spécifiques" : "Aucun"}
                      </button>
                    ))}
                  </div>
                  
                  {userAccess.spacesAccess === "specific" && (
                    <div className="grid grid-cols-2 gap-2">
                      {spaceOptions.map((space) => (
                        <button
                          key={space.id}
                          onClick={() => {
                            const current = userAccess.allowedSpaces || [];
                            const updated = current.includes(space.id)
                              ? current.filter(s => s !== space.id)
                              : [...current, space.id];
                            setUserAccess({ ...userAccess, allowedSpaces: updated });
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            userAccess.allowedSpaces?.includes(space.id)
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
                          }`}
                        >
                          <space.icon className="w-4 h-4" />
                          {space.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAccessModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveAccess}
                disabled={savingAccess}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
