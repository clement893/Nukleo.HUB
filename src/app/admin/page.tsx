"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  BarChart3,
  Users,
  FolderKanban,
  Building2,
  DollarSign,
  Clock,
  TrendingUp,
  Activity,
  Settings,
  Shield,
  UserCog,
  FileText,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Target,
  Ticket,
  RefreshCw,
  Lightbulb,
  ClipboardList,
  Palmtree,
  CalendarDays,
  Bell,
} from "lucide-react";

interface KPIs {
  totalProjects: number;
  activeProjects: number;
  totalClients: number;
  totalContacts: number;
  totalEmployees: number;
  totalOpportunities: number;
  recentProjects: number;
  totalHours: number;
  revenue: number;
  pipelineValue: number;
  openTickets: number;
}

interface ChartData {
  projectsByStatus: Array<{ status: string; count: number }>;
  projectsByType: Array<{ type: string; count: number }>;
  opportunitiesByStage: Array<{ stage: string; count: number; value: number }>;
  employeesByDepartment: Array<{ department: string; count: number }>;
}

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  description: string | null;
  userName: string | null;
  createdAt: string;
}

interface AdminStats {
  kpis: KPIs;
  charts: ChartData;
  recentActivity: ActivityLog[];
  period: string;
}

type TabType = "overview" | "users" | "logs" | "settings" | "stats" | "employees" | "access";

