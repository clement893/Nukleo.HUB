"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ProtectedPage } from "@/components/ProtectedPage";
import {
  Building2,
  Users,
  FolderKanban,
  Search,
  ExternalLink,
  Ticket,
  Copy,
  Check,
  Plus,
  TrendingUp,
  Globe,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { logger } from "@/lib/logger";

interface Contact {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  photoUrl: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string | null;
  projectType: string | null;
  timeline: string | null;
  budget: string | null;
}

interface Opportunity {
  id: string;
  name: string;
  value: number | null;
  stage: string | null;
}

interface Portal {
  id: string;
  token: string;
  isActive: boolean;
  _count: { tickets: number };
}

interface Client {
  id: string;
  name: string;
  website: string | null;
  logo: string | null;
  industry: string | null;
  description: string | null;
  projects: Project[];
  contacts: Contact[];
  opportunities: Opportunity[];
  portal: Portal | null;
  stats: {
    projectCount: number;
    contactCount: number;
    opportunityCount: number;
    totalRevenue: number;
    hasPortal: boolean;
    openTickets: number;
  };
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [creatingPortal, setCreatingPortal] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Utiliser React Query pour le cache et Ã©viter les re-renders
  const { data: clients = [], isLoading: loading } = useQuery<Client[]>({
    queryKey: ["clients", search],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        
        const response = await fetch(`/api/clients?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch clients");
        }
        return response.json();
      } catch (error) {
        toast.error("Erreur", "Impossible de charger les clients");
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error("Error fetching clients", errorObj, "CLIENTS_PAGE", { search });
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const copyPortalUrl = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const createPortalForClient = async (companyId: string) => {
    setCreatingPortal(companyId);
    try {
      const response = await fetch("/api/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, createPortal: true }),
      });
      if (!response.ok) {
        throw new Error("Failed to create portal");
      }
      // Invalider le cache pour forcer le re-fetch
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("SuccÃ¨s", "Portail client crÃ©Ã© avec succÃ¨s");
    } catch (error) {
      toast.error("Erreur", "Impossible de crÃ©er le portail client");
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error creating portal", errorObj, "CLIENTS_PAGE", { companyId });
    } finally {
      setCreatingPortal(null);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "en cours":
      case "actif":
        return "bg-green-500/20 text-green-400";
      case "terminÃ©":
      case "complÃ©tÃ©":
        return "bg-blue-500/20 text-blue-400";
      case "en attente":
      case "pause":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ProtectedPage requiredAccess="reseau">
      <div className="min-h-screen bg-[#0a0a0f]">
        <Sidebar />
        <main className="pl-64 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Clients</h1>
              <p className="text-gray-400 mt-1">
                GÃ©rez vos relations clients avec leurs projets, contacts et portails
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 w-64"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Building2 className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{clients.length}</p>
                  <p className="text-sm text-gray-400">Clients actifs</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FolderKanban className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {clients.reduce((sum, c) => sum + c.stats.projectCount, 0)}
                  </p>
                  <p className="text-sm text-gray-400">Projets</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(clients.reduce((sum, c) => sum + c.stats.totalRevenue, 0))}
                  </p>
                  <p className="text-sm text-gray-400">Revenus totaux</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Ticket className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {clients.filter((c) => c.stats.hasPortal).length}
                  </p>
                  <p className="text-sm text-gray-400">Portails actifs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 text-center py-12 text-gray-400">
                Chargement des clients...
              </div>
            ) : clients.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aucun client trouvÃ©</p>
                <p className="text-sm text-gray-500 mt-2">
                  Marquez des entreprises comme "Client" pour les voir ici
                </p>
              </div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-[#1a1a2e] rounded-xl border border-gray-800 hover:border-violet-500/50 transition-all overflow-hidden"
                >
                  {/* Client Header */}
                  <div className="p-5 border-b border-gray-800">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {client.logo ? (
                          <img
                            src={client.logo}
                            alt={client.name}
                            className="w-12 h-12 rounded-lg object-cover bg-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {client.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/organisations/${client.id}`}
                            className="text-lg font-semibold text-white hover:text-violet-400 transition-colors"
                          >
                            {client.name}
                          </Link>
                          {client.industry && (
                            <p className="text-sm text-gray-400">{client.industry}</p>
                          )}
                        </div>
                      </div>
                      {client.website && (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <FolderKanban className="w-4 h-4" />
                        <span>{client.stats.projectCount} projets</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{client.stats.contactCount} contacts</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>{client.stats.opportunityCount} opportunitÃ©s</span>
                      </div>
                    </div>
                  </div>

                  {/* Projects Preview */}
                  {client.projects.length > 0 && (
                    <div className="p-4 border-b border-gray-800">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                        Projets rÃ©cents
                      </h4>
                      <div className="space-y-2">
                        {client.projects.slice(0, 3).map((project) => (
                          <Link
                            key={project.id}
                            href={`/projets/${project.id}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <FolderKanban className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-300 group-hover:text-white">
                                {project.name}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                              {project.status || "N/A"}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contacts Preview */}
                  {client.contacts.length > 0 && (
                    <div className="p-4 border-b border-gray-800">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                        Contacts clÃ©s
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {client.contacts.slice(0, 4).map((contact) => (
                          <Link
                            key={contact.id}
                            href={`/contacts/${contact.id}`}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full hover:bg-gray-700/50 transition-colors"
                          >
                            {contact.photoUrl ? (
                              <img
                                src={contact.photoUrl}
                                alt={contact.fullName}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center">
                                <span className="text-xs text-violet-400">
                                  {contact.fullName.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-300">{contact.fullName}</span>
                          </Link>
                        ))}
                        {client.contacts.length > 4 && (
                          <span className="px-3 py-1.5 text-xs text-gray-500">
                            +{client.contacts.length - 4} autres
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Portal Section */}
                  <div className="p-4 bg-gray-900/30">
                    {client.portal ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${client.portal.isActive ? "bg-green-500" : "bg-gray-500"}`} />
                          <span className="text-sm text-gray-300">
                            Portail {client.portal.isActive ? "actif" : "inactif"}
                          </span>
                          {client.stats.openTickets > 0 && (
                            <span className="flex items-center gap-1 text-xs text-orange-400">
                              <AlertCircle className="w-3 h-3" />
                              {client.stats.openTickets} tickets
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyPortalUrl(client.portal!.token)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors text-sm"
                          >
                            {copiedToken === client.portal.token ? (
                              <>
                                <Check className="w-4 h-4" />
                                CopiÃ© !
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copier URL
                              </>
                            )}
                          </button>
                          <Link
                            href={`/portal/${client.portal.token}`}
                            target="_blank"
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => createPortalForClient(client.id)}
                        disabled={creatingPortal === client.id}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors text-sm w-full justify-center"
                      >
                        {creatingPortal === client.id ? (
                          "CrÃ©ation..."
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            CrÃ©er un portail client
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
