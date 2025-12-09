"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Target,
  Lightbulb,
  Palette,
  Code,
  Brain,
  GraduationCap,
  Rocket,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Plus,
  Building2,
  Calendar,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// Phases du flow de transformation numérique
const TRANSFORMATION_PHASES = [
  {
    id: "diagnostic",
    name: "Diagnostic",
    description: "Audit et analyse de l'existant",
    icon: Search,
    color: "#6366f1",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    duration: "2-4 semaines",
    deliverables: [
      "Cartographie des processus actuels",
      "Analyse des systèmes existants",
      "Identification des pain points",
      "Évaluation de la maturité numérique",
      "Rapport d'audit complet",
    ],
    tasks: [
      "Entretiens parties prenantes",
      "Analyse documentaire",
      "Audit technique",
      "Benchmark concurrentiel",
    ],
  },
  {
    id: "strategie",
    name: "Stratégie",
    description: "Vision et roadmap de transformation",
    icon: Target,
    color: "#8b5cf6",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    duration: "2-3 semaines",
    deliverables: [
      "Vision stratégique",
      "Roadmap de transformation",
      "Business case",
      "Plan de gouvernance",
      "KPIs de succès",
    ],
    tasks: [
      "Ateliers de co-création",
      "Définition des priorités",
      "Estimation budgétaire",
      "Planning macro",
    ],
  },
  {
    id: "design",
    name: "Design",
    description: "Conception UX/UI et prototypage",
    icon: Palette,
    color: "#ec4899",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    duration: "4-6 semaines",
    deliverables: [
      "Wireframes et maquettes",
      "Design system",
      "Prototypes interactifs",
      "Spécifications fonctionnelles",
      "Tests utilisateurs",
    ],
    tasks: [
      "Recherche utilisateur",
      "Architecture d'information",
      "Design d'interface",
      "Validation client",
    ],
  },
  {
    id: "developpement",
    name: "Développement",
    description: "Implémentation technique",
    icon: Code,
    color: "#10b981",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    duration: "8-16 semaines",
    deliverables: [
      "Application fonctionnelle",
      "APIs et intégrations",
      "Base de données",
      "Documentation technique",
      "Tests automatisés",
    ],
    tasks: [
      "Setup infrastructure",
      "Développement itératif",
      "Revues de code",
      "Tests et QA",
    ],
  },
  {
    id: "ia",
    name: "Intégration IA",
    description: "Intelligence artificielle et automatisation",
    icon: Brain,
    color: "#f59e0b",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    duration: "4-8 semaines",
    deliverables: [
      "Modèles IA entraînés",
      "Pipelines de données",
      "Automatisations intelligentes",
      "Tableaux de bord analytiques",
      "Documentation IA",
    ],
    tasks: [
      "Collecte et préparation données",
      "Entraînement modèles",
      "Intégration APIs IA",
      "Tests et validation",
    ],
  },
  {
    id: "formation",
    name: "Formation",
    description: "Accompagnement au changement",
    icon: GraduationCap,
    color: "#3b82f6",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    duration: "2-4 semaines",
    deliverables: [
      "Programme de formation",
      "Supports pédagogiques",
      "Sessions de formation",
      "Guides utilisateurs",
      "FAQ et ressources",
    ],
    tasks: [
      "Conception pédagogique",
      "Création des supports",
      "Animation sessions",
      "Évaluation des acquis",
    ],
  },
  {
    id: "deploiement",
    name: "Déploiement",
    description: "Mise en production et lancement",
    icon: Rocket,
    color: "#ef4444",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    duration: "2-4 semaines",
    deliverables: [
      "Environnement de production",
      "Migration des données",
      "Plan de rollback",
      "Checklist de lancement",
      "Communication interne",
    ],
    tasks: [
      "Préparation production",
      "Migration données",
      "Tests de charge",
      "Go-live",
    ],
  },
  {
    id: "suivi",
    name: "Suivi & Optimisation",
    description: "Amélioration continue",
    icon: TrendingUp,
    color: "#14b8a6",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    duration: "Continu",
    deliverables: [
      "Rapports de performance",
      "Analyses d'usage",
      "Recommandations d'amélioration",
      "Mises à jour régulières",
      "Support utilisateurs",
    ],
    tasks: [
      "Monitoring performance",
      "Collecte feedback",
      "Itérations produit",
      "Maintenance évolutive",
    ],
  },
];

type PhaseStatus = "completed" | "in_progress" | "pending";

interface ProjectPhase {
  phaseId: string;
  status: PhaseStatus;
  startDate?: string;
  endDate?: string;
  progress: number;
  notes?: string;
}

