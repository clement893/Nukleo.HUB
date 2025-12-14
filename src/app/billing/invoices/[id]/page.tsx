"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Edit,
  Send,
  Download,
  DollarSign,
  FileText,
  Mail,
  Phone,
  MapPin,
  Building,
  Plus,
  Trash2,
  X,
  Bell,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  amount: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
}

interface Reminder {
  id: string;
  type: string;
  sentAt: string;
  level: number;
  message: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  clientPhone: string | null;
  title: string;
  description: string | null;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  items: InvoiceItem[];
  payments: Payment[];
  reminders: Reminder[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Brouillon", color: "text-gray-600", bgColor: "bg-gray-100" },
  sent: { label: "Envoyée", color: "text-blue-600", bgColor: "bg-blue-100" },
  viewed: { label: "Vue", color: "text-cyan-600", bgColor: "bg-cyan-100" },
  partial: { label: "Paiement partiel", color: "text-orange-600", bgColor: "bg-orange-100" },
  paid: { label: "Payée", color: "text-green-600", bgColor: "bg-green-100" },
  overdue: { label: "En retard", color: "text-red-600", bgColor: "bg-red-100" },
  cancelled: { label: "Annulée", color: "text-gray-500", bgColor: "bg-gray-100" },
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showPaymentModal = searchParams.get("payment") === "true";

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(showPaymentModal);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("virement");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
        setPaymentAmount(data.amountDue.toString());
      } else {
        router.push("/billing/invoices");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchInvoice();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }

    setSavingPayment(true);
    try {
      const response = await fetch(`/api/invoices/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          paymentMethod,
          reference: paymentReference || null,
          notes: paymentNotes || null,
        }),
      });

      if (response.ok) {
        setPaymentModalOpen(false);
        setPaymentAmount("");
        setPaymentReference("");
        setPaymentNotes("");
        fetchInvoice();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Supprimer ce paiement ?")) return;

    try {
      const response = await fetch(`/api/invoices/${id}/payments?paymentId=${paymentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchInvoice();
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
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
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const isOverdue = invoice.status === "overdue" || (new Date(invoice.dueDate) < new Date() && invoice.amountDue > 0);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/billing/invoices")}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground font-mono">
                    {invoice.invoiceNumber}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{invoice.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {invoice.status === "draft" && (
                <button
                  onClick={() => handleStatusChange("sent")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Marquer envoyée
                </button>
              )}
              {["sent", "viewed", "partial", "overdue"].includes(invoice.status) && (
                <>
                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <DollarSign className="h-4 w-4" />
                    Enregistrer paiement
                  </button>
                  {isOverdue && (
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                      Envoyer relance
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => router.push(`/billing/invoices/${id}?edit=true`)}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                <Download className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6">
            {/* Colonne principale - Facture */}
            <div className="col-span-2 space-y-6">
              {/* Aperçu facture */}
              <div className="glass-card rounded-xl p-8 bg-white dark:bg-gray-900">
                {/* En-tête */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b border-border">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">FACTURE</h2>
                    <p className="text-lg font-mono text-muted-foreground">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">Nukleo</p>
                    <p className="text-sm text-muted-foreground">Montréal, QC</p>
                    <p className="text-sm text-muted-foreground">info@nukleo.ca</p>
                  </div>
                </div>

                {/* Informations */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">FACTURER À</p>
                    <p className="font-semibold text-foreground">{invoice.clientCompany || invoice.clientName}</p>
                    {invoice.clientCompany && (
                      <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                    )}
                    {invoice.clientEmail && (
                      <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
                    )}
                    {invoice.clientPhone && (
                      <p className="text-sm text-muted-foreground">{invoice.clientPhone}</p>
                    )}
                    {invoice.clientAddress && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.clientAddress}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground">Date d&apos;émission</p>
                      <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date d&apos;échéance</p>
                      <p className={`font-medium ${isOverdue ? "text-red-500" : ""}`}>
                        {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lignes */}
                <table className="w-full mb-6">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Description</th>
                      <th className="text-center py-3 text-sm font-medium text-muted-foreground w-24">Qté</th>
                      <th className="text-right py-3 text-sm font-medium text-muted-foreground w-32">Prix unit.</th>
                      <th className="text-right py-3 text-sm font-medium text-muted-foreground w-32">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-3 text-foreground">{item.description}</td>
                        <td className="py-3 text-center text-muted-foreground">{item.quantity}</td>
                        <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totaux */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remise ({invoice.discountPercent}%)</span>
                        <span className="text-red-500">-{formatCurrency(invoice.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes ({(invoice.taxRate * 100).toFixed(3)}%)</span>
                      <span>{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
                    </div>
                    {invoice.amountPaid > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Payé</span>
                          <span>-{formatCurrency(invoice.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-semibold">Solde dû</span>
                          <span className={`font-bold text-lg ${invoice.amountDue > 0 ? "text-orange-500" : "text-green-500"}`}>
                            {formatCurrency(invoice.amountDue)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {(invoice.notes || invoice.terms) && (
                  <div className="mt-8 pt-6 border-t border-border">
                    {invoice.notes && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm text-foreground">{invoice.notes}</p>
                      </div>
                    )}
                    {invoice.terms && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Conditions</p>
                        <p className="text-sm text-foreground">{invoice.terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Résumé */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Résumé</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payé</span>
                    <span className="text-green-500">{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-medium">Solde dû</span>
                    <span className={`font-bold ${invoice.amountDue > 0 ? "text-orange-500" : "text-green-500"}`}>
                      {formatCurrency(invoice.amountDue)}
                    </span>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progression</span>
                    <span>{Math.round((invoice.amountPaid / invoice.total) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(invoice.amountPaid / invoice.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Client */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Client</h3>
                <div className="space-y-3">
                  {invoice.clientCompany && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{invoice.clientCompany}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{invoice.clientName}</span>
                  </div>
                  {invoice.clientEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${invoice.clientEmail}`} className="text-primary hover:underline">
                        {invoice.clientEmail}
                      </a>
                    </div>
                  )}
                  {invoice.clientPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{invoice.clientPhone}</span>
                    </div>
                  )}
                  {invoice.clientAddress && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="whitespace-pre-line">{invoice.clientAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Paiements */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Paiements</h3>
                  {invoice.amountDue > 0 && (
                    <button
                      onClick={() => setPaymentModalOpen(true)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {invoice.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
                ) : (
                  <div className="space-y-3">
                    {invoice.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium text-green-500">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="p-1 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Relances */}
              {invoice.reminders.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4">Relances</h3>
                  <div className="space-y-2">
                    {invoice.reminders.map((reminder) => (
                      <div key={reminder.id} className="text-sm p-2 bg-muted/30 rounded">
                        <p className="text-muted-foreground">
                          Niveau {reminder.level} • {formatDate(reminder.sentAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal paiement */}
        {paymentModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Enregistrer un paiement</h3>
                <button onClick={() => setPaymentModalOpen(false)} className="p-1 hover:bg-muted rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Montant *
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={invoice.amountDue}
                    step="0.01"
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Solde dû: {formatCurrency(invoice.amountDue)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Méthode de paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="carte">Carte de crédit</option>
                    <option value="especes">Espèces</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Référence (optionnel)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="N° de transaction, chèque..."
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={savingPayment}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {savingPayment ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
