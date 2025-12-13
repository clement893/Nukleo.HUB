"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Send,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string | null;
  title: string;
  issueDate: string;
  dueDate: string;
  status: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  _count?: {
    reminders: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Brouillon", color: "bg-gray-500", icon: FileText },
  sent: { label: "Envoyée", color: "bg-blue-500", icon: Send },
  viewed: { label: "Vue", color: "bg-cyan-500", icon: Eye },
  partial: { label: "Partiel", color: "bg-orange-500", icon: DollarSign },
  paid: { label: "Payée", color: "bg-green-500", icon: CheckCircle },
  overdue: { label: "En retard", color: "bg-red-500", icon: AlertTriangle },
  cancelled: { label: "Annulée", color: "bg-gray-400", icon: XCircle },
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/invoices?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;

    try {
      const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (response.ok) {
        setInvoices(invoices.filter((inv) => inv.id !== id));
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
    setActionMenuId(null);
  };

  const formatCurrency = (amount: number, currency: string = "CAD") => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // Statistiques rapides
  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter((inv) => inv.status === "paid").length,
    paidAmount: invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices.filter((inv) => inv.status === "overdue").length,
    overdueAmount: invoices.filter((inv) => inv.status === "overdue").reduce((sum, inv) => sum + inv.amountDue, 0),
    pending: invoices.filter((inv) => ["sent", "viewed", "partial"].includes(inv.status)).length,
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto ml-64">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Factures</h1>
              <p className="text-sm text-muted-foreground">Gérez vos factures et suivez les paiements</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/billing")}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Tableau de bord
              </button>
              <button
                onClick={() => router.push("/billing/invoices/new")}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nouvelle facture
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Statistiques rapides */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total factures</p>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payées</p>
                  <p className="text-xl font-bold text-foreground">{stats.paid}</p>
                  <p className="text-xs text-green-500">{formatCurrency(stats.paidAmount)}</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-xl font-bold text-foreground">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En retard</p>
                  <p className="text-xl font-bold text-foreground">{stats.overdue}</p>
                  <p className="text-xs text-red-500">{formatCurrency(stats.overdueAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex items-center gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client, titre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </form>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters ? "bg-primary text-white border-primary" : "border-border hover:bg-muted"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>
            <button
              onClick={fetchInvoices}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="glass-card rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Tous" },
                  { value: "draft", label: "Brouillons" },
                  { value: "sent", label: "Envoyées" },
                  { value: "partial", label: "Partielles" },
                  { value: "paid", label: "Payées" },
                  { value: "overdue", label: "En retard" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      statusFilter === option.value
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Liste des factures */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune facture</h3>
              <p className="text-muted-foreground mb-4">Créez votre première facture pour commencer</p>
              <button
                onClick={() => router.push("/billing/invoices/new")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Nouvelle facture
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Numéro</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Échéance</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Statut</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Montant</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Dû</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                    const StatusIcon = statusConfig.icon;
                    const daysOverdue = invoice.status === "overdue" ? getDaysOverdue(invoice.dueDate) : 0;

                    return (
                      <tr
                        key={invoice.id}
                        className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-foreground">
                            {invoice.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{invoice.clientCompany || invoice.clientName}</p>
                            {invoice.clientCompany && (
                              <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${daysOverdue > 0 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                            {formatDate(invoice.dueDate)}
                            {daysOverdue > 0 && (
                              <span className="block text-xs">+{daysOverdue} jours</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-white ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={invoice.amountDue > 0 ? "text-orange-500 font-medium" : "text-green-500"}>
                            {formatCurrency(invoice.amountDue, invoice.currency)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuId(actionMenuId === invoice.id ? null : invoice.id);
                              }}
                              className="p-1 rounded hover:bg-muted"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {actionMenuId === invoice.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/billing/invoices/${invoice.id}`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                >
                                  <Eye className="h-4 w-4" /> Voir
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/billing/invoices/${invoice.id}?edit=true`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                >
                                  <Edit className="h-4 w-4" /> Modifier
                                </button>
                                {invoice.status === "draft" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(invoice.id, "sent");
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-blue-500"
                                  >
                                    <Send className="h-4 w-4" /> Marquer envoyée
                                  </button>
                                )}
                                {["sent", "viewed", "partial", "overdue"].includes(invoice.status) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/billing/invoices/${invoice.id}?payment=true`);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-green-500"
                                  >
                                    <DollarSign className="h-4 w-4" /> Enregistrer paiement
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Générer PDF
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                >
                                  <Download className="h-4 w-4" /> Télécharger PDF
                                </button>
                                {invoice.status !== "paid" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(invoice.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" /> Supprimer
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
