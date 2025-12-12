"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  amount: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Informations client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  
  // Informations facture
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  });
  
  // Lignes de facture
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, unit: "unité", amount: 0 },
  ]);
  
  // Montants
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxRate, setTaxRate] = useState(14.975);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Paiement dû dans les 30 jours suivant la date de facturation.");

  useEffect(() => {
    // Charger les clients existants
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => {
        const clientList = data.map((c: { id: string; name: string; email?: string }) => ({
          id: c.id,
          name: c.name,
          email: c.email || "",
          company: c.name,
        }));
        setClients(clientList);
      })
      .catch(console.error);
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        unit: "unité",
        amount: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            updated.amount = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Calculs
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  const handleSave = async (sendAfterSave: boolean = false) => {
    if (!clientName || !title || items.every((i) => !i.description)) {
      alert("Veuillez remplir les champs obligatoires");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientCompany,
          clientAddress,
          clientPhone,
          title,
          description,
          dueDate,
          items: items.filter((i) => i.description),
          discountPercent,
          taxRate: taxRate / 100,
          notes,
          terms,
        }),
      });

      if (response.ok) {
        const invoice = await response.json();
        
        if (sendAfterSave) {
          // Marquer comme envoyée
          await fetch(`/api/invoices/${invoice.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "sent" }),
          });
        }
        
        router.push(`/billing/invoices/${invoice.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const selectClient = (client: Client) => {
    setClientName(client.name);
    setClientEmail(client.email);
    setClientCompany(client.company);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Nouvelle facture</h1>
                <p className="text-sm text-muted-foreground">Créez une nouvelle facture</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Save className="h-4 w-4" />
                Enregistrer brouillon
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Send className="h-4 w-4" />
                Enregistrer et envoyer
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="col-span-2 space-y-6">
              {/* Informations client */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Informations client</h2>
                
                {clients.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Sélectionner un client existant
                    </label>
                    <select
                      onChange={(e) => {
                        const client = clients.find((c) => c.id === e.target.value);
                        if (client) selectClient(client);
                      }}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">-- Nouveau client --</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.company || client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Nom du contact *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Entreprise
                    </label>
                    <input
                      type="text"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="jean@acme.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="514-555-0123"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Adresse
                    </label>
                    <textarea
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="123 rue Principale, Montréal, QC H2X 1Y6"
                    />
                  </div>
                </div>
              </div>

              {/* Détails facture */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Détails de la facture</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Titre *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Services de consultation - Décembre 2024"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Description détaillée des services..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Date d&apos;échéance *
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* Lignes de facture */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Lignes de facture</h2>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une ligne
                  </button>
                </div>

                <div className="space-y-3">
                  {/* En-tête */}
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Quantité</div>
                    <div className="col-span-2">Prix unitaire</div>
                    <div className="col-span-2 text-right">Montant</div>
                    <div className="col-span-1"></div>
                  </div>

                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="Description du service..."
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.5"
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-1.5 text-muted-foreground hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes et conditions */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Notes et conditions</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Notes additionnelles pour le client..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Conditions de paiement
                    </label>
                    <textarea
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne résumé */}
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Résumé</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Remise</span>
                      <input
                        type="number"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="w-16 px-2 py-1 text-center bg-muted/50 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <span className="text-red-500">-{formatCurrency(discountAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Taxes</span>
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.001"
                        className="w-20 px-2 py-1 text-center bg-muted/50 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    TPS (5%) + TVQ (9.975%) = 14.975%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
