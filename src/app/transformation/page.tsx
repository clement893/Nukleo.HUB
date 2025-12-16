"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Target,
  Palette,
  Code,
  Brain,
  GraduationCap,
  Rocket,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Calendar,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
  DollarSign,
  Download,
  X,
  Check,
  Link2,
  FolderKanban,
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
    estimatedHours: 80,
    hourlyRate: 150,
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
    estimatedHours: 60,
    hourlyRate: 175,
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
    estimatedHours: 120,
    hourlyRate: 150,
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
    estimatedHours: 320,
    hourlyRate: 140,
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
    estimatedHours: 160,
    hourlyRate: 175,
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
    estimatedHours: 60,
    hourlyRate: 150,
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
    estimatedHours: 80,
    hourlyRate: 150,
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
    estimatedHours: 40,
    hourlyRate: 140,
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

interface Project {
  id: string;
  name: string;
  client: string | null;
  status: string | null;
  projectType: string | null;
}

interface SelectedPhase {
  id: string;
  name: string;
  selected: boolean;
  estimatedHours: number;
  hourlyRate: number;
  customHours?: number;
  customRate?: number;
}

export default function TransformationPage() {
  const [selectedPhase, setSelectedPhase] = useState<string | null>("diagnostic");
  const [activeTab, setActiveTab] = useState<"flow" | "devis" | "projets">("flow");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // État pour le générateur de devis
  const [quotePhases, setQuotePhases] = useState<SelectedPhase[]>(
    TRANSFORMATION_PHASES.map((p) => ({
      id: p.id,
      name: p.name,
      selected: true,
      estimatedHours: p.estimatedHours,
      hourlyRate: p.hourlyRate,
    }))
  );
  const [clientInfo, setClientInfo] = useState({
    name: "",
    email: "",
    company: "",
  });
  const [quoteTitle, setQuoteTitle] = useState("Projet de Transformation Numérique");
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);

  // Charger les projets
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const selectedPhaseData = TRANSFORMATION_PHASES.find((p) => p.id === selectedPhase);

  // Calculs du devis
  const calculateSubtotal = () => {
    return quotePhases
      .filter((p) => p.selected)
      .reduce((acc, p) => {
        const hours = p.customHours ?? p.estimatedHours;
        const rate = p.customRate ?? p.hourlyRate;
        return acc + hours * rate;
      }, 0);
  };

  const subtotal = calculateSubtotal();
  const taxRate = 0.14975; // TPS 5% + TVQ 9.975%
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const totalHours = quotePhases
    .filter((p) => p.selected)
    .reduce((acc, p) => acc + (p.customHours ?? p.estimatedHours), 0);

  const togglePhase = (phaseId: string) => {
    setQuotePhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, selected: !p.selected } : p))
    );
  };

  const updatePhaseHours = (phaseId: string, hours: number) => {
    setQuotePhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, customHours: hours } : p))
    );
  };

  const updatePhaseRate = (phaseId: string, rate: number) => {
    setQuotePhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, customRate: rate } : p))
    );
  };

  const handleSaveQuote = async () => {
    if (!clientInfo.name || !clientInfo.company) {
      alert("Veuillez remplir le nom et l'entreprise du client");
      return;
    }

    setSavingQuote(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          clientCompany: clientInfo.company,
          title: quoteTitle,
          projectId: selectedProject,
          phases: quotePhases.map((p) => ({
            ...p,
            estimatedHours: p.customHours ?? p.estimatedHours,
            hourlyRate: p.customRate ?? p.hourlyRate,
          })),
        }),
      });

      if (res.ok) {
        alert("Devis enregistré avec succès !");
        setShowQuotePreview(false);
      } else {
        alert("Erreur lors de l'enregistrement du devis");
      }
    } catch (error) {
      console.error("Error saving quote:", error);
      alert("Erreur lors de l'enregistrement du devis");
    } finally {
      setSavingQuote(false);
    }
  };

  const handleLinkToProject = async (projectId: string) => {
    try {
      // Créer les phases pour le projet
      const selectedPhaseIds = quotePhases.filter((p) => p.selected).map((p) => p.id);
      
      const res = await fetch("/api/project-phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          phaseTemplateIds: selectedPhaseIds,
        }),
      });

      if (res.ok) {
        alert("Phases ajoutées au projet avec succès !");
        setShowLinkModal(false);
      } else {
        alert("Erreur lors de l'ajout des phases");
      }
    } catch (error) {
      console.error("Error linking phases:", error);
      alert("Erreur lors de l'ajout des phases");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Transformation Numérique</h1>
                  <p className="text-muted-foreground">Template de projet avec intégration IA</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                >
                  <Link2 className="h-4 w-4" />
                  Lier à un projet
                </button>
                <button
                  onClick={() => setActiveTab("devis")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  Générer un devis
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("flow")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "flow"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Flow de transformation
            </button>
            <button
              onClick={() => setActiveTab("devis")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "devis"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Générateur de devis
            </button>
            <button
              onClick={() => setActiveTab("projets")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "projets"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Projets liés
            </button>
          </div>

          {/* Flow Tab */}
          {activeTab === "flow" && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <CheckCircle2 className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{TRANSFORMATION_PHASES.length}</p>
                      <p className="text-sm text-muted-foreground">Phases totales</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Clock className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
                      <p className="text-sm text-muted-foreground">Heures estimées</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <DollarSign className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(subtotal)}</p>
                      <p className="text-sm text-muted-foreground">Budget estimé</p>
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
                  
                  {/* Phases */}
                  <div className="relative flex justify-between">
                    {TRANSFORMATION_PHASES.map((phase) => {
                      const isSelected = selectedPhase === phase.id;
                      const Icon = phase.icon;
                      const isPhaseSelected = quotePhases.find((p) => p.id === phase.id)?.selected;
                      
                      return (
                        <button
                          key={phase.id}
                          onClick={() => setSelectedPhase(phase.id)}
                          className={`flex flex-col items-center group transition-all ${isSelected ? "scale-110" : "hover:scale-105"}`}
                        >
                          {/* Icône de phase */}
                          <div
                            className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all border-4 ${
                              isPhaseSelected
                                ? "border-primary/30"
                                : "border-muted bg-muted"
                            } ${isSelected ? "ring-4 ring-primary/30" : ""}`}
                            style={{ backgroundColor: isPhaseSelected ? phase.color : undefined }}
                          >
                            <Icon className={`h-7 w-7 ${isPhaseSelected ? "text-white" : "text-muted-foreground"}`} />
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
                        >
                          <selectedPhaseData.icon className="h-8 w-8" style={{ color: selectedPhaseData.color }} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{selectedPhaseData.name}</h3>
                          <p className="text-muted-foreground">{selectedPhaseData.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: selectedPhaseData.color }}>
                          {formatCurrency(selectedPhaseData.estimatedHours * selectedPhaseData.hourlyRate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPhaseData.estimatedHours}h × {selectedPhaseData.hourlyRate}$/h
                        </p>
                      </div>
                    </div>

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
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
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
                            <div className="w-2 h-2 rounded-full bg-primary" />
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedPhaseData.estimatedHours} heures de travail
                      </p>
                    </div>

                    {/* Tarification */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Tarification
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Taux horaire</span>
                          <span className="text-sm font-medium text-foreground">{selectedPhaseData.hourlyRate}$/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Heures estimées</span>
                          <span className="text-sm font-medium text-foreground">{selectedPhaseData.estimatedHours}h</span>
                        </div>
                        <div className="pt-2 border-t border-border flex justify-between">
                          <span className="text-sm font-medium text-foreground">Total phase</span>
                          <span className="text-sm font-bold" style={{ color: selectedPhaseData.color }}>
                            {formatCurrency(selectedPhaseData.estimatedHours * selectedPhaseData.hourlyRate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Actions</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setActiveTab("devis")}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <DollarSign className="h-4 w-4" />
                          Générer un devis
                        </button>
                        <button
                          onClick={() => setShowLinkModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                        >
                          <Link2 className="h-4 w-4" />
                          Lier à un projet
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Devis Tab */}
          {activeTab === "devis" && (
            <div className="grid grid-cols-3 gap-6">
              {/* Configuration du devis */}
              <div className="col-span-2 space-y-6">
                {/* Informations client */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informations client</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Nom du contact *</label>
                      <input
                        type="text"
                        value={clientInfo.name}
                        onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                      <input
                        type="email"
                        value={clientInfo.email}
                        onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="jean@entreprise.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Entreprise *</label>
                      <input
                        type="text"
                        value={clientInfo.company}
                        onChange={(e) => setClientInfo({ ...clientInfo, company: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Entreprise Inc."
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-1">Titre du devis</label>
                    <input
                      type="text"
                      value={quoteTitle}
                      onChange={(e) => setQuoteTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Sélection des phases */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Phases du projet</h3>
                  <div className="space-y-3">
                    {TRANSFORMATION_PHASES.map((phase) => {
                      const quotePhase = quotePhases.find((p) => p.id === phase.id)!;
                      const Icon = phase.icon;
                      const hours = quotePhase.customHours ?? quotePhase.estimatedHours;
                      const rate = quotePhase.customRate ?? quotePhase.hourlyRate;
                      
                      return (
                        <div
                          key={phase.id}
                          className={`p-4 rounded-lg border transition-all ${
                            quotePhase.selected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => togglePhase(phase.id)}
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                quotePhase.selected
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {quotePhase.selected && <Check className="h-4 w-4 text-white" />}
                            </button>
                            <div
                              className={`p-2 rounded-lg ${phase.bgColor}`}
                            >
                              <Icon className="h-5 w-5" style={{ color: phase.color }} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{phase.name}</p>
                              <p className="text-sm text-muted-foreground">{phase.description}</p>
                            </div>
                            {quotePhase.selected && (
                              <div className="flex items-center gap-4">
                                <div>
                                  <label className="block text-xs text-muted-foreground mb-1">Heures</label>
                                  <input
                                    type="number"
                                    value={hours}
                                    onChange={(e) => updatePhaseHours(phase.id, parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 rounded border border-border bg-background text-foreground text-sm text-right"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-muted-foreground mb-1">$/h</label>
                                  <input
                                    type="number"
                                    value={rate}
                                    onChange={(e) => updatePhaseRate(phase.id, parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 rounded border border-border bg-background text-foreground text-sm text-right"
                                  />
                                </div>
                                <div className="text-right min-w-[100px]">
                                  <p className="text-sm font-bold" style={{ color: phase.color }}>
                                    {formatCurrency(hours * rate)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Résumé du devis */}
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Résumé du devis</h3>
                  
                  <div className="space-y-3 mb-6">
                    {quotePhases
                      .filter((p) => p.selected)
                      .map((phase) => {
                        const hours = phase.customHours ?? phase.estimatedHours;
                        const rate = phase.customRate ?? phase.hourlyRate;
                        return (
                          <div key={phase.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{phase.name}</span>
                            <span className="text-foreground">{formatCurrency(hours * rate)}</span>
                          </div>
                        );
                      })}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span className="text-foreground">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes (14.975%)</span>
                      <span className="text-foreground">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Heures totales</span>
                      <span className="font-medium text-foreground">{totalHours}h</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Phases sélectionnées</span>
                      <span className="font-medium text-foreground">
                        {quotePhases.filter((p) => p.selected).length}/{TRANSFORMATION_PHASES.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <button
                      onClick={() => setShowQuotePreview(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Prévisualiser le devis
                    </button>
                    <button
                      onClick={handleSaveQuote}
                      disabled={savingQuote}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      {savingQuote ? "Enregistrement..." : "Enregistrer le devis"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Projets Tab */}
          {activeTab === "projets" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Projets de transformation</h3>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Lier un projet
                </button>
              </div>

              {loadingProjects ? (
                <div className="text-center py-12 text-muted-foreground">Chargement...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun projet lié</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Liez un projet existant pour appliquer le flow de transformation
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {projects.slice(0, 9).map((project) => (
                    <div
                      key={project.id}
                      className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{project.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          project.status === "En cours" ? "bg-emerald-500/10 text-emerald-500" :
                          project.status === "Terminé" ? "bg-blue-500/10 text-blue-500" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {project.status || "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{project.client || "Client non défini"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{project.projectType || "Type non défini"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de liaison à un projet */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Lier à un projet</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Sélectionnez un projet pour y ajouter les phases de transformation sélectionnées.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleLinkToProject(project.id)}
                  className="w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
                >
                  <p className="font-medium text-foreground">{project.name}</p>
                  <p className="text-sm text-muted-foreground">{project.client || "Client non défini"}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévisualisation du devis */}
      {showQuotePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white text-black rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">DEVIS</h2>
                <p className="text-gray-500">Nukleo</p>
              </div>
              <button
                onClick={() => setShowQuotePreview(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">CLIENT</h4>
                <p className="font-medium">{clientInfo.name || "Nom du client"}</p>
                <p className="text-gray-600">{clientInfo.company || "Entreprise"}</p>
                <p className="text-gray-600">{clientInfo.email || "email@exemple.com"}</p>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-semibold text-gray-500 mb-2">DEVIS N°</h4>
                <p className="font-medium">DEV-{Date.now().toString().slice(-6)}</p>
                <p className="text-gray-600">Date: {new Date().toLocaleDateString("fr-CA")}</p>
                <p className="text-gray-600">Valide 30 jours</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">{quoteTitle}</h3>

            <table className="w-full mb-6">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-500">Phase</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-500">Heures</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-500">Taux</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotePhases
                  .filter((p) => p.selected)
                  .map((phase) => {
                    const hours = phase.customHours ?? phase.estimatedHours;
                    const rate = phase.customRate ?? phase.hourlyRate;
                    return (
                      <tr key={phase.id} className="border-b border-gray-100">
                        <td className="py-3">{phase.name}</td>
                        <td className="py-3 text-right">{hours}h</td>
                        <td className="py-3 text-right">{rate}$/h</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(hours * rate)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Sous-total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">TPS (5%)</span>
                <span>{formatCurrency(subtotal * 0.05)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">TVQ (9.975%)</span>
                <span>{formatCurrency(subtotal * 0.09975)}</span>
              </div>
              <div className="flex justify-between py-2 text-xl font-bold border-t border-gray-200 mt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleSaveQuote}
                disabled={savingQuote}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                {savingQuote ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={() => setShowQuotePreview(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
