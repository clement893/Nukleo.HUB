"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  User,
  Clock,
  Calendar,
  CalendarDays,
  FileText,
  Send,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Square,
  Plus,
  Brain,
  ChevronRight,
  ChevronLeft,
  Timer,
  Target,
  TrendingUp,
  Briefcase,
  MessageSquare,
  X,
  Download,
  Eye,
  Edit2,
  Trash2,
  Save,
  SendHorizontal,
  CheckCheck,
  XCircle,
  ClockIcon,
  Bell,
  BellRing,
  Check,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  role: string | null;
  department: string;
  capacityHoursPerWeek: number;
  currentTask: Task | null;
  onboardingCompleted: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  zone: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string; client: string | null } | null;
}

interface Project {
  id: string;
  name: string;
  client: string | null;
  status: string;
  progress: number | null;
}

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  billable: boolean;
  status: string;
  projectId?: string | null;
  taskId?: string | null;
  timesheetId?: string | null;
  notes?: string | null;
}

interface WeeklyTimesheet {
  id: string;
  employeeId: string;
  weekStartDate: string;
  weekEndDate: string;
  totalHours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt: string | null;
  approvedAt: string | null;
  approverName: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  adminNotes: string | null;
  entries: TimeEntry[];
}

interface EmployeeRequest {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface EmployeeEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  type: string;
  color: string | null;
}

interface Document {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string | null;
  category: string | null;
  createdAt: string;
}

interface Stats {
  hoursThisWeek: number;
  tasksInProgress: number;
  tasksTodo: number;
  projectsActive: number;
  pendingRequests: number;
  upcomingEvents: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

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

// Obtenir le lundi de la semaine pour une date donnée
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Obtenir le dimanche de la semaine
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Formater une date en YYYY-MM-DD
function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Formater une date en français
function formatDateFR(date: Date): string {
  return date.toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });
}

// Obtenir les jours de la semaine
function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  return days;
}

