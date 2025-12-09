"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import CompanyCard from "@/components/CompanyCard";
import CompanyModal from "@/components/CompanyModal";
import { Company } from "@/types/company";
import {
  Search,
  Building2,
  Grid3X3,
  List,
  Filter,
  Star,
  Globe,
  Users,
} from "lucide-react";

export default function EntreprisesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [showClientsOnly, setShowClientsOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const types = useMemo(() => {
    const uniqueTypes = new Set(companies.map((c) => c.type).filter(Boolean));
    return Array.from(uniqueTypes).sort();
  }, [companies]);

  const industries = useMemo(() => {
    const uniqueIndustries = new Set(companies.map((c) => c.industry).filter(Boolean));
    return Array.from(uniqueIndustries).sort();
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch =
        !searchQuery ||
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.website?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.mainContactName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = !selectedType || company.type === selectedType;
      const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry;
      const matchesClient = !showClientsOnly || company.isClient;

      return matchesSearch && matchesType && matchesIndustry && matchesClient;
    });
  }, [companies, searchQuery, selectedType, selectedIndustry, showClientsOnly]);

  const stats = useMemo(() => {
    return {
      total: companies.length,
      clients: companies.filter((c) => c.isClient).length,
      withWebsite: companies.filter((c) => c.website).length,
      withContact: companies.filter((c) => c.mainContactEmail).length,
    };
  }, [companies]);

  const handleSaveCompany = async (companyData: Partial<Company>) => {
    if (!selectedCompany) return;

    try {
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompanies((prev) =>
          prev.map((c) => (c.id === updatedCompany.id ? updatedCompany : c))
        );
      }
    } catch (error) {
      console.error("Error updating company:", error);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCompanies((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Error deleting company:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Entreprises</h1>
          <p className="text-muted-foreground">
            Gérez votre répertoire d'organisations et de clients
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total entreprises</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.clients}</p>
                <p className="text-sm text-muted-foreground">Clients actifs</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.withWebsite}</p>
                <p className="text-sm text-muted-foreground">Avec site web</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.withContact}</p>
                <p className="text-sm text-muted-foreground">Avec contact</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Tous les types</option>
                {types.map((type) => (
                  <option key={type} value={type!}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry filter */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Toutes les industries</option>
              {industries.map((industry) => (
                <option key={industry} value={industry!}>
                  {industry}
                </option>
              ))}
            </select>

            {/* Clients only toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showClientsOnly}
                onChange={(e) => setShowClientsOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Clients uniquement</span>
            </label>

            {/* View mode */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredCompanies.length} entreprise{filteredCompanies.length !== 1 ? "s" : ""} trouvée{filteredCompanies.length !== 1 ? "s" : ""}
        </p>

        {/* Companies grid/list */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onClick={setSelectedCompany}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Entreprise
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Industrie
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Site web
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="w-8 h-8 rounded object-cover bg-muted"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {company.name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {company.name}
                          </span>
                          {company.isClient && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {company.industry || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {company.type && (
                        <span className="px-2 py-1 text-xs rounded-full bg-secondary/10 text-secondary">
                          {company.type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {company.mainContactName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-primary hover:underline"
                        >
                          {new URL(company.website).hostname}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucune entreprise trouvée
            </h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos filtres de recherche
            </p>
          </div>
        )}
      </main>

      {/* Company Modal */}
      {selectedCompany && (
        <CompanyModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onSave={handleSaveCompany}
          onDelete={handleDeleteCompany}
        />
      )}
    </div>
  );
}
