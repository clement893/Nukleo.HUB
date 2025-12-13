"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import KanbanColumn from "@/components/KanbanColumn";
import OpportunityModal from "@/components/OpportunityModal";
import { Opportunity, PIPELINE_STAGES, REGIONS, SEGMENTS } from "@/types/opportunity";
import { Filter, RefreshCw, Search, Download, Eye, EyeOff, ChevronLeft, ChevronRight, Settings, X } from "lucide-react";

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterSegment, setFilterSegment] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  
  // Column visibility state (saved in localStorage)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pipeline-visible-columns");
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          // Fallback to all visible
        }
      }
    }
    // Par défaut, toutes les colonnes sont visibles
    return new Set(PIPELINE_STAGES.map(stage => stage.id));
  });
  
  // Modal state
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExport = () => {
    window.location.href = "/api/export/opportunities";
  };

  const fetchOpportunities = useCallback(async () => {
    try {
      const response = await fetch("/api/opportunities");
      const data = await response.json();
      setOpportunities(data);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (!draggedId) return;

    // Optimistic update
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === draggedId ? { ...opp, stage: stageId } : opp
      )
    );

    try {
      await fetch(`/api/opportunities/${draggedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: stageId }),
      });
    } catch (error) {
      console.error("Error updating opportunity:", error);
      fetchOpportunities(); // Revert on error
    }

    setDraggedId(null);
  };

  // Handle card click to open modal
  const handleCardClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
  };

  // Handle save from modal
  const handleSaveOpportunity = async (updatedOpportunity: Opportunity) => {
    try {
      const response = await fetch(`/api/opportunities/${updatedOpportunity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOpportunity),
      });

      if (response.ok) {
        // Update local state
        setOpportunities((prev) =>
          prev.map((opp) =>
            opp.id === updatedOpportunity.id ? updatedOpportunity : opp
          )
        );
      } else {
        throw new Error("Failed to update opportunity");
      }
    } catch (error) {
      console.error("Error saving opportunity:", error);
      throw error;
    }
  };

  // Handle delete from modal
  const handleDeleteOpportunity = async (id: string) => {
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from local state
        setOpportunities((prev) => prev.filter((opp) => opp.id !== id));
      } else {
        throw new Error("Failed to delete opportunity");
      }
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      throw error;
    }
  };

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      !searchQuery ||
      opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.contact?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = !filterRegion || opp.region === filterRegion;
    const matchesSegment = !filterSegment || opp.segment === filterSegment;

    return matchesSearch && matchesRegion && matchesSegment;
  });

  // Toggle column visibility
  const toggleColumnVisibility = (stageId: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(stageId)) {
      newVisible.delete(stageId);
    } else {
      newVisible.add(stageId);
    }
    setVisibleColumns(newVisible);
    // Sauvegarder dans localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("pipeline-visible-columns", JSON.stringify(Array.from(newVisible)));
    }
  };

  // Show all columns
  const showAllColumns = () => {
    const allColumns = new Set(PIPELINE_STAGES.map(stage => stage.id));
    setVisibleColumns(allColumns);
    if (typeof window !== "undefined") {
      localStorage.setItem("pipeline-visible-columns", JSON.stringify(Array.from(allColumns)));
    }
  };

  // Hide all columns except active ones
  const hideInactiveColumns = () => {
    const activeStages = new Set(
      filteredOpportunities
        .filter(opp => !["09 - Closed Won", "Closed Lost"].includes(opp.stage))
        .map(opp => opp.stage)
    );
    setVisibleColumns(activeStages);
    if (typeof window !== "undefined") {
      localStorage.setItem("pipeline-visible-columns", JSON.stringify(Array.from(activeStages)));
    }
  };

  // Group by stage
  const opportunitiesByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = filteredOpportunities.filter((opp) => opp.stage === stage.id);
    return acc;
  }, {} as Record<string, Opportunity[]>);

  // Filter visible stages
  const visibleStages = PIPELINE_STAGES.filter(stage => visibleColumns.has(stage.id));

  // Calculate totals
  const totalValue = filteredOpportunities.reduce(
    (sum, opp) => sum + (opp.value || 0),
    0
  );
  const activeOpportunities = filteredOpportunities.filter(
    (opp) => !["09 - Closed Won", "Closed Lost"].includes(opp.stage)
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Pipeline Commercial
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeOpportunities.length} opportunités actives •{" "}
                {new Intl.NumberFormat("fr-CA", {
                  style: "currency",
                  currency: "CAD",
                  minimumFractionDigits: 0,
                }).format(totalValue)}{" "}
                en pipeline
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 rounded-lg bg-muted border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  showFilters || filterRegion || filterSegment
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filtres
              </button>

              {/* Export */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>

              {/* Refresh */}
              <button
                onClick={fetchOpportunities}
                className="p-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              {/* Column Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors text-sm"
                  title="Gérer les colonnes"
                >
                  <Settings className="h-4 w-4" />
                  Colonnes
                </button>
                
                {showColumnSettings && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground text-sm">Colonnes visibles</h3>
                      <button
                        onClick={() => setShowColumnSettings(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                      {PIPELINE_STAGES.map((stage) => {
                        const isVisible = visibleColumns.has(stage.id);
                        const count = opportunitiesByStage[stage.id]?.length || 0;
                        
                        return (
                          <label
                            key={stage.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => toggleColumnVisibility(stage.id)}
                              className="rounded border-border"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              <span className="text-sm text-foreground flex-1">{stage.name}</span>
                              <span className="text-xs text-muted-foreground">{count}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t border-border">
                      <button
                        onClick={showAllColumns}
                        className="flex-1 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        Tout afficher
                      </button>
                      <button
                        onClick={hideInactiveColumns}
                        className="flex-1 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        Masquer inactives
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="px-8 py-3 border-t border-border bg-muted/30 flex items-center gap-4">
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-muted border-none text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Toutes les régions</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              <select
                value={filterSegment}
                onChange={(e) => setFilterSegment(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-muted border-none text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Tous les segments</option>
                {SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>

              {(filterRegion || filterSegment) && (
                <button
                  onClick={() => {
                    setFilterRegion("");
                    setFilterSegment("");
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </header>

        {/* Kanban Board */}
        <div className="p-6 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex gap-4 pb-4">
              {PIPELINE_STAGES.map((stage) => {
                const isVisible = visibleColumns.has(stage.id);
                return (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    opportunities={opportunitiesByStage[stage.id] || []}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onCardClick={handleCardClick}
                    isCollapsed={!isVisible}
                    onToggleCollapse={() => toggleColumnVisibility(stage.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Opportunity Modal */}
      <OpportunityModal
        opportunity={selectedOpportunity}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOpportunity(null);
        }}
        onSave={handleSaveOpportunity}
        onDelete={handleDeleteOpportunity}
      />
    </div>
  );
}