export default function EmployeePortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [events, setEvents] = useState<EmployeeEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  const [activeTab, setActiveTab] = useState<"dashboard" | "time" | "timesheets" | "calendar" | "documents" | "requests" | "notifications" | "profile" | "leo">("dashboard");

  // Timesheet state
  const [selectedWeek, setSelectedWeek] = useState<Date>(getWeekStart(new Date()));
  const [weeklyTimesheet, setWeeklyTimesheet] = useState<WeeklyTimesheet | null>(null);
  const [weekEntries, setWeekEntries] = useState<TimeEntry[]>([]);
  const [canEditTimesheet, setCanEditTimesheet] = useState(true);
  const [timesheetLoading, setTimesheetLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [timesheetNotes, setTimesheetNotes] = useState("");

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDescription, setTimerDescription] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Leo chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: "leave",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchPortalData();
  }, [token]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (token && activeTab === "timesheets") {
      fetchTimesheetData();
    }
  }, [token, selectedWeek, activeTab]);

  // Charger les notifications au démarrage et toutes les 30 secondes
  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Fermer le panneau de notifications en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch(`/api/employee-portal/${token}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  async function markNotificationAsRead(notificationId: string) {
    try {
      await fetch(`/api/employee-portal/${token}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async function markAllNotificationsAsRead() {
    try {
      await fetch(`/api/employee-portal/${token}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  async function fetchPortalData() {
    try {
      const res = await fetch(`/api/employee-portal/${token}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Portail non trouvé ou désactivé");
        } else {
          setError("Erreur lors du chargement");
        }
        return;
      }
      const data = await res.json();
      setEmployee(data.employee);
      setStats(data.stats);
      setTasks(data.tasks);
      setProjects(data.projects);
      setTimeEntries(data.timeEntries);
      setRequests(data.requests);
      setEvents(data.events);
      setDocuments(data.documents);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimesheetData() {
    setTimesheetLoading(true);
    try {
      const res = await fetch(`/api/employee-portal/${token}/timesheets?week=${formatDateISO(selectedWeek)}`);
      if (res.ok) {
        const data = await res.json();
        setWeeklyTimesheet(data.timesheet);
        setWeekEntries(data.entries || []);
        setCanEditTimesheet(data.canEdit);
        if (data.timesheet?.notes) {
          setTimesheetNotes(data.timesheet.notes);
        } else {
          setTimesheetNotes("");
        }
      }
    } catch (error) {
      console.error("Error fetching timesheet:", error);
    } finally {
      setTimesheetLoading(false);
    }
  }

  async function startTimer() {
    setTimerRunning(true);
    setTimerSeconds(0);
  }

  async function stopTimer() {
    setTimerRunning(false);
    if (timerSeconds > 0) {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timerSeconds * 1000);
      
      await fetch(`/api/employee-portal/${token}/time-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: timerDescription || "Temps de travail",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: Math.round(timerSeconds / 60),
        }),
      });
      
      setTimerSeconds(0);
      setTimerDescription("");
      fetchPortalData();
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/employee-portal/${token}/leo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: chatMessages,
        }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur s'est produite." }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function submitRequest() {
    if (!newRequest.title.trim()) return;

    await fetch(`/api/employee-portal/${token}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRequest),
    });

    setShowRequestModal(false);
    setNewRequest({ type: "leave", title: "", description: "", startDate: "", endDate: "" });
    fetchPortalData();
  }

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending": return "bg-yellow-600/20 text-yellow-300";
      case "approved": return "bg-green-600/20 text-green-300";
      case "rejected": return "bg-red-600/20 text-red-300";
      case "in_progress": return "bg-blue-600/20 text-blue-300";
      case "todo": return "bg-slate-700/50 text-white";
      case "done": return "bg-green-600/20 text-green-300";
      default: return "bg-slate-700/50 text-white";
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-slate-400";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Accès refusé</h1>
          <p className="text-slate-400">{error || "Portail non trouvé"}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: Target },
    { id: "time", label: "Temps", icon: Clock },
    { id: "timesheets", label: "Feuilles de temps", icon: CalendarDays },
    { id: "calendar", label: "Calendrier", icon: Calendar },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "requests", label: "Demandes", icon: Send },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profil", icon: User },
    { id: "leo", label: "Leo IA", icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {employee.photoUrl ? (
              <Image
                src={employee.photoUrl}
                alt={employee.name}
                width={48}
                height={48}
                className="rounded-full object-cover ring-2 ring-blue-500"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center ring-2 ring-blue-500">
                <User className="w-6 h-6 text-blue-400" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{employee.name}</h1>
              <p className="text-sm text-slate-400">{employee.role || employee.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                {unreadCount > 0 ? (
                  <BellRing className="w-5 h-5 text-blue-400 animate-pulse" />
                ) : (
                  <Bell className="w-5 h-5 text-slate-400" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Panel */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3 border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors ${
                            !notif.isRead ? "bg-blue-500/10" : ""
                          }`}
                          onClick={() => {
                            if (!notif.isRead) markNotificationAsRead(notif.id);
                            if (notif.link) {
                              // Navigate to the link if it's an internal route
                              if (notif.link.startsWith("/")) {
                                setActiveTab(notif.link.replace("/", "") as typeof activeTab);
                              }
                            }
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg ${
                              notif.type.includes("approved") ? "bg-green-500/20" :
                              notif.type.includes("rejected") ? "bg-red-500/20" :
                              notif.type.includes("task") ? "bg-purple-500/20" :
                              "bg-blue-500/20"
                            }`}>
                              {notif.type.includes("approved") ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : notif.type.includes("rejected") ? (
                                <XCircle className="w-4 h-4 text-red-400" />
                              ) : notif.type.includes("task") ? (
                                <FolderKanban className="w-4 h-4 text-purple-400" />
                              ) : (
                                <Bell className="w-4 h-4 text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!notif.isRead ? "text-white" : "text-slate-300"}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-400 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString("fr-CA", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-400">Département</p>
              <p className="font-medium text-white">{employee.department}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400 bg-blue-500/10"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.hoursThisWeek}h</p>
                    <p className="text-xs text-slate-400">Cette semaine</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-600/20 rounded-lg">
                    <Play className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.tasksInProgress}</p>
                    <p className="text-xs text-slate-400">En cours</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-700/50 rounded-lg">
                    <Target className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.tasksTodo}</p>
                    <p className="text-xs text-slate-400">À faire</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <FolderKanban className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.projectsActive}</p>
                    <p className="text-xs text-slate-400">Projets</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600/20 rounded-lg">
                    <Send className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.pendingRequests}</p>
                    <p className="text-xs text-slate-400">Demandes</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.upcomingEvents}</p>
                    <p className="text-xs text-slate-400">Événements</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer Widget */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-600" />
                Chronomètre
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-mono font-bold text-white">
                  {formatTime(timerSeconds)}
                </div>
                <input
                  type="text"
                  placeholder="Description..."
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={timerRunning}
                />
                {!timerRunning ? (
                  <button
                    onClick={startTimer}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Démarrer
                  </button>
                ) : (
                  <button
                    onClick={stopTimer}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Arrêter
                  </button>
                )}
              </div>
            </div>

            {/* Current Task & Tasks */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Task */}
              {employee.currentTask && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Tâche en cours
                  </h2>
                  <h3 className="text-xl font-bold mb-2">{employee.currentTask.title}</h3>
                  {employee.currentTask.project && (
                    <p className="text-blue-200 mb-4">
                      {employee.currentTask.project.name}
                      {employee.currentTask.project.client && ` • ${employee.currentTask.project.client}`}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      employee.currentTask.priority === "high" ? "bg-red-500" :
                      employee.currentTask.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                    }`}>
                      {employee.currentTask.priority}
                    </span>
                    {employee.currentTask.dueDate && (
                      <span className="text-blue-200">
                        Échéance: {new Date(employee.currentTask.dueDate).toLocaleDateString("fr-CA")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Mes tâches
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === "done" ? "bg-green-500" :
                        task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{task.title}</p>
                        <p className="text-sm text-slate-400 truncate">
                          {task.project?.name || "Sans projet"}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-slate-400 text-center py-4">Aucune tâche assignée</p>
                  )}
                </div>
              </div>
            </div>

            {/* Projects */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-purple-600" />
                Projets actifs
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                    <h3 className="font-medium text-white">{project.name}</h3>
                    <p className="text-sm text-slate-400">{project.client || "Client interne"}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Progression</span>
                        <span className="font-medium">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-slate-400 col-span-full text-center py-4">Aucun projet actif</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Time Tab */}
        {activeTab === "time" && (
          <div className="space-y-6">
            {/* Timer */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Chronomètre</h2>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-mono font-bold text-white">
                  {formatTime(timerSeconds)}
                </div>
                <input
                  type="text"
                  placeholder="Description du travail..."
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={timerRunning}
                />
                {!timerRunning ? (
                  <button
                    onClick={startTimer}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-lg"
                  >
                    <Play className="w-5 h-5" />
                    Démarrer
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setTimerRunning(false)}
                      className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                    >
                      <Pause className="w-5 h-5" />
                      Pause
                    </button>
                    <button
                      onClick={stopTimer}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <Square className="w-5 h-5" />
                      Arrêter
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Time Entries */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Entrées de temps récentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Durée</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Facturable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map(entry => (
                      <tr key={entry.id} className="border-b hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-sm">
                          {new Date(entry.startTime).toLocaleDateString("fr-CA")}
                        </td>
                        <td className="py-3 px-4 text-sm">{entry.description || "-"}</td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {entry.duration ? `${Math.round(entry.duration / 60 * 10) / 10}h` : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {entry.billable ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                    {timeEntries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Aucune entrée de temps
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Timesheets Tab */}
        {activeTab === "timesheets" && (
          <div className="space-y-6">
            {/* Week Navigation */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Feuille de temps</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedWeek);
                      prev.setDate(prev.getDate() - 7);
                      setSelectedWeek(prev);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <p className="font-medium text-white">
                      {formatDateFR(selectedWeek)} - {formatDateFR(getWeekEnd(selectedWeek))}
                    </p>
                    <p className="text-sm text-slate-400">
                      Semaine {Math.ceil((selectedWeek.getTime() - new Date(selectedWeek.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = new Date(selectedWeek);
                      next.setDate(next.getDate() + 7);
                      setSelectedWeek(next);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedWeek(getWeekStart(new Date()))}
                    className="px-3 py-1.5 text-sm bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Aujourd'hui
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              {weeklyTimesheet && (
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    weeklyTimesheet.status === "approved" ? "bg-green-500/20 text-green-400" :
                    weeklyTimesheet.status === "submitted" ? "bg-blue-500/20 text-blue-400" :
                    weeklyTimesheet.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>
                    {weeklyTimesheet.status === "approved" ? "Approuvée" :
                     weeklyTimesheet.status === "submitted" ? "Soumise" :
                     weeklyTimesheet.status === "rejected" ? "Rejetée" :
                     "Brouillon"}
                  </span>
                  {weeklyTimesheet.status === "approved" && weeklyTimesheet.approverName && (
                    <span className="text-sm text-slate-400">
                      Approuvée par {weeklyTimesheet.approverName} le {new Date(weeklyTimesheet.approvedAt!).toLocaleDateString("fr-CA")}
                    </span>
                  )}
                  {weeklyTimesheet.status === "rejected" && weeklyTimesheet.rejectionReason && (
                    <span className="text-sm text-red-400">
                      Raison: {weeklyTimesheet.rejectionReason}
                    </span>
                  )}
                </div>
              )}

              {/* Total Hours */}
              <div className="flex items-center gap-6 p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="text-3xl font-bold text-white">
                    {weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60}h
                  </p>
                  <p className="text-sm text-slate-400">Total de la semaine</p>
                </div>
                <div className="h-12 w-px bg-slate-700" />
                <div>
                  <p className="text-xl font-semibold text-green-400">
                    {weekEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0) / 60}h
                  </p>
                  <p className="text-sm text-slate-400">Facturables</p>
                </div>
                <div className="flex-1" />
                {canEditTimesheet && weekEntries.length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/employee-portal/${token}/timesheets`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            weekStartDate: formatDateISO(selectedWeek),
                            notes: timesheetNotes,
                          }),
                        });
                        if (res.ok) {
                          fetchTimesheetData();
                        }
                      } catch (error) {
                        console.error("Error submitting timesheet:", error);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <SendHorizontal className="w-4 h-4" />
                    Soumettre pour approbation
                  </button>
                )}
              </div>
            </div>

            {/* Week Grid */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {getWeekDays(selectedWeek).map((day, idx) => {
                  const dayEntries = weekEntries.filter(e => {
                    const entryDate = new Date(e.startTime);
                    return entryDate.toDateString() === day.toDateString();
                  });
                  const dayTotal = dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60;
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        isToday ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-900/30"
                      }`}
                    >
                      <p className="text-xs text-slate-400 uppercase">
                        {day.toLocaleDateString("fr-CA", { weekday: "short" })}
                      </p>
                      <p className={`text-sm font-medium ${isToday ? "text-blue-400" : "text-white"}`}>
                        {day.getDate()}
                      </p>
                      <p className="text-lg font-bold text-white mt-1">{dayTotal.toFixed(1)}h</p>
                      <p className="text-xs text-slate-500">{dayEntries.length} entrée(s)</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Entries List */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Entrées de la semaine</h3>
              {timesheetLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : weekEntries.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune entrée de temps pour cette semaine</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weekEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{entry.description || "Sans description"}</p>
                          {entry.billable && (
                            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                              Facturable
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">
                          {new Date(entry.startTime).toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "short" })}
                          {" "}•{" "}
                          {new Date(entry.startTime).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                          {entry.endTime && (
                            <> - {new Date(entry.endTime).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}</>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">
                          {entry.duration ? `${(entry.duration / 60).toFixed(1)}h` : "-"}
                        </p>
                      </div>
                      {canEditTimesheet && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
                                try {
                                  await fetch(`/api/employee-portal/${token}/timesheets?entryId=${entry.id}`, {
                                    method: "DELETE",
                                  });
                                  fetchTimesheetData();
                                } catch (error) {
                                  console.error("Error deleting entry:", error);
                                }
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {canEditTimesheet && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
                <textarea
                  value={timesheetNotes}
                  onChange={(e) => setTimesheetNotes(e.target.value)}
                  placeholder="Ajoutez des notes pour cette semaine..."
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            )}

            {/* Admin Notes (if rejected) */}
            {weeklyTimesheet?.adminNotes && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-yellow-500/30 p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Notes de l'administrateur</h3>
                <p className="text-slate-300">{weeklyTimesheet.adminNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Entry Modal */}
        {editingEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-white mb-4">Modifier l'entrée</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingEntry.description || ""}
                    onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Début</label>
                    <input
                      type="datetime-local"
                      value={editingEntry.startTime.slice(0, 16)}
                      onChange={(e) => setEditingEntry({ ...editingEntry, startTime: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Fin</label>
                    <input
                      type="datetime-local"
                      value={editingEntry.endTime?.slice(0, 16) || ""}
                      onChange={(e) => setEditingEntry({ ...editingEntry, endTime: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingEntry.billable}
                      onChange={(e) => setEditingEntry({ ...editingEntry, billable: e.target.checked })}
                      className="rounded border-slate-600"
                    />
                    <span className="text-sm text-slate-400">Facturable</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                  <textarea
                    value={editingEntry.notes || ""}
                    onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    try {
                      const startTime = new Date(editingEntry.startTime);
                      const endTime = editingEntry.endTime ? new Date(editingEntry.endTime) : null;
                      const duration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : null;

                      await fetch(`/api/employee-portal/${token}/timesheets`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          entryId: editingEntry.id,
                          description: editingEntry.description,
                          startTime: startTime.toISOString(),
                          endTime: endTime?.toISOString(),
                          duration,
                          billable: editingEntry.billable,
                          notes: editingEntry.notes,
                        }),
                      });
                      setEditingEntry(null);
                      fetchTimesheetData();
                    } catch (error) {
                      console.error("Error updating entry:", error);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Événements à venir</h2>
            <div className="space-y-4">
              {events.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:border-blue-300 transition-colors"
                  style={{ borderLeftColor: event.color || "#3b82f6", borderLeftWidth: "4px" }}
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-2xl font-bold text-white">
                      {new Date(event.startDate).getDate()}
                    </p>
                    <p className="text-sm text-slate-400">
                      {new Date(event.startDate).toLocaleDateString("fr-CA", { month: "short" })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span>{event.allDay ? "Journée complète" : new Date(event.startDate).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs">{event.type}</span>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-slate-400 text-center py-8">Aucun événement à venir</p>
              )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Mes documents</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{doc.name}</h3>
                      <p className="text-sm text-slate-400">{doc.category || "Général"}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(doc.createdAt).toLocaleDateString("fr-CA")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </a>
                    <a
                      href={doc.fileUrl}
                      download
                      className="flex-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </a>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-slate-400 col-span-full text-center py-8">Aucun document</p>
              )}
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Mes demandes</h2>
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouvelle demande
              </button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800/30">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Titre</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Dates</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Statut</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Créée le</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} className="border-t hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-slate-700/50 rounded text-sm capitalize">
                          {req.type === "leave" ? "Congé" :
                           req.type === "training" ? "Formation" :
                           req.type === "equipment" ? "Équipement" : req.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{req.title}</td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {req.startDate && new Date(req.startDate).toLocaleDateString("fr-CA")}
                        {req.endDate && ` - ${new Date(req.endDate).toLocaleDateString("fr-CA")}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(req.status)}`}>
                          {req.status === "pending" ? "En attente" :
                           req.status === "approved" ? "Approuvée" :
                           req.status === "rejected" ? "Refusée" : req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString("fr-CA")}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Aucune demande
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-violet-400" />
                Centre de notifications
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.href = `/employee-portal/${token}/notifications/settings`}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Paramètres
                </button>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4 text-center">
                <div className="text-2xl font-bold text-white">{notifications.length}</div>
                <div className="text-xs text-white/50">Total</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4 text-center">
                <div className="text-2xl font-bold text-violet-400">{notifications.filter(n => !n.isRead).length}</div>
                <div className="text-xs text-white/50">Non lues</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{notifications.filter(n => n.isRead).length}</div>
                <div className="text-xs text-white/50">Lues</div>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-white/5 transition-colors ${!notif.isRead ? 'bg-violet-500/5 border-l-2 border-violet-500' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {notif.type === 'timesheet_approved' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {notif.type === 'timesheet_rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                          {notif.type === 'task_assigned' && <FolderKanban className="w-5 h-5 text-violet-500" />}
                          {notif.type === 'task_updated' && <FolderKanban className="w-5 h-5 text-blue-500" />}
                          {notif.type === 'request_approved' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                          {notif.type === 'request_rejected' && <XCircle className="w-5 h-5 text-orange-500" />}
                          {notif.type === 'general' && <MessageSquare className="w-5 h-5 text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`font-medium ${notif.isRead ? 'text-white/80' : 'text-white'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-xs text-white/40 flex-shrink-0">
                              {new Date(notif.createdAt).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <p className="text-sm text-white/60 mt-1">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {notif.link && (
                              <button
                                onClick={() => setActiveTab(notif.link?.replace('/', '') as typeof activeTab)}
                                className="text-xs text-violet-400 hover:text-violet-300"
                              >
                                Voir les détails →
                              </button>
                            )}
                            {!notif.isRead && (
                              <button
                                onClick={async () => {
                                  await fetch(`/api/employee-portal/${token}/notifications`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ notificationId: notif.id }),
                                  });
                                  setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                                }}
                                className="text-xs text-green-400 hover:text-green-300"
                              >
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lien vers paramètres */}
            <div className="text-center">
              <a
                href={`/employee-portal/${token}/notifications/settings`}
                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Gérer mes préférences de notifications
              </a>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-start gap-6">
              {employee.photoUrl ? (
                <Image
                  src={employee.photoUrl}
                  alt={employee.name}
                  width={120}
                  height={120}
                  className="rounded-xl object-cover"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <User className="w-12 h-12 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{employee.name}</h2>
                <p className="text-lg text-slate-400">{employee.role || "Employé"}</p>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="font-medium">{employee.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Téléphone</p>
                    <p className="font-medium">{employee.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Département</p>
                    <p className="font-medium">{employee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Capacité hebdomadaire</p>
                    <p className="font-medium">{employee.capacityHoursPerWeek}h/semaine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leo IA Tab */}
        {activeTab === "leo" && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Leo IA</h2>
                  <p className="text-sm text-purple-200">Ton assistant personnel</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-purple-200 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Bonjour {employee.name} !</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Je suis Leo, ton assistant IA personnel. Je peux t&apos;aider avec tes tâches, 
                    répondre à tes questions sur l&apos;entreprise, et bien plus encore.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["Quelles sont mes tâches ?", "Résume mes projets", "Aide-moi à prioriser"].map(q => (
                      <button
                        key={q}
                        onClick={() => setChatInput(q)}
                        className="px-4 py-2 bg-purple-600/20 text-purple-700 rounded-full text-sm hover:bg-purple-200"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-slate-700/50 text-white rounded-bl-md"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 p-4 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="Pose une question à Leo..."
                  className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Nouvelle demande</h2>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="leave">Congé</option>
                  <option value="training">Formation</option>
                  <option value="equipment">Équipement</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Titre</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Congé vacances"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Détails de la demande..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date début</label>
                  <input
                    type="date"
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 text-slate-300 border rounded-lg hover:bg-slate-800/30"
              >
                Annuler
              </button>
              <button
                onClick={submitRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Soumettre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
