"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Bell,
  Search,
  Filter,
  Send,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  ClipboardList,
  MessageSquare,
  Users,
  Clock,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

interface Notification {
  id: string;
  employeeId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  } | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  department: string | null;
}

interface Stats {
  type: string;
  _count: number;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);

  // Filtres
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");

  // Modal d'envoi
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState("general");
  const [sending, setSending] = useState(false);

  // Modal de suppression en masse
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOlderThan, setDeleteOlderThan] = useState(30);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [typeFilter, readFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (readFilter !== "all") params.append("isRead", readFilter === "read" ? "true" : "false");

      const [notifRes, empRes] = await Promise.all([
        fetch(`/api/admin/notifications?${params.toString()}`),
        fetch("/api/employees"),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications || []);
        setStats(data.stats || []);
        setUnreadCount(data.unreadCount || 0);
        setTotal(data.total || 0);
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!newTitle || !newMessage || selectedEmployees.length === 0) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: selectedEmployees,
          type: newType,
          title: newTitle,
          message: newMessage,
        }),
      });

      if (res.ok) {
        setShowSendModal(false);
        setNewTitle("");
        setNewMessage("");
        setSelectedEmployees([]);
        fetchData();
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm("Supprimer cette notification ?")) return;

    try {
      await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const deleteOldNotifications = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/notifications?olderThan=${deleteOlderThan}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        alert(`${data.count} notification(s) supprimée(s)`);
        setShowDeleteModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting old notifications:", error);
    } finally {
      setDeleting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "timesheet_approved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "timesheet_rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "task_assigned":
      case "task_updated":
        return <ClipboardList className="w-4 h-4 text-violet-500" />;
      case "request_approved":
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case "request_rejected":
        return <XCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "timesheet_approved": return "Feuille approuvée";
      case "timesheet_rejected": return "Feuille rejetée";
      case "task_assigned": return "Tâche assignée";
      case "task_updated": return "Tâche mise à jour";
      case "request_approved": return "Demande approuvée";
      case "request_rejected": return "Demande rejetée";
      case "general": return "Annonce générale";
      default: return "Notification";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-CA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(searchLower) ||
      n.message.toLowerCase().includes(searchLower) ||
      n.employee?.firstName.toLowerCase().includes(searchLower) ||
      n.employee?.lastName.toLowerCase().includes(searchLower)
    );
  });

  const notificationTypes = [
    { value: "all", label: "Tous les types" },
    { value: "timesheet_approved", label: "Feuille approuvée" },
    { value: "timesheet_rejected", label: "Feuille rejetée" },
    { value: "task_assigned", label: "Tâche assignée" },
    { value: "task_updated", label: "Tâche mise à jour" },
    { value: "request_approved", label: "Demande approuvée" },
    { value: "request_rejected", label: "Demande rejetée" },
    { value: "general", label: "Annonce générale" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Bell className="w-7 h-7 text-primary" />
                Gestion des Notifications
              </h1>
              <p className="text-muted-foreground mt-1">
                Envoyez et gérez les notifications des employés
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Nettoyer
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                Envoyer une notification
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{unreadCount}</div>
                  <div className="text-sm text-muted-foreground">Non lues</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{total - unreadCount}</div>
                  <div className="text-sm text-muted-foreground">Lues</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{employees.length}</div>
                  <div className="text-sm text-muted-foreground">Employés</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-foreground"
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={readFilter}
              onChange={e => setReadFilter(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-foreground"
            >
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
            <button
              onClick={fetchData}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Liste des notifications */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Employé</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Titre</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Aucune notification trouvée
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map(notification => (
                    <tr key={notification.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {notification.employee?.photoUrl ? (
                            <img
                              src={notification.employee.photoUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {notification.employee?.firstName?.[0]}
                                {notification.employee?.lastName?.[0]}
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-foreground">
                            {notification.employee?.firstName} {notification.employee?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(notification.type)}
                          <span className="text-sm text-muted-foreground">
                            {getTypeLabel(notification.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate text-sm text-foreground">
                          {notification.title}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            notification.isRead
                              ? "bg-green-500/10 text-green-500"
                              : "bg-violet-500/10 text-violet-500"
                          }`}
                        >
                          {notification.isRead ? "Lue" : "Non lue"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal d'envoi */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Envoyer une notification
                </h2>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Destinataires *
                  </label>
                  <div className="border border-border rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        onClick={() =>
                          setSelectedEmployees(
                            selectedEmployees.length === employees.length
                              ? []
                              : employees.map(e => e.id)
                          )
                        }
                        className="text-xs text-primary hover:underline"
                      >
                        {selectedEmployees.length === employees.length
                          ? "Désélectionner tout"
                          : "Sélectionner tout"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {employees.map(emp => (
                        <label
                          key={emp.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedEmployees.includes(emp.id)
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(emp.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedEmployees([...selectedEmployees, emp.id]);
                              } else {
                                setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                              }
                            }}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              selectedEmployees.includes(emp.id)
                                ? "bg-primary border-primary"
                                : "border-border"
                            }`}
                          >
                            {selectedEmployees.includes(emp.id) && (
                              <Check className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <span className="text-sm text-foreground">
                            {emp.firstName} {emp.lastName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedEmployees.length} employé(s) sélectionné(s)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option value="general">Annonce générale</option>
                    <option value="task_assigned">Tâche assignée</option>
                    <option value="task_updated">Tâche mise à jour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Titre *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Titre de la notification"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Message *</label>
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Contenu de la notification..."
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={sendNotification}
                  disabled={sending || !newTitle || !newMessage || selectedEmployees.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de suppression en masse */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Nettoyer les notifications
                </h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-muted-foreground">
                  Supprimer les notifications plus anciennes que :
                </p>
                <select
                  value={deleteOlderThan}
                  onChange={e => setDeleteOlderThan(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                </select>
                <p className="text-sm text-orange-500">
                  Cette action est irréversible.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={deleteOldNotifications}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