const TABS = [
  { id: "overview" as TabType, label: "Vue d'ensemble", icon: BarChart3 },
  { id: "users" as TabType, label: "Utilisateurs", icon: UserCog },
  { id: "employees" as TabType, label: "Employés", icon: Users },
  { id: "stats" as TabType, label: "Statistiques", icon: TrendingUp },
  { id: "logs" as TabType, label: "Logs d'activité", icon: Activity },
  { id: "settings" as TabType, label: "Paramètres", icon: Settings },
  { id: "access" as TabType, label: "Gestion des accès", icon: Shield },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/stats?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "text-green-400 bg-green-500/10";
      case "update":
        return "text-blue-400 bg-blue-500/10";
      case "delete":
        return "text-red-400 bg-red-500/10";
      case "login":
        return "text-purple-400 bg-purple-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create":
        return "Création";
      case "update":
        return "Modification";
      case "delete":
        return "Suppression";
      case "login":
        return "Connexion";
      case "logout":
        return "Déconnexion";
      default:
        return action;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Administration</h1>
                <p className="text-sm text-muted-foreground">Tableau de bord administrateur</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
              >
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
              </select>
              <button
                onClick={fetchStats}
                className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-8 border-t border-border">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        <div className="p-8">
          {loading && !stats ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && stats && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <FolderKanban className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Projets</p>
                          <p className="text-2xl font-bold text-foreground">{stats.kpis.totalProjects}</p>
                          <p className="text-xs text-green-400">{stats.kpis.activeProjects} actifs</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Building2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Clients</p>
                          <p className="text-2xl font-bold text-foreground">{stats.kpis.totalClients}</p>
                          <p className="text-xs text-muted-foreground">{stats.kpis.totalContacts} contacts</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Users className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Employés</p>
                          <p className="text-2xl font-bold text-foreground">{stats.kpis.totalEmployees}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                          <Target className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Opportunités</p>
                          <p className="text-2xl font-bold text-foreground">{stats.kpis.totalOpportunities}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue & Pipeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <DollarSign className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Revenus ({period})</p>
                          <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.kpis.revenue)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                          <Briefcase className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pipeline</p>
                          <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.kpis.pipelineValue)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                          <Clock className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Heures ({period})</p>
                          <p className="text-2xl font-bold text-foreground">{stats.kpis.totalHours.toFixed(1)}h</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Projects by Status */}
                    <div className="glass-card rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Projets par statut</h3>
                      <div className="space-y-3">
                        {stats.charts.projectsByStatus.map((item) => (
                          <div key={item.status} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-foreground">{item.status}</span>
                                <span className="text-sm text-muted-foreground">{item.count}</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{
                                    width: `${(item.count / stats.kpis.totalProjects) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Employees by Department */}
                    <div className="glass-card rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Employés par département</h3>
                      <div className="space-y-3">
                        {stats.charts.employeesByDepartment.map((item) => (
                          <div key={item.department} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-foreground">{item.department}</span>
                                <span className="text-sm text-muted-foreground">{item.count}</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{
                                    width: `${(item.count / stats.kpis.totalEmployees) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity & Tickets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="glass-card rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Activité récente
                      </h3>
                      {stats.recentActivity.length > 0 ? (
                        <div className="space-y-3">
                          {stats.recentActivity.map((log) => (
                            <div key={log.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                              <span className={`px-2 py-1 text-xs rounded ${getActionColor(log.action)}`}>
                                {getActionLabel(log.action)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground truncate">
                                  {log.description || log.entityType}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {log.userName || "Système"} • {new Date(log.createdAt).toLocaleString("fr-CA")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Aucune activité récente
                        </p>
                      )}
                    </div>

                    {/* Open Tickets */}
                    <div className="glass-card rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Ticket className="w-5 h-5" />
                        Tickets ouverts
                      </h3>
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-foreground">{stats.kpis.openTickets}</p>
                          <p className="text-sm text-muted-foreground mt-1">tickets en attente</p>
                          {stats.kpis.openTickets > 0 && (
                            <a
                              href="/tickets"
                              className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
                            >
                              Voir les tickets
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Accès rapide</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <a
                        href="/admin/recommendations"
                        className="flex flex-col items-center gap-2 p-4 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
                      >
                        <Lightbulb className="w-6 h-6 text-amber-500" />
                        <span className="text-sm font-medium text-foreground">Recommandations</span>
                      </a>
                      <a
                        href="/admin/surveys"
                        className="flex flex-col items-center gap-2 p-4 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-colors"
                      >
                        <ClipboardList className="w-6 h-6 text-indigo-500" />
                        <span className="text-sm font-medium text-foreground">Sondages</span>
                      </a>
                      <a
                        href="/admin/vacations"
                        className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors"
                      >
                        <Palmtree className="w-6 h-6 text-emerald-500" />
                        <span className="text-sm font-medium text-foreground">Vacances</span>
                      </a>
                      <a
                        href="/admin/timesheets"
                        className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors"
                      >
                        <CalendarDays className="w-6 h-6 text-blue-500" />
                        <span className="text-sm font-medium text-foreground">Feuilles de temps</span>
                      </a>
                      <a
                        href="/admin/notifications"
                        className="flex flex-col items-center gap-2 p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-colors"
                      >
                        <Bell className="w-6 h-6 text-purple-500" />
                        <span className="text-sm font-medium text-foreground">Notifications</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && <UsersTab />}

              {/* Employees Tab */}
              {activeTab === "employees" && <EmployeesTab />}

              {/* Stats Tab */}
              {activeTab === "stats" && stats && <StatsTab stats={stats} />}

              {/* Logs Tab */}
              {activeTab === "logs" && <LogsTab />}

              {/* Settings Tab */}
              {activeTab === "settings" && <SettingsTab />}

              {/* Access Tab */}
              {activeTab === "access" && <AccessTab />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Users Tab Component
function UsersTab() {
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?search=${search}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Gestion des utilisateurs</h2>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
          className="px-4 py-2 bg-muted border border-border rounded-lg text-sm"
        />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nom</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Créé le</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-foreground">{user.name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("fr-CA")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm text-primary hover:underline">Modifier</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Employees Tab Component
function EmployeesTab() {
  const [data, setData] = useState<{
    employees: Array<{
      id: string;
      name: string;
      email: string | null;
      department: string;
      role: string | null;
      capacityHoursPerWeek: number;
      hoursThisMonth: number;
      utilizationRate: number;
      currentTask: { id: string; title: string; project: { id: string; name: string } } | null;
    }>;
    departmentStats: Array<{ department: string; count: number; totalCapacity: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, [department]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`/api/admin/employees?department=${department}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Department Stats */}
      {data?.departmentStats && (
        <div className="grid grid-cols-3 gap-4">
          {data.departmentStats.map((dept) => (
            <div
              key={dept.department}
              onClick={() => setDepartment(dept.department === department ? "" : dept.department)}
              className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${
                department === dept.department ? "ring-2 ring-primary" : ""
              }`}
            >
              <h3 className="font-semibold text-foreground">{dept.department}</h3>
              <p className="text-2xl font-bold text-primary mt-1">{dept.count}</p>
              <p className="text-sm text-muted-foreground">
                {dept.totalCapacity}h/sem de capacité
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Employees Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Employé</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Département</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rôle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tâche actuelle</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Heures/mois</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Utilisation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : !data?.employees.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun employé trouvé
                </td>
              </tr>
            ) : (
              data.employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                      {emp.department}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{emp.role || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    {emp.currentTask ? (
                      <div>
                        <p className="text-foreground truncate max-w-[200px]">{emp.currentTask.title}</p>
                        <p className="text-xs text-muted-foreground">{emp.currentTask.project.name}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-foreground">
                    {emp.hoursThisMonth.toFixed(1)}h
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            emp.utilizationRate > 100
                              ? "bg-red-500"
                              : emp.utilizationRate > 80
                              ? "bg-green-500"
                              : emp.utilizationRate > 50
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }`}
                          style={{ width: `${Math.min(emp.utilizationRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{emp.utilizationRate}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Stats Tab Component
function StatsTab({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Statistiques avancées</h2>

      {/* Projects by Type */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-md font-semibold text-foreground mb-4">Projets par type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.charts.projectsByType.map((item) => (
            <div key={item.type} className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">{item.count}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities by Stage */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-md font-semibold text-foreground mb-4">Pipeline des opportunités</h3>
        <div className="space-y-3">
          {stats.charts.opportunitiesByStage.map((item) => (
            <div key={item.stage} className="flex items-center gap-4">
              <div className="w-48 truncate text-sm text-foreground">{item.stage}</div>
              <div className="flex-1">
                <div className="h-6 bg-muted rounded-full overflow-hidden flex items-center">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max((item.count / stats.kpis.totalOpportunities) * 100, 10)}%`,
                    }}
                  >
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  </div>
                </div>
              </div>
              <div className="w-24 text-right text-sm text-muted-foreground">
                {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 0 }).format(item.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Logs Tab Component
function LogsTab() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ action: "", entityType: "" });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
      });
      const response = await fetch(`/api/admin/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "text-green-400 bg-green-500/10";
      case "update":
        return "text-blue-400 bg-blue-500/10";
      case "delete":
        return "text-red-400 bg-red-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Logs d&apos;activité</h2>
        <div className="flex items-center gap-3">
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
          >
            <option value="">Toutes les actions</option>
            <option value="create">Création</option>
            <option value="update">Modification</option>
            <option value="delete">Suppression</option>
            <option value="login">Connexion</option>
          </select>
          <select
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
          >
            <option value="">Tous les types</option>
            <option value="Project">Projet</option>
            <option value="Contact">Contact</option>
            <option value="Company">Entreprise</option>
            <option value="Employee">Employé</option>
          </select>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Entité</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Utilisateur</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun log trouvé
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{log.entityType}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{log.description || "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{log.userName || "Système"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("fr-CA")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-muted rounded-lg text-sm disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-muted rounded-lg text-sm disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  const [settings, setSettings] = useState<Record<string, Array<{
    id: string;
    key: string;
    value: string;
    description: string | null;
    category: string | null;
  }>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.grouped);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(editedValues).map(([key, value]) => ({
        key,
        value,
      }));

      if (updates.length === 0) return;

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: updates }),
      });

      if (response.ok) {
        setEditedValues({});
        fetchSettings();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { key: "general", label: "Général", icon: Settings },
    { key: "notifications", label: "Notifications", icon: AlertCircle },
    { key: "security", label: "Sécurité", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Paramètres système</h2>
        {Object.keys(editedValues).length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : Object.keys(settings).length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun paramètre configuré</p>
          <p className="text-sm text-muted-foreground mt-2">
            Les paramètres système seront affichés ici une fois créés.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catSettings = settings[cat.key] || [];
            if (catSettings.length === 0) return null;

            const Icon = cat.icon;
            return (
              <div key={cat.key} className="glass-card rounded-xl p-6">
                <h3 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {cat.label}
                </h3>
                <div className="space-y-4">
                  {catSettings.map((setting) => (
                    <div key={setting.id} className="flex items-start gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-foreground">{setting.key}</label>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editedValues[setting.key] ?? setting.value}
                        onChange={(e) =>
                          setEditedValues({ ...editedValues, [setting.key]: e.target.value })
                        }
                        className="w-64 px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// Access Tab Component - Redirects to dedicated page
function AccessTab() {
  useEffect(() => {
    window.location.href = "/admin/access";
  }, []);

  return (
    <div className="text-center py-12">
      <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
      <p className="text-muted-foreground">Redirection vers la gestion des accès...</p>
    </div>
  );
}
