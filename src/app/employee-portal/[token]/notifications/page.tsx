"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  ClipboardList,
  MessageSquare,
  Loader2,
  Settings,
  RefreshCw,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/employee-portal/${token}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/employee-portal/${token}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/employee-portal/${token}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/employee-portal/${token}/notifications?id=${id}`, {
        method: "DELETE",
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "timesheet_approved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "timesheet_rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "task_assigned":
      case "task_updated":
        return <ClipboardList className="w-5 h-5 text-violet-500" />;
      case "request_approved":
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      case "request_rejected":
        return <XCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "timesheet_approved":
        return "Feuille de temps approuvée";
      case "timesheet_rejected":
        return "Feuille de temps rejetée";
      case "task_assigned":
        return "Tâche assignée";
      case "task_updated":
        return "Tâche mise à jour";
      case "request_approved":
        return "Demande approuvée";
      case "request_rejected":
        return "Demande rejetée";
      case "general":
        return "Annonce générale";
      default:
        return "Notification";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
    return date.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread" && n.isRead) return false;
    if (filter === "read" && !n.isRead) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const notificationTypes = [...new Set(notifications.map(n => n.type))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/employee-portal/${token}`)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-6 h-6 text-violet-400" />
                  Centre de notifications
                </h1>
                <p className="text-sm text-white/60">
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Toutes lues"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/employee-portal/${token}/notifications/settings`)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Paramètres"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={fetchNotifications}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filtres et actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 rounded-lg p-1">
              {(["all", "unread", "read"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filter === f
                      ? "bg-violet-500 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {f === "all" ? "Toutes" : f === "unread" ? "Non lues" : "Lues"}
                </button>
              ))}
            </div>

            {notificationTypes.length > 1 && (
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="all">Tous les types</option>
                {notificationTypes.map(type => (
                  <option key={type} value={type}>
                    {getTypeLabel(type)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Liste des notifications */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/60">Aucune notification</h3>
            <p className="text-sm text-white/40 mt-1">
              {filter === "unread"
                ? "Vous avez lu toutes vos notifications"
                : "Vous n'avez pas encore de notifications"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`bg-white/5 border rounded-xl p-4 transition-all hover:bg-white/10 ${
                  notification.isRead ? "border-white/5" : "border-violet-500/30 bg-violet-500/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">{getTypeIcon(notification.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-medium ${notification.isRead ? "text-white/80" : "text-white"}`}>
                          {notification.title}
                        </h3>
                        <p className="text-xs text-white/40 mt-0.5">{getTypeLabel(notification.type)}</p>
                      </div>
                      <span className="text-xs text-white/40 flex-shrink-0">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-white/60 mt-2">{notification.message}</p>

                    <div className="flex items-center gap-2 mt-3">
                      {notification.link && (
                        <button
                          onClick={() => router.push(notification.link!)}
                          className="text-xs text-violet-400 hover:text-violet-300 hover:underline"
                        >
                          Voir les détails →
                        </button>
                      )}

                      <div className="flex-1" />

                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 text-white/40 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Marquer comme lu"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistiques */}
        {notifications.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{notifications.length}</div>
                <div className="text-xs text-white/40">Total</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-violet-400">{unreadCount}</div>
                <div className="text-xs text-white/40">Non lues</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {notifications.filter(n => n.isRead).length}
                </div>
                <div className="text-xs text-white/40">Lues</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{notificationTypes.length}</div>
                <div className="text-xs text-white/40">Types</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
