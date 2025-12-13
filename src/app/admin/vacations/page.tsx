"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Palmtree,
  Search,
  Check,
  X,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  MessageSquare,
  Filter,
  ChevronDown,
  Edit,
  Trash2,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  photoUrl: string | null;
  department: string;
  role: string | null;
}

interface VacationRequest {
  id: string;
  employeeId: string;
  employee: Employee;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  createdAt: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const typeLabels: Record<string, string> = {
  vacation: "Vacances",
  sick: "Maladie",
  personal: "Personnel",
  unpaid: "Sans solde",
  other: "Autre",
};

const typeColors: Record<string, string> = {
  vacation: "bg-emerald-500/10 text-emerald-400",
  sick: "bg-red-500/10 text-red-400",
  personal: "bg-blue-500/10 text-blue-400",
  unpaid: "bg-amber-500/10 text-amber-400",
  other: "bg-slate-500/10 text-slate-400",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
  cancelled: "Annulée",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export default function VacationsAdminPage() {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Modal de réponse
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [responseAction, setResponseAction] = useState<"approve" | "reject">("approve");
  const [responseComment, setResponseComment] = useState("");

  // Modal de modification
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    type: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
    status: "pending",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, departmentFilter]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (departmentFilter !== "all") params.set("department", departmentFilter);
      
      const res = await fetch(`/api/admin/vacations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Error fetching vacation requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const openResponseModal = (request: VacationRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setResponseAction(action);
    setResponseComment("");
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedRequest) return;
    
    setProcessing(selectedRequest.id);
    try {
      const res = await fetch("/api/admin/vacations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: responseAction,
          comment: responseComment,
        }),
      });

      if (res.ok) {
        setShowResponseModal(false);
        fetchRequests();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors du traitement");
      }
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setProcessing(null);
    }
  };

  const quickAction = async (requestId: string, action: "approve" | "reject") => {
    setProcessing(requestId);
    try {
      const res = await fetch("/api/admin/vacations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setProcessing(null);
    }
  };

  const openEditModal = (request: VacationRequest) => {
    setSelectedRequest(request);
    setEditFormData({
      type: request.type,
      startDate: request.startDate.split("T")[0],
      endDate: request.endDate.split("T")[0],
      reason: request.reason || "",
      status: request.status,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedRequest) return;

    setProcessing(selectedRequest.id);
    try {
      const res = await fetch(`/api/admin/vacations/${selectedRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchRequests();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Error updating vacation:", error);
      alert("Erreur lors de la modification");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteRequestId) return;

    setProcessing(deleteRequestId);
    try {
      const res = await fetch(`/api/admin/vacations/${deleteRequestId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        setDeleteRequestId(null);
        fetchRequests();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting vacation:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      req.employee.name.toLowerCase().includes(searchLower) ||
      (req.employee.email && req.employee.email.toLowerCase().includes(searchLower)) ||
      req.employee.department.toLowerCase().includes(searchLower)
    );
  });

  const departments = [...new Set(requests.map((r) => r.employee.department))];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Palmtree className="w-8 h-8 text-emerald-500" />
              Gestion des vacances
            </h1>
            <p className="text-muted-foreground mt-1">
              Approuvez ou refusez les demandes de congés des employés
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approuvées</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                  <p className="text-sm text-muted-foreground">Refusées</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou département..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Refusées</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">Tous les départements</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full" role="table" aria-label="Liste des demandes de vacances">
            <thead className="bg-muted/50 border-b border-border">
              <tr role="row">
                <th scope="col" className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Employé</th>
                <th scope="col" className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Type</th>
                <th scope="col" className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Période</th>
                <th scope="col" className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Jours</th>
                <th scope="col" className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th scope="col" className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Raison</th>
                <th scope="col" className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.map((req) => (
                <tr key={req.id} role="row" className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {req.employee.photoUrl ? (
                        <img
                          src={req.employee.photoUrl}
                          alt={req.employee.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {req.employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{req.employee.name}</p>
                        <p className="text-sm text-muted-foreground">{req.employee.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[req.type] || typeColors.other}`}>
                      {typeLabels[req.type] || req.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(req.startDate).toLocaleDateString("fr-FR")} - {new Date(req.endDate).toLocaleDateString("fr-FR")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {req.totalDays} jour{req.totalDays > 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[req.status]}`}>
                      {req.status === "pending" && <Clock className="w-3 h-3" />}
                      {req.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                      {req.status === "rejected" && <XCircle className="w-3 h-3" />}
                      {statusLabels[req.status] || req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                    {req.reason || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === "pending" && (
                        <>
                        <button
                          onClick={() => openResponseModal(req, "approve")}
                          disabled={processing === req.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          aria-label={`Approuver la demande de vacances de ${req.employee.name}`}
                        >
                          {processing === req.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Check className="w-4 h-4" aria-hidden="true" />
                          )}
                          <span>Approuver</span>
                        </button>
                        <button
                          onClick={() => openResponseModal(req, "reject")}
                          disabled={processing === req.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          aria-label={`Refuser la demande de vacances de ${req.employee.name}`}
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                          <span>Refuser</span>
                        </button>
                        </>
                      )}
                      <button
                        onClick={() => openEditModal(req)}
                        disabled={processing === req.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label={`Modifier la demande de vacances de ${req.employee.name}`}
                        title="Modifier"
                      >
                        {processing === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Edit className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteRequestId(req.id);
                          setShowDeleteConfirm(true);
                        }}
                        disabled={processing === req.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        aria-label={`Supprimer la demande de vacances de ${req.employee.name}`}
                        title="Supprimer"
                      >
                        {processing === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>Supprimer</span>
                      </button>
                      {req.status !== "pending" && (
                        <div className="text-xs text-muted-foreground ml-2">
                          {req.reviewedByName && (
                            <p>Par {req.reviewedByName}</p>
                          )}
                          {req.reviewedAt && (
                            <p>{new Date(req.reviewedAt).toLocaleDateString("fr-FR")}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Palmtree className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune demande de vacances</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {showEditModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-400" />
                  Modifier la demande de vacances
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Employee Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {selectedRequest.employee.photoUrl ? (
                      <img
                        src={selectedRequest.employee.photoUrl}
                        alt={selectedRequest.employee.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{selectedRequest.employee.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedRequest.employee.department}</p>
                    </div>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Type de congé
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="vacation">Vacances</option>
                    <option value="sick">Maladie</option>
                    <option value="personal">Personnel</option>
                    <option value="unpaid">Sans solde</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Statut
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvée</option>
                    <option value="rejected">Refusée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Raison
                  </label>
                  <textarea
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                    rows={3}
                    placeholder="Raison du congé..."
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={processing === selectedRequest.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {processing === selectedRequest.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Edit className="w-4 h-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  Supprimer la demande
                </h2>
              </div>
              <div className="p-6">
                <p className="text-foreground mb-4">
                  Êtes-vous sûr de vouloir supprimer cette demande de vacances ? Cette action est irréversible.
                </p>
                {deleteRequestId && requests.find(r => r.id === deleteRequestId)?.status === "approved" && (
                  <p className="text-sm text-amber-400 mb-4">
                    ⚠️ Cette demande est approuvée. Les jours seront déduits du solde de l'employé.
                  </p>
                )}
              </div>
              <div className="p-6 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteRequestId(null);
                  }}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={processing === deleteRequestId}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {processing === deleteRequestId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  {responseAction === "approve" ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Approuver la demande
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      Refuser la demande
                    </>
                  )}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Request Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    {selectedRequest.employee.photoUrl ? (
                      <img
                        src={selectedRequest.employee.photoUrl}
                        alt={selectedRequest.employee.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{selectedRequest.employee.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedRequest.employee.department}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{typeLabels[selectedRequest.type]}</span> du{" "}
                      {new Date(selectedRequest.startDate).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(selectedRequest.endDate).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Durée: <span className="font-medium text-foreground">{selectedRequest.totalDays} jour{selectedRequest.totalDays > 1 ? "s" : ""}</span>
                    </p>
                    {selectedRequest.reason && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Raison: {selectedRequest.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Commentaire {responseAction === "reject" ? "(recommandé)" : "(optionnel)"}
                  </label>
                  <textarea
                    value={responseComment}
                    onChange={(e) => setResponseComment(e.target.value)}
                    rows={3}
                    placeholder={responseAction === "reject" ? "Expliquez la raison du refus..." : "Ajoutez un commentaire..."}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={submitResponse}
                  disabled={processing === selectedRequest.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    responseAction === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {processing === selectedRequest.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : responseAction === "approve" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {responseAction === "approve" ? "Approuver" : "Refuser"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
