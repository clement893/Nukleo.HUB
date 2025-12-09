"use client";

import { useEffect, useState, useMemo } from "react";
import { Project } from "@/types/project";
import { ProjectCard } from "@/components/ProjectCard";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Grid3X3,
  List,
  FolderKanban,
  X,
  ChevronDown,
  Plus,
  Download,
  SlidersHorizontal,
} from "lucide-react";

type ViewMode = "grid" | "list";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique values for filters
  const statuses = useMemo(() => {
    const uniqueStatuses = new Set<string>();
    projects.forEach((p) => {
      if (p.status) uniqueStatuses.add(p.status);
    });
    return Array.from(uniqueStatuses).sort();
  }, [projects]);

  const projectTypes = useMemo(() => {
    const uniqueTypes = new Set<string>();
    projects.forEach((p) => {
      if (p.projectType) uniqueTypes.add(p.projectType);
    });
    return Array.from(uniqueTypes).sort();
  }, [projects]);

  const years = useMemo(() => {
    const uniqueYears = new Set<string>();
    projects.forEach((p) => {
      if (p.year) uniqueYears.add(p.year);
    });
    return Array.from(uniqueYears).sort().reverse();
  }, [projects]);

  const departments = useMemo(() => {
    const uniqueDepts = new Set<string>();
    projects.forEach((p) => {
      if (p.departments) {
        p.departments.split(",").forEach((dept) => {
          const trimmed = dept.trim();
          if (trimmed) uniqueDepts.add(trimmed);
        });
      }
    });
    return Array.from(uniqueDepts).sort();
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          project.name?.toLowerCase().includes(query) ||
          project.client?.toLowerCase().includes(query) ||
          project.lead?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (selectedStatus && project.status !== selectedStatus) {
        return false;
      }

      // Type filter
      if (selectedType && project.projectType !== selectedType) {
        return false;
      }

      // Year filter
      if (selectedYear && project.year !== selectedYear) {
        return false;
      }

      // Department filter
      if (selectedDepartment && !project.departments?.includes(selectedDepartment)) {
        return false;
      }

      return true;
    });
  }, [projects, searchQuery, selectedStatus, selectedType, selectedYear, selectedDepartment]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedType("");
    setSelectedYear("");
    setSelectedDepartment("");
  };

  const hasActiveFilters =
    searchQuery || selectedStatus || selectedType || selectedYear || selectedDepartment;

  // Stats
  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === "Actif" || p.status === "En cours").length;
    const done = projects.filter((p) => p.status === "Done").length;
    const blocked = projects.filter((p) => p.status === "Bloqué" || p.status === "Flag").length;
    return { total: projects.length, active, done, blocked };
  }, [projects]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projets</h1>
            <p className="text-muted-foreground mt-1">
              {filteredProjects.length} projet{filteredProjects.length !== 1 ? "s" : ""}{" "}
              {hasActiveFilters && `sur ${projects.length}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Nouveau projet
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-muted-foreground">En cours</p>
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Terminés</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.done}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Bloqués</p>
            <p className="text-2xl font-bold text-red-400">{stats.blocked}</p>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? "bg-primary/10 text-primary"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                  {[selectedStatus, selectedType, selectedYear, selectedDepartment].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border flex-wrap">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Tous les statuts</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Tous les types</option>
                  {projectTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Year Filter */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Toutes les années</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Department Filter */}
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Tous les départements</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                  Effacer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Projects Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              Aucun projet trouvé
            </h3>
            <p className="text-muted-foreground mt-1">
              {hasActiveFilters
                ? "Essayez de modifier vos filtres"
                : "Commencez par ajouter un projet"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Projet
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Lead
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Année
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">
                        {project.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {project.client || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {project.status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === "Actif" || project.status === "En cours"
                            ? "bg-green-500/20 text-green-400"
                            : project.status === "Done"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : project.status === "Bloqué"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {project.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {project.projectType || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {project.lead || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {project.year || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
