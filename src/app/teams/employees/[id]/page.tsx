"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ProtectedEmployeePortal } from "@/components/ProtectedEmployeePortal";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Timer,
  Square,
  TrendingUp,
  FolderOpen,
  CheckCircle2,
  BarChart3,
  Linkedin,
  Mail,
  Trash2,
  ExternalLink,
  Link2,
  Copy,
  Check,
  Plus,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  role: string | null;
  department: string;
  capacity: number | null;
  googleCalendarId: string | null;
  googleCalendarSync: boolean;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
}

interface GoogleCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink: string;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  taskId: string | null;
  projectId: string | null;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  billable: boolean;
  status: string;
  notes: string | null;
}

interface Task {
  id: string;
  title: string;
  projectId: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface TimeStats {
  period: string;
  totalMinutes: number;
  totalHours: number;
  billableMinutes: number;
  billableHours: number;
  billablePercentage: number;
  entriesCount: number;
  entriesByDay: Record<string, number>;
  entriesByProject: { minutes: number; projectId: string }[];
  runningEntry: TimeEntry | null;
  recentEntries: TimeEntry[];
}

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("week");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [_showCalendarConfig, _setShowCalendarConfig] = useState(false);
  const [calendarId, setCalendarId] = useState("");
  const [calendarSync, setCalendarSync] = useState(false);
  const [_savingCalendar, setSavingCalendar] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", startDate: "", startTime: "", endDate: "", endTime: "", allDay: false });
  const [addingEvent, setAddingEvent] = useState(false);

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id, selectedPeriod]);

  // Timer update
  useEffect(() => {
    if (timeStats?.runningEntry) {
      const interval = setInterval(() => {
        const start = new Date(timeStats.runningEntry!.startTime).getTime();
        setTimerSeconds(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeStats?.runningEntry]);

  const fetchCalendarEvents = async () => {
    try {
      const res = await fetch(`/api/employees/${resolvedParams.id}/calendar`);
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startDate) return;
    setAddingEvent(true);
    try {
      const startDateTime = newEvent.allDay 
        ? newEvent.startDate 
        : `${newEvent.startDate}T${newEvent.startTime || "09:00"}:00`;
      const endDateTime = newEvent.allDay 
        ? (newEvent.endDate || newEvent.startDate) 
        : `${newEvent.endDate || newEvent.startDate}T${newEvent.endTime || "10:00"}:00`;
      
      const res = await fetch(`/api/employees/${resolvedParams.id}/calendar/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          startDateTime,
          endDateTime,
          allDay: newEvent.allDay,
        }),
      });
      
      if (res.ok) {
        setShowAddEvent(false);
        setNewEvent({ title: "", description: "", startDate: "", startTime: "", endDate: "", endTime: "", allDay: false });
        fetchCalendarEvents();
      } else {
        const data = await res.json();
        alert(data.error || "Échec de la création");
      }
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Échec de la création de l'événement");
    } finally {
      setAddingEvent(false);
    }
  };

  useEffect(() => {
    if (employee?.googleCalendarSync) {
      fetchCalendarEvents();
    }
    if (employee) {
      setCalendarId(employee.googleCalendarId || "");
      setCalendarSync(employee.googleCalendarSync || false);
    }
  }, [employee]);

  const fetchPortal = async () => {
    try {
      const res = await fetch(`/api/employees/${resolvedParams.id}/portal`);
      if (res.ok) {
        const data = await res.json();
        setPortalUrl(data.url);
      }
    } catch (error) {
      console.error("Error fetching portal:", error);
    }
  };

  const generatePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch(`/api/employees/${resolvedParams.id}/portal`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPortalUrl(data.url);
      }
    } catch (error) {
      console.error("Error generating portal:", error);
    } finally {
      setPortalLoading(false);
    }
  };

  const copyPortalUrl = () => {
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetchPortal();
  }, [resolvedParams.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employee
      const empRes = await fetch(`/api/employees/${resolvedParams.id}`);
      const empData = await empRes.json();
      setEmployee(empData);

      // Fetch time stats
      const statsRes = await fetch(`/api/time-entries/stats?employeeId=${resolvedParams.id}&period=${selectedPeriod}`);
      const statsData = await statsRes.json();
      setTimeStats(statsData);

      // Fetch all time entries for the period
      const entriesRes = await fetch(`/api/time-entries?employeeId=${resolvedParams.id}`);
      const entriesData = await entriesRes.json();
      setTimeEntries(entriesData);

      // Fetch tasks and projects for reference
      const [tasksRes, projectsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
      ]);
      const [tasksData, projectsData] = await Promise.all([tasksRes.json(), projectsRes.json()]);
      
      const tasksMap: Record<string, Task> = {};
      tasksData.forEach((t: Task) => { tasksMap[t.id] = t; });
      setTasks(tasksMap);

      const projectsMap: Record<string, Project> = {};
      projectsData.forEach((p: Project) => { projectsMap[p.id] = p; });
      setProjects(projectsMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleStopTimer = async () => {
    if (!timeStats?.runningEntry) return;
    try {
      await fetch("/api/time-entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: timeStats.runningEntry.id, action: "stop" }),
      });
      fetchData();
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Supprimer cette entrée de temps ?")) return;
    try {
      await fetch(`/api/time-entries?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    return `${h}h ${m}min`;
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getDepartmentColor = (dept: string) => {
    switch (dept) {
      case "Lab": return "#8b5cf6";
      case "Bureau": return "#3b82f6";
      case "Studio": return "#ec4899";
      case "Admin": return "#9333ea";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-64 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-64 flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Employé non trouvé</p>
        </main>
      </div>
    );
  }

  return (
    <ProtectedEmployeePortal employeeId={resolvedParams.id}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center gap-4 px-8">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Profil employé</h1>
              <p className="text-sm text-muted-foreground">Time tracking et statistiques</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-3 gap-6">
            {/* Left column - Profile */}
            <div className="space-y-6">
              {/* Profile card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4"
                    style={{ backgroundColor: getDepartmentColor(employee.department) }}
                  >
                    {employee.photoUrl ? (
                      <img
                        src={employee.photoUrl}
                        alt={employee.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(employee.name)
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{employee.name}</h2>
                  <p className="text-muted-foreground">{employee.role || "Membre"}</p>
                  <span
                    className="mt-2 px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${getDepartmentColor(employee.department)}20`,
                      color: getDepartmentColor(employee.department),
                    }}
                  >
                    {employee.department}
                  </span>

                  <div className="flex gap-3 mt-4">
                    {employee.email && (
                      <a
                        href={`mailto:${employee.email}`}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        title={employee.email}
                      >
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </a>
                    )}
                    {employee.linkedinUrl && (
                      <a
                        href={employee.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Linkedin className="h-5 w-5 text-blue-500" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Portail Employé */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-foreground">Portail Employé</span>
                  </div>
                  {portalUrl ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <a
                          href={portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ouvrir
                        </a>
                        <button
                          onClick={copyPortalUrl}
                          className="px-3 py-2 border border-border rounded-lg hover:bg-muted flex items-center gap-2 text-sm"
                        >
                          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <button
                        onClick={generatePortal}
                        disabled={portalLoading}
                        className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted"
                      >
                        {portalLoading ? "Génération..." : "Régénérer le lien"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={generatePortal}
                      disabled={portalLoading}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                      {portalLoading ? "Génération..." : "Générer le portail"}
                    </button>
                  )}
                </div>

                {/* Google Calendar */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-foreground">Google Calendar</span>
                    </div>
                    {employee.googleAccessToken && (
                      <span className="text-xs text-emerald-500 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Connecté
                      </span>
                    )}
                  </div>
                  
                  {!employee.googleAccessToken ? (
                    <a
                      href={`/api/auth/google/authorize?employeeId=${employee.id}`}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Connecter Google Calendar
                    </a>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowAddEvent(true)}
                        className="w-full mb-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Ajouter un événement
                      </button>
                      
                      {showAddEvent && (
                        <div className="mb-3 p-3 bg-muted/50 rounded-lg space-y-2">
                          <input
                            type="text"
                            placeholder="Titre de l'événement"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                          />
                          <textarea
                            placeholder="Description (optionnel)"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm h-16 resize-none"
                          />
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id="allDay"
                              checked={newEvent.allDay}
                              onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                              className="rounded"
                            />
                            <label htmlFor="allDay" className="text-sm">Toute la journée</label>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Début</label>
                              <input
                                type="date"
                                value={newEvent.startDate}
                                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                              />
                              {!newEvent.allDay && (
                                <input
                                  type="time"
                                  value={newEvent.startTime}
                                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                  className="w-full mt-1 px-2 py-1 bg-background border border-border rounded text-sm"
                                />
                              )}
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Fin</label>
                              <input
                                type="date"
                                value={newEvent.endDate}
                                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                              />
                              {!newEvent.allDay && (
                                <input
                                  type="time"
                                  value={newEvent.endTime}
                                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                  className="w-full mt-1 px-2 py-1 bg-background border border-border rounded text-sm"
                                />
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={handleAddEvent}
                              disabled={addingEvent || !newEvent.title || !newEvent.startDate}
                              className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm disabled:opacity-50"
                            >
                              {addingEvent ? "Création..." : "Créer"}
                            </button>
                            <button
                              onClick={() => setShowAddEvent(false)}
                              className="px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 text-sm"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {calendarEvents.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                          {calendarEvents.slice(0, 5).map((event) => (
                            <a
                              key={event.id}
                              href={event.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
                            >
                              <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.start).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                {!event.allDay && ` - ${new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                              </p>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-3">Aucun événement à venir</p>
                      )}
                      <button
                        onClick={async () => {
                          if (confirm('Déconnecter Google Calendar ?')) {
                            await fetch('/api/auth/google/disconnect', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ employeeId: employee.id }),
                            });
                            window.location.reload();
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Déconnecter
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Capacité hebdo</span>
                    <span className="font-medium text-foreground">{employee.capacity || 40}h</span>
                  </div>
                </div>
              </div>

              {/* Running timer */}
              {timeStats?.runningEntry && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Timer className="h-5 w-5 text-emerald-500 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Timer en cours</p>
                      <p className="text-sm text-muted-foreground">
                        {tasks[timeStats.runningEntry.taskId || ""]?.title || "Tâche inconnue"}
                      </p>
                    </div>
                  </div>
                  <div className="text-4xl font-mono font-bold text-emerald-500 text-center my-4">
                    {formatTime(timerSeconds)}
                  </div>
                  <button
                    onClick={handleStopTimer}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <Square className="h-4 w-4" />
                    Arrêter le timer
                  </button>
                </div>
              )}
            </div>

            {/* Right column - Stats and entries */}
            <div className="col-span-2 space-y-6">
              {/* Period selector */}
              <div className="flex gap-2">
                {(["day", "week", "month"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {period === "day" ? "Aujourd'hui" : period === "week" ? "Cette semaine" : "Ce mois"}
                  </button>
                ))}
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Clock className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{timeStats?.totalHours || 0}h</p>
                      <p className="text-sm text-muted-foreground">Temps total</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{timeStats?.billableHours || 0}h</p>
                      <p className="text-sm text-muted-foreground">Facturable</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <BarChart3 className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{timeStats?.billablePercentage || 0}%</p>
                      <p className="text-sm text-muted-foreground">Taux facturable</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{timeStats?.entriesCount || 0}</p>
                      <p className="text-sm text-muted-foreground">Entrées</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time by project */}
              {timeStats?.entriesByProject && timeStats.entriesByProject.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Temps par projet
                  </h3>
                  <div className="space-y-3">
                    {timeStats.entriesByProject.map((entry) => {
                      const project = projects[entry.projectId];
                      const percentage = timeStats.totalMinutes > 0
                        ? Math.round((entry.minutes / timeStats.totalMinutes) * 100)
                        : 0;
                      return (
                        <div key={entry.projectId}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground">{project?.name || "Projet inconnu"}</span>
                            <span className="text-muted-foreground">{formatDuration(entry.minutes)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent entries */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Entrées de temps récentes
                </h3>
                {timeEntries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune entrée de temps</p>
                ) : (
                  <div className="space-y-3">
                    {timeEntries.slice(0, 20).map((entry) => {
                      const task = tasks[entry.taskId || ""];
                      const project = projects[entry.projectId || ""];
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                        >
                          <div className={`p-2 rounded-lg ${entry.status === "running" ? "bg-emerald-500/10" : "bg-muted"}`}>
                            {entry.status === "running" ? (
                              <Timer className="h-4 w-4 text-emerald-500 animate-pulse" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {task?.title || entry.description || "Sans titre"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {project?.name || "Pas de projet"} • {new Date(entry.startTime).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">
                              {entry.status === "running" ? (
                                <span className="text-emerald-500">En cours</span>
                              ) : (
                                formatDuration(entry.duration || 0)
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              {entry.endTime && ` - ${new Date(entry.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </main>
      </div>
    </ProtectedEmployeePortal>
  );
}
