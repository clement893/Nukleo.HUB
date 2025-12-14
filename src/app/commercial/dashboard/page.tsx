"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp,
  Target,
  DollarSign,
  Percent,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
} from "lucide-react";

interface DashboardStats {
  summary: {
    totalOpportunities: number;
    activeCount: number;
    pipelineValue: number;
    proposalsSent: number;
    wonCount: number;
    wonAmount: number;
    lostCount: number;
    conversionRate: number;
  };
  stageData: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  recentOpportunities: Array<{
    id: string;
    name: string;
    value: number | null;
    stage: string | null;
    company: string | null;
    contact: string | null;
    updatedAt: string;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("fr-CA").format(value);
};

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    "Idées de contact": "bg-slate-500",
    "Idées de projet": "bg-slate-400",
    "Suivi / Emails": "bg-blue-400",
    "Rencontre bookée": "bg-blue-500",
    "En discussion": "bg-indigo-500",
    "Proposition à faire": "bg-violet-500",
    "Proposition envoyée": "bg-purple-500",
    "Contrat à faire": "bg-fuchsia-500",
    "En attente": "bg-amber-500",
    "Renouvellement à venir": "bg-orange-500",
    "Renouvellements potentiels": "bg-orange-400",
    "Gagné": "bg-green-500",
    "Perdu": "bg-red-500",
  };
  return colors[stage] || "bg-gray-500";
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const maxStageValue = stats
    ? Math.max(...stats.stageData.map((s) => s.value))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tableau de bord commercial
            </h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble de vos opportunités et performances
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Mis à jour : {lastUpdated.toLocaleTimeString("fr-CA")}
              </span>
            )}
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Opportunities */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-foreground">
                    {formatNumber(stats.summary.totalOpportunities)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Opportunités totales
                  </p>
                  <p className="text-sm text-blue-500">
                    {stats.summary.activeCount} actives
                  </p>
                </div>
              </div>

              {/* Pipeline Value */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-violet-500/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-violet-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Pipeline</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-foreground">
                    {formatCurrency(stats.summary.pipelineValue)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Valeur du pipeline actif
                  </p>
                  <p className="text-sm text-violet-500">
                    {stats.summary.proposalsSent} propositions envoyées
                  </p>
                </div>
              </div>

              {/* Won Amount */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-foreground">
                    {formatCurrency(stats.summary.wonAmount)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Montant gagné</p>
                  <p className="text-sm text-green-500">
                    {stats.summary.wonCount} contrats signés
                  </p>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <Percent className="w-6 h-6 text-amber-500" />
                  </div>
                  {stats.summary.conversionRate >= 50 ? (
                    <ArrowUpRight className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-foreground">
                    {stats.summary.conversionRate}%
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Taux de conversion
                  </p>
                  <p className="text-sm text-red-500">
                    {stats.summary.lostCount} opportunités perdues
                  </p>
                </div>
              </div>
            </div>

            {/* Charts and Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stage Distribution Chart */}
              <div className="lg:col-span-2 glass-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">
                  Répartition par étape
                </h3>
                <div className="space-y-4">
                  {stats.stageData.map((stage) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium">
                          {stage.stage}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            {stage.count} opp.
                          </span>
                          <span className="text-foreground font-medium w-28 text-right">
                            {formatCurrency(stage.value)}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getStageColor(stage.stage)} rounded-full transition-all duration-500`}
                          style={{
                            width: `${maxStageValue > 0 ? (stage.value / maxStageValue) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Opportunities */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Activité récente
                </h3>
                <div className="space-y-4">
                  {stats.recentOpportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {opp.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {opp.company && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="w-3 h-3" />
                              {opp.company}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              opp.stage === "Gagné"
                                ? "bg-green-500/10 text-green-500"
                                : opp.stage === "Perdu"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {opp.stage || "Non défini"}
                          </span>
                          {opp.value && (
                            <span className="text-xs font-medium text-foreground">
                              {formatCurrency(opp.value)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            Erreur lors du chargement des statistiques
          </div>
        )}
      </main>
    </div>
  );
}
