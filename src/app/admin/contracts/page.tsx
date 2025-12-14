"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Clock,
  XCircle,
  Download,
  Edit,
  Trash2,
  PenTool,
  Building2,
  Users,
  AlertCircle,
} from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";
import { toast } from "@/lib/toast";

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  signatureDeadline: string | null;
  totalAmount: number | null;
  currency: string;
  requiresSignature: boolean;
  signedByClient: boolean;
  signedBySupplier: boolean;
  signedByAgency: boolean;
  company: { id: string; name: string; logoUrl: string | null } | null;
  supplier: { id: string; name: string; type: string } | null;
  template: { id: string; name: string; category: string } | null;
  signatures: Array<{ id: string; signerName: string; signedAt: string }>;
  _count: { signatures: number; renewals: number; amendments: number };
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState<"client" | "supplier" | "agency">("agency");

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, categoryFilter]);

  async function fetchContracts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/admin/contracts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContracts(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des contrats");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignatureSave(signatureData: string) {
    if (!selectedContract) return;

    try {
      const res = await fetch(`/api/admin/contracts/${selectedContract.id}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerType: signatureType,
          signerName: "Nukleo Agency", // À remplacer par le nom de l'employé connecté
          signatureData,
          signatureMethod: "draw",
        }),
      });

      if (res.ok) {
        toast.success("Signature ajoutée avec succès");
        setShowSignaturePad(false);
        setSelectedContract(null);
        fetchContracts();
      } else {
        toast.error("Erreur lors de l'ajout de la signature");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'ajout de la signature");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "pending_signature":
        return "bg-yellow-500/20 text-yellow-400";
      case "expired":
        return "bg-red-500/20 text-red-400";
      case "draft":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "active":
        return "Actif";
      case "pending_signature":
        return "En attente de signature";
      case "expired":
        return "Expiré";
      case "draft":
        return "Brouillon";
      case "terminated":
        return "Résilié";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  }

  function getDaysUntilExpiry(endDate: string | null) {
    if (!endDate) return null;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  const filteredContracts = contracts.filter((contract) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        contract.title.toLowerCase().includes(search) ||
        contract.contractNumber.toLowerCase().includes(search) ||
        contract.company?.name.toLowerCase().includes(search) ||
        contract.supplier?.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des contrats</h1>
          <p className="text-gray-400 mt-1">Gérez vos contrats clients et fournisseurs</p>
        </div>
        <button
          onClick={() => setShowContractModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau contrat
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un contrat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="pending_signature">En attente de signature</option>
          <option value="active">Actif</option>
          <option value="expired">Expiré</option>
          <option value="terminated">Résilié</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Toutes les catégories</option>
          <option value="client">Client</option>
          <option value="supplier">Fournisseur</option>
          <option value="subcontractor">Sous-traitant</option>
          <option value="nda">NDA</option>
          <option value="service">Service</option>
        </select>
      </div>

      {/* Liste des contrats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun contrat</h3>
          <p className="text-gray-400">Créez votre premier contrat pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredContracts.map((contract) => {
            const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
            const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

            return (
              <div
                key={contract.id}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{contract.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(contract.status)}`}>
                        {getStatusLabel(contract.status)}
                      </span>
                      {isExpiringSoon && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400">
                          <AlertCircle className="w-3 h-3" />
                          Expire dans {daysUntilExpiry} jours
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span className="font-mono">{contract.contractNumber}</span>
                      {contract.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {contract.company.name}
                        </span>
                      )}
                      {contract.supplier && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {contract.supplier.name}
                        </span>
                      )}
                      {contract.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Échéance: {new Date(contract.endDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>

                    {contract.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{contract.description}</p>
                    )}

                    {/* Signatures */}
                    {contract.requiresSignature && (
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm text-gray-400">Signatures:</span>
                        <div className="flex items-center gap-2">
                          {contract.signedByClient && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              Client ✓
                            </span>
                          )}
                          {contract.signedBySupplier && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              Fournisseur ✓
                            </span>
                          )}
                          {contract.signedByAgency && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              Agence ✓
                            </span>
                          )}
                          {!contract.signedByClient && !contract.signedBySupplier && !contract.signedByAgency && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                              En attente
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Statistiques */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{contract._count.signatures} signature(s)</span>
                      <span>{contract._count.renewals} renouvellement(s)</span>
                      <span>{contract._count.amendments} amendement(s)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {contract.status === "pending_signature" && !contract.signedByAgency && (
                      <button
                        onClick={() => {
                          setSelectedContract(contract);
                          setSignatureType("agency");
                          setShowSignaturePad(true);
                        }}
                        className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                        title="Signer le contrat"
                      >
                        <PenTool className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Signature */}
      {showSignaturePad && selectedContract && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <SignaturePad
            onSave={handleSignatureSave}
            onCancel={() => {
              setShowSignaturePad(false);
              setSelectedContract(null);
            }}
            signerName="Nukleo Agency"
          />
        </div>
      )}
    </div>
  );
}
