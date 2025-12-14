"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  User,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  CheckCheck,
  RotateCcw,
} from "lucide-react";

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  billable: boolean;
  status: string;
  projectId: string | null;
  taskId: string | null;
  notes: string | null;
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
  employee: {
    id: string;
    name: string;
    email: string | null;
    photoUrl: string | null;
    department: string;
  } | null;
}

interface Stats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  totalHours: number;
}

interface Employee {
  id: string;
  name: string;
  email: string | null;
  photoUrl: string | null;
  department: string;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateFR(date: Date): string {
  return date.toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminTimesheetsPage() {
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState<WeeklyTimesheet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected timesheet for detail view
  const [selectedTimesheet, setSelectedTimesheet] = useState<WeeklyTimesheet | null>(null);
  
  // Action modal
  const [actionModal, setActionModal] = useState<{
    type: "approve" | "reject" | "reset" | null;
    timesheet: WeeklyTimesheet | null;
  }>({ type: null, timesheet: null });
  const [actionNotes, setActionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Edit entry modal
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    fetchTimesheets();
  }, [statusFilter, employeeFilter]);

  async function fetchTimesheets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (employeeFilter) params.append("employeeId", employeeFilter);
      
      const res = await fetch(`/api/admin/timesheets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTimesheets(data.timesheets);
        setStats(data.stats);
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error("Error fetching timesheets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: "approve" | "reject" | "reset", timesheet: WeeklyTimesheet) {
    try {
      const res = await fetch("/api/admin/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timesheetId: timesheet.id,
          action,
          adminName: "Admin",
          adminNotes: actionNotes,
          rejectionReason: action === "reject" ? rejectionReason : undefined,
        }),
      });
      
      if (res.ok) {
        setActionModal({ type: null, timesheet: null });
        setActionNotes("");
        setRejectionReason("");
        fetchTimesheets();
        if (selectedTimesheet?.id === timesheet.id) {
          const updated = await res.json();
          setSelectedTimesheet(updated);
        }
      }
    } catch (error) {
      console.error("Error performing action:", error);
    }
  }

  async function handleUpdateEntry(entry: TimeEntry) {
    try {
      const startTime = new Date(entry.startTime);
      const endTime = entry.endTime ? new Date(entry.endTime) : null;
      const duration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : null;

      await fetch("/api/admin/timesheets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: entry.id,
          description: entry.description,
          startTime: startTime.toISOString(),
          endTime: endTime?.toISOString(),
          duration,
          billable: entry.billable,
          notes: entry.notes,
        }),
      });
      
      setEditingEntry(null);
      fetchTimesheets();
    } catch (error) {
      console.error("Error updating entry:", error);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) return;
    
    try {
      await fetch(`/api/admin/timesheets?entryId=${entryId}`, {
        method: "DELETE",
      });
      fetchTimesheets();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  }

  const filteredTimesheets = timesheets.filter(ts => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ts.employee?.name.toLowerCase().includes(query) ||
        ts.employee?.email?.toLowerCase().includes(query) ||
        ts.employee?.department.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">Approuvée</span>;
      case "submitted":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">Soumise</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">Rejetée</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-slate-500/20 text-slate-400 rounded-full">Brouillon</span>;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Feuilles de temps</h1>
              <p className="text-muted-foreground mt-1">Gérer et approuver les feuilles de temps des employés</p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.submitted}</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                    <p className="text-xs text-muted-foreground">Approuvées</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                    <p className="text-xs text-muted-foreground">Rejetées</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-500/20 rounded-lg">
                    <Edit2 className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
                    <p className="text-xs text-muted-foreground">Brouillons</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalHours.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">Total heures</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher un employé..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg text-foreground"
              >
                <option value="">Tous les statuts</option>
                <option value="submitted">En attente</option>
                <option value="approved">Approuvées</option>
                <option value="rejected">Rejetées</option>
                <option value="draft">Brouillons</option>
              </select>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg text-foreground"
              >
                <option value="">Tous les employés</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timesheets List */}
            <div className="lg:col-span-2 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredTimesheets.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Aucune feuille de temps trouvée</p>
                </div>
              ) : (
                filteredTimesheets.map(ts => (
                  <div
                    key={ts.id}
                    onClick={() => setSelectedTimesheet(ts)}
                    className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 ${
                      selectedTimesheet?.id === ts.id ? "border-primary" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {ts.employee?.photoUrl ? (
                          <img
                            src={ts.employee.photoUrl}
                            alt={ts.employee.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{ts.employee?.name || "Employé inconnu"}</p>
                          <p className="text-sm text-muted-foreground">{ts.employee?.department}</p>
                        </div>
                      </div>
                      {getStatusBadge(ts.status)}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateFR(new Date(ts.weekStartDate))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {ts.totalHours.toFixed(1)}h
                        </span>
                      </div>
                      {ts.status === "submitted" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionModal({ type: "approve", timesheet: ts });
                            }}
                            className="px-3 py-1 text-sm bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30"
                          >
                            Approuver
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionModal({ type: "reject", timesheet: ts });
                            }}
                            className="px-3 py-1 text-sm bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              {selectedTimesheet ? (
                <div className="bg-card border border-border rounded-xl p-6 sticky top-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Détails</h3>
                    <button
                      onClick={() => setSelectedTimesheet(null)}
                      className="p-1 rounded-lg hover:bg-muted"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {selectedTimesheet.employee?.photoUrl ? (
                        <img
                          src={selectedTimesheet.employee.photoUrl}
                          alt={selectedTimesheet.employee.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{selectedTimesheet.employee?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedTimesheet.employee?.department}</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Semaine</p>
                          <p className="font-medium text-foreground">
                            {formatDateFR(new Date(selectedTimesheet.weekStartDate))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total heures</p>
                          <p className="font-medium text-foreground">{selectedTimesheet.totalHours.toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Statut</p>
                          {getStatusBadge(selectedTimesheet.status)}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Entrées</p>
                          <p className="font-medium text-foreground">{selectedTimesheet.entries.length}</p>
                        </div>
                      </div>
                    </div>

                    {selectedTimesheet.notes && (
                      <div className="border-t border-border pt-4">
                        <p className="text-sm text-muted-foreground mb-1">Notes de l'employé</p>
                        <p className="text-sm text-foreground">{selectedTimesheet.notes}</p>
                      </div>
                    )}

                    {selectedTimesheet.rejectionReason && (
                      <div className="border-t border-border pt-4">
                        <p className="text-sm text-red-500 mb-1">Raison du rejet</p>
                        <p className="text-sm text-foreground">{selectedTimesheet.rejectionReason}</p>
                      </div>
                    )}

                    {/* Entries */}
                    <div className="border-t border-border pt-4">
                      <p className="text-sm font-medium text-foreground mb-3">Entrées de temps</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedTimesheet.entries.map(entry => (
                          <div
                            key={entry.id}
                            className="p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {entry.description || "Sans description"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(entry.startTime).toLocaleDateString("fr-CA", { weekday: "short", day: "numeric" })}
                                  {" • "}
                                  {entry.duration ? `${(entry.duration / 60).toFixed(1)}h` : "-"}
                                  {entry.billable && " • Facturable"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingEntry(entry)}
                                  className="p-1 rounded hover:bg-muted"
                                >
                                  <Edit2 className="w-3 h-3 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  className="p-1 rounded hover:bg-red-500/20"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-border pt-4 flex flex-wrap gap-2">
                      {selectedTimesheet.status === "submitted" && (
                        <>
                          <button
                            onClick={() => setActionModal({ type: "approve", timesheet: selectedTimesheet })}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                          >
                            <CheckCheck className="w-4 h-4" />
                            Approuver
                          </button>
                          <button
                            onClick={() => setActionModal({ type: "reject", timesheet: selectedTimesheet })}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeter
                          </button>
                        </>
                      )}
                      {(selectedTimesheet.status === "approved" || selectedTimesheet.status === "rejected") && (
                        <button
                          onClick={() => setActionModal({ type: "reset", timesheet: selectedTimesheet })}
                          className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Réinitialiser
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Sélectionnez une feuille de temps pour voir les détails</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Modal */}
        {actionModal.type && actionModal.timesheet && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {actionModal.type === "approve" && "Approuver la feuille de temps"}
                {actionModal.type === "reject" && "Rejeter la feuille de temps"}
                {actionModal.type === "reset" && "Réinitialiser la feuille de temps"}
              </h3>
              
              <div className="space-y-4">
                {actionModal.type === "reject" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Raison du rejet *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Expliquez la raison du rejet..."
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                      rows={3}
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Ajoutez des notes..."
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setActionModal({ type: null, timesheet: null });
                    setActionNotes("");
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (actionModal.type === "reject" && !rejectionReason) {
                      alert("Veuillez indiquer une raison de rejet");
                      return;
                    }
                    handleAction(actionModal.type!, actionModal.timesheet!);
                  }}
                  className={`px-4 py-2 rounded-lg text-white ${
                    actionModal.type === "approve" ? "bg-green-500 hover:bg-green-600" :
                    actionModal.type === "reject" ? "bg-red-500 hover:bg-red-600" :
                    "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Entry Modal */}
        {editingEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-foreground mb-4">Modifier l'entrée</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <input
                    type="text"
                    value={editingEntry.description || ""}
                    onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Début</label>
                    <input
                      type="datetime-local"
                      value={editingEntry.startTime.slice(0, 16)}
                      onChange={(e) => setEditingEntry({ ...editingEntry, startTime: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Fin</label>
                    <input
                      type="datetime-local"
                      value={editingEntry.endTime?.slice(0, 16) || ""}
                      onChange={(e) => setEditingEntry({ ...editingEntry, endTime: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingEntry.billable}
                      onChange={(e) => setEditingEntry({ ...editingEntry, billable: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">Facturable</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateEntry(editingEntry)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
