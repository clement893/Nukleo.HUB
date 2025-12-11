"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  User,
  Clock,
  Calendar,
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
  Timer,
  Target,
  TrendingUp,
  Briefcase,
  MessageSquare,
  X,
  Download,
  Eye,
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

  const [activeTab, setActiveTab] = useState<"dashboard" | "time" | "calendar" | "documents" | "requests" | "profile" | "leo">("dashboard");

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
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "todo": return "bg-gray-100 text-gray-800";
      case "done": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">{error || "Portail non trouvé"}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: Target },
    { id: "time", label: "Temps", icon: Clock },
    { id: "calendar", label: "Calendrier", icon: Calendar },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "requests", label: "Demandes", icon: Send },
    { id: "profile", label: "Profil", icon: User },
    { id: "leo", label: "Leo IA", icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {employee.photoUrl ? (
              <Image
                src={employee.photoUrl}
                alt={employee.name}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{employee.name}</h1>
              <p className="text-sm text-gray-500">{employee.role || employee.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Département</p>
              <p className="font-medium text-gray-900">{employee.department}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
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
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.hoursThisWeek}h</p>
                    <p className="text-xs text-gray-500">Cette semaine</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Play className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.tasksInProgress}</p>
                    <p className="text-xs text-gray-500">En cours</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Target className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.tasksTodo}</p>
                    <p className="text-xs text-gray-500">À faire</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FolderKanban className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.projectsActive}</p>
                    <p className="text-xs text-gray-500">Projets</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Send className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                    <p className="text-xs text-gray-500">Demandes</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                    <p className="text-xs text-gray-500">Événements</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer Widget */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-600" />
                Chronomètre
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-mono font-bold text-gray-900">
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
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Mes tâches
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === "done" ? "bg-green-500" :
                        task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {task.project?.name || "Sans projet"}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucune tâche assignée</p>
                  )}
                </div>
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-purple-600" />
                Projets actifs
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.client || "Client interne"}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Progression</span>
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
                  <p className="text-gray-500 col-span-full text-center py-4">Aucun projet actif</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Time Tab */}
        {activeTab === "time" && (
          <div className="space-y-6">
            {/* Timer */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chronomètre</h2>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-mono font-bold text-gray-900">
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Entrées de temps récentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Durée</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Facturable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map(entry => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
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
                        <td colSpan={4} className="py-8 text-center text-gray-500">
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

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Événements à venir</h2>
            <div className="space-y-4">
              {events.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:border-blue-300 transition-colors"
                  style={{ borderLeftColor: event.color || "#3b82f6", borderLeftWidth: "4px" }}
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-2xl font-bold text-gray-900">
                      {new Date(event.startDate).getDate()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleDateString("fr-CA", { month: "short" })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{event.allDay ? "Journée complète" : new Date(event.startDate).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{event.type}</span>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-gray-500 text-center py-8">Aucun événement à venir</p>
              )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mes documents</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                      <p className="text-sm text-gray-500">{doc.category || "Général"}</p>
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
                <p className="text-gray-500 col-span-full text-center py-8">Aucun document</p>
              )}
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Mes demandes</h2>
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouvelle demande
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Titre</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Dates</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Statut</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Créée le</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                          {req.type === "leave" ? "Congé" :
                           req.type === "training" ? "Formation" :
                           req.type === "equipment" ? "Équipement" : req.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{req.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
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
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString("fr-CA")}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        Aucune demande
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
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
                <div className="w-[120px] h-[120px] rounded-xl bg-blue-100 flex items-center justify-center">
                  <User className="w-12 h-12 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
                <p className="text-lg text-gray-500">{employee.role || "Employé"}</p>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{employee.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{employee.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Département</p>
                    <p className="font-medium">{employee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Capacité hebdomadaire</p>
                    <p className="font-medium">{employee.capacityHoursPerWeek}h/semaine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leo IA Tab */}
        {activeTab === "leo" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[calc(100vh-200px)] flex flex-col">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Bonjour {employee.name} !</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Je suis Leo, ton assistant IA personnel. Je peux t&apos;aider avec tes tâches, 
                    répondre à tes questions sur l&apos;entreprise, et bien plus encore.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["Quelles sont mes tâches ?", "Résume mes projets", "Aide-moi à prioriser"].map(q => (
                      <button
                        key={q}
                        onClick={() => setChatInput(q)}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200"
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
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
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
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle demande</h2>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Congé vacances"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                  <input
                    type="date"
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
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
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
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
