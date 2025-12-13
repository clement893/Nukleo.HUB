"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, Edit, Trash2, Building2, Mail, Phone } from "lucide-react";
import { toast } from "@/lib/toast";

interface Supplier {
  id: string;
  name: string;
  type: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  website: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { contracts: number };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchSuppliers();
  }, [typeFilter]);

  async function fetchSuppliers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      params.append("isActive", "true");

      const res = await fetch(`/api/admin/suppliers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des fournisseurs");
    } finally {
      setLoading(false);
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        supplier.name.toLowerCase().includes(search) ||
        supplier.contactName?.toLowerCase().includes(search) ||
        supplier.email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  function getTypeLabel(type: string) {
    switch (type) {
      case "supplier":
        return "Fournisseur";
      case "subcontractor":
        return "Sous-traitant";
      case "partner":
        return "Partenaire";
      default:
        return type;
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case "supplier":
        return "bg-blue-500/20 text-blue-400";
      case "subcontractor":
        return "bg-purple-500/20 text-purple-400";
      case "partner":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fournisseurs et sous-traitants</h1>
          <p className="text-gray-400 mt-1">Gérez vos partenaires commerciaux</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau fournisseur
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Tous les types</option>
          <option value="supplier">Fournisseur</option>
          <option value="subcontractor">Sous-traitant</option>
          <option value="partner">Partenaire</option>
        </select>
      </div>

      {/* Liste des fournisseurs */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun fournisseur</h3>
          <p className="text-gray-400">Ajoutez votre premier fournisseur pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{supplier.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${getTypeColor(supplier.type)}`}>
                    {getTypeLabel(supplier.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                {supplier.contactName && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {supplier.contactName}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {supplier.email}
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {supplier.phone}
                  </div>
                )}
                {supplier.website && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                      {supplier.website}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm text-gray-500">
                <span>{supplier._count.contracts} contrat(s)</span>
                <span>{new Date(supplier.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