// Exemple de projet en cours
const EXAMPLE_PROJECT: ProjectPhase[] = [
  { phaseId: "diagnostic", status: "completed", progress: 100, startDate: "2024-01-15", endDate: "2024-02-02" },
  { phaseId: "strategie", status: "completed", progress: 100, startDate: "2024-02-05", endDate: "2024-02-23" },
  { phaseId: "design", status: "completed", progress: 100, startDate: "2024-02-26", endDate: "2024-04-05" },
  { phaseId: "developpement", status: "in_progress", progress: 65, startDate: "2024-04-08" },
  { phaseId: "ia", status: "pending", progress: 0 },
  { phaseId: "formation", status: "pending", progress: 0 },
  { phaseId: "deploiement", status: "pending", progress: 0 },
  { phaseId: "suivi", status: "pending", progress: 0 },
];

export default function TransformationPage() {
  const [selectedPhase, setSelectedPhase] = useState<string | null>("developpement");
  const [projectPhases] = useState<ProjectPhase[]>(EXAMPLE_PROJECT);

  const getPhaseStatus = (phaseId: string): ProjectPhase | undefined => {
    return projectPhases.find((p) => p.phaseId === phaseId);
  };

  const getStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "pending":
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: PhaseStatus) => {
    switch (status) {
      case "completed":
        return "Terminé";
      case "in_progress":
        return "En cours";
      case "pending":
        return "À venir";
    }
  };

  const selectedPhaseData = TRANSFORMATION_PHASES.find((p) => p.id === selectedPhase);
  const selectedPhaseStatus = selectedPhase ? getPhaseStatus(selectedPhase) : undefined;

  // Calcul de la progression globale
  const totalProgress = projectPhases.reduce((acc, p) => acc + p.progress, 0) / projectPhases.length;
  const completedPhases = projectPhases.filter((p) => p.status === "completed").length;
  const currentPhase = projectPhases.find((p) => p.status === "in_progress");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Transformation Numérique</h1>
                <p className="text-muted-foreground">Template de projet avec intégration IA</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{Math.round(totalProgress)}%</p>
                  <p className="text-sm text-muted-foreground">Progression globale</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <CheckCircle2 className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedPhases}/{TRANSFORMATION_PHASES.length}</p>
                  <p className="text-sm text-muted-foreground">Phases terminées</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{currentPhase ? TRANSFORMATION_PHASES.find(p => p.id === currentPhase.phaseId)?.name : "-"}</p>
                  <p className="text-sm text-muted-foreground">Phase actuelle</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">24 sem.</p>
                  <p className="text-sm text-muted-foreground">Durée estimée</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Timeline */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-6">Flow de Transformation</h2>
            
            {/* Timeline horizontal */}
            <div className="relative">
              {/* Ligne de connexion */}
              <div className="absolute top-8 left-0 right-0 h-1 bg-border" />
              <div 
                className="absolute top-8 left-0 h-1 bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500 transition-all duration-500"
                style={{ width: `${(completedPhases / TRANSFORMATION_PHASES.length) * 100 + (currentPhase ? (currentPhase.progress / 100) * (100 / TRANSFORMATION_PHASES.length) : 0)}%` }}
              />
              
              {/* Phases */}
              <div className="relative flex justify-between">
                {TRANSFORMATION_PHASES.map((phase, index) => {
                  const phaseStatus = getPhaseStatus(phase.id);
                  const isSelected = selectedPhase === phase.id;
                  const Icon = phase.icon;
                  
                  return (
                    <button
                      key={phase.id}
                      onClick={() => setSelectedPhase(phase.id)}
                      className={`flex flex-col items-center group transition-all ${isSelected ? "scale-110" : "hover:scale-105"}`}
                    >
                      {/* Icône de phase */}
                      <div
                        className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all border-4 ${
                          phaseStatus?.status === "completed"
                            ? "bg-emerald-500 border-emerald-500/30"
                            : phaseStatus?.status === "in_progress"
                            ? "bg-amber-500 border-amber-500/30"
                            : "bg-muted border-border"
                        } ${isSelected ? "ring-4 ring-primary/30" : ""}`}
                      >
                        <Icon className={`h-7 w-7 ${phaseStatus?.status !== "pending" ? "text-white" : "text-muted-foreground"}`} />
                        
                        {/* Badge de progression */}
                        {phaseStatus?.status === "in_progress" && (
                          <div className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full px-1.5 py-0.5 text-xs font-medium text-amber-500">
                            {phaseStatus.progress}%
                          </div>
                        )}
                      </div>
                      
                      {/* Nom de la phase */}
                      <span className={`mt-3 text-sm font-medium transition-colors ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {phase.name}
                      </span>
                      
                      {/* Durée */}
                      <span className="text-xs text-muted-foreground mt-1">{phase.duration}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Phase Details */}
          {selectedPhaseData && (
            <div className="grid grid-cols-3 gap-6">
              {/* Détails de la phase */}
              <div className="col-span-2 bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${selectedPhaseData.bgColor}`}
                      style={{ borderColor: selectedPhaseData.color }}
                    >
                      <selectedPhaseData.icon className="h-8 w-8" style={{ color: selectedPhaseData.color }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{selectedPhaseData.name}</h3>
                      <p className="text-muted-foreground">{selectedPhaseData.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPhaseStatus && getStatusIcon(selectedPhaseStatus.status)}
                    <span className={`text-sm font-medium ${
                      selectedPhaseStatus?.status === "completed" ? "text-emerald-500" :
                      selectedPhaseStatus?.status === "in_progress" ? "text-amber-500" :
                      "text-muted-foreground"
                    }`}>
                      {selectedPhaseStatus ? getStatusLabel(selectedPhaseStatus.status) : "À venir"}
                    </span>
                  </div>
                </div>

                {/* Barre de progression */}
                {selectedPhaseStatus?.status === "in_progress" && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium text-foreground">{selectedPhaseStatus.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedPhaseStatus.progress}%`, backgroundColor: selectedPhaseData.color }}
                      />
                    </div>
                  </div>
                )}

                {/* Livrables */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Livrables
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPhaseData.deliverables.map((deliverable, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                      >
                        <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${
                          selectedPhaseStatus?.status === "completed" ? "text-emerald-500" : "text-muted-foreground"
                        }`} />
                        <span className="text-sm text-foreground">{deliverable}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tâches */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Tâches principales
                  </h4>
                  <div className="space-y-2">
                    {selectedPhaseData.tasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          selectedPhaseStatus?.status === "completed" ? "bg-emerald-500" :
                          selectedPhaseStatus?.status === "in_progress" && index < 2 ? "bg-amber-500" :
                          "bg-muted-foreground"
                        }`} />
                        <span className="text-sm text-foreground">{task}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar info */}
              <div className="space-y-4">
                {/* Durée */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Durée estimée
                  </h4>
                  <p className="text-2xl font-bold" style={{ color: selectedPhaseData.color }}>
                    {selectedPhaseData.duration}
                  </p>
                  {selectedPhaseStatus?.startDate && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Début: {new Date(selectedPhaseStatus.startDate).toLocaleDateString("fr-FR")}
                      </p>
                      {selectedPhaseStatus.endDate && (
                        <p className="text-sm text-muted-foreground">
                          Fin: {new Date(selectedPhaseStatus.endDate).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Équipe suggérée */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Équipe suggérée
                  </h4>
                  <div className="space-y-2">
                    {selectedPhaseData.id === "diagnostic" && (
                      <>
                        <div className="text-sm text-muted-foreground">• Consultant senior</div>
                        <div className="text-sm text-muted-foreground">• Analyste métier</div>
                      </>
                    )}
                    {selectedPhaseData.id === "strategie" && (
                      <>
                        <div className="text-sm text-muted-foreground">• Directeur conseil</div>
                        <div className="text-sm text-muted-foreground">• Consultant senior</div>
                      </>
                    )}
                    {selectedPhaseData.id === "design" && (
                      <>
                        <div className="text-sm text-muted-foreground">• UX Designer</div>
                        <div className="text-sm text-muted-foreground">• UI Designer</div>
                      </>
                    )}
                    {selectedPhaseData.id === "developpement" && (
                      <>
                        <div className="text-sm text-muted-foreground">• Tech Lead</div>
                        <div className="text-sm text-muted-foreground">• Développeurs (2-3)</div>
                      </>
                    )}
                    {selectedPhaseData.id === "ia" && (
                      <>
                        <div className="text-sm text-muted-foreground">• Data Scientist</div>
                        <div className="text-sm text-muted-foreground">• ML Engineer</div>
                      </>
                    )}
                    {selectedPhaseData.id === "formation" && (
                      <>
                        <div className="text-sm text-muted-foreground">• Formateur</div>
                        <div className="text-sm text-muted-foreground">• Change Manager</div>
                      </>
                    )}
                    {selectedPhaseData.id === "deploiement" && (
                      <>
                        <div className="text-sm text-muted-foreground">• DevOps Engineer</div>
                        <div className="text-sm text-muted-foreground">• Tech Lead</div>
                      </>
                    )}
                    {selectedPhaseData.id === "suivi" && (
                      <>
                        <div className="text-sm text-muted-foreground">• Product Owner</div>
                        <div className="text-sm text-muted-foreground">• Support technique</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      <Plus className="h-4 w-4" />
                      Créer un projet
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
                      <FileText className="h-4 w-4" />
                      Exporter le template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
