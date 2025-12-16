"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DOMPurify from "dompurify";
import {
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Video,
  HelpCircle,
  Shield,
  Compass,
  Rocket,
  PartyPopper,
  Sparkles,
  Award,
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  content: string;
  type: string;
  order: number;
  role: string | null;
  isRequired: boolean;
  duration: number;
  status: string;
  completedAt: string | null;
}

interface Policy {
  id: number;
  title: string;
  content: string;
  category: string;
  version: string;
  requiresAck: boolean;
  acknowledgments: { id: number }[];
}

interface Employee {
  id: string;
  name: string;
  department: string;
  role: string | null;
  photoUrl: string | null;
  onboardingCompleted: boolean;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  info: FileText,
  video: Video,
  quiz: HelpCircle,
  policy: Shield,
  tour: Compass,
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Général",
  security: "Sécurité",
  hr: "Ressources Humaines",
  conduct: "Code de conduite",
  remote: "Travail à distance",
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employeeId");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [pendingPolicies, setPendingPolicies] = useState<Policy[]>([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percent: 0 });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showPolicies, setShowPolicies] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchOnboardingData();
    }
  }, [employeeId]);

  const fetchOnboardingData = async () => {
    try {
      const res = await fetch(`/api/onboarding?employeeId=${employeeId}`);
      const data = await res.json();
      
      setEmployee(data.employee);
      setSteps(data.steps);
      setPendingPolicies(data.pendingPolicies);
      setProgress(data.progress);
      setIsComplete(data.isComplete);

      // Trouver la première étape non complétée
      const firstIncomplete = data.steps.findIndex((s: OnboardingStep) => s.status !== "completed");
      if (firstIncomplete >= 0) {
        setCurrentStepIndex(firstIncomplete);
      }
    } catch (error) {
      console.error("Erreur chargement onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: number) => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          stepId,
          status: "completed"
        })
      });

      // Rafraîchir les données
      await fetchOnboardingData();

      // Passer à l'étape suivante
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else if (pendingPolicies.length > 0) {
        setShowPolicies(true);
      }
    } catch (error) {
      console.error("Erreur completion étape:", error);
    }
  };

  const acknowledgePolicy = async (policyId: number) => {
    try {
      await fetch("/api/policies/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, policyId })
      });

      // Rafraîchir les données
      await fetchOnboardingData();
    } catch (error) {
      console.error("Erreur acknowledgment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement de votre parcours...</p>
        </div>
      </div>
    );
  }

  if (!employeeId || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 max-w-md text-center border border-slate-700">
          <Rocket className="h-16 w-16 text-violet-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Bienvenue chez Nukleo</h1>
          <p className="text-slate-400 mb-6">
            Pour commencer votre parcours d'intégration, veuillez vous connecter ou contacter votre responsable.
          </p>
          <button
            onClick={() => router.push("/teams")}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Retour aux équipes
          </button>
        </div>
      </div>
    );
  }

  // Écran de félicitations si l'onboarding est terminé
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 max-w-lg text-center border border-slate-700">
          <div className="relative mb-6">
            <PartyPopper className="h-20 w-20 text-yellow-400 mx-auto" />
            <Sparkles className="h-8 w-8 text-violet-400 absolute top-0 right-1/4 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Félicitations, {employee.name}!</h1>
          <p className="text-slate-400 mb-6">
            Vous avez terminé votre parcours d'intégration. Bienvenue dans l'équipe {employee.department}!
          </p>
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-4">
              <Award className="h-10 w-10 text-violet-400" />
              <div className="text-left">
                <p className="text-sm text-slate-400">Badge obtenu</p>
                <p className="text-lg font-semibold text-white">Membre Nukleo</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/teams")}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Commencer à travailler
          </button>
        </div>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep ? STEP_ICONS[currentStep.type] || FileText : FileText;

  // Affichage des politiques à valider
  if (showPolicies && pendingPolicies.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-violet-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Politiques internes</h1>
            <p className="text-slate-400">
              Veuillez lire et accepter les politiques suivantes pour continuer
            </p>
          </div>

          <div className="space-y-4">
            {pendingPolicies.map((policy) => (
              <div key={policy.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 mb-2 inline-block">
                        {CATEGORY_LABELS[policy.category] || policy.category}
                      </span>
                      <h3 className="text-xl font-semibold text-white">{policy.title}</h3>
                      <p className="text-sm text-slate-400">Version {policy.version}</p>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none mb-6 max-h-64 overflow-y-auto bg-slate-900/50 rounded-xl p-4">
                    <div dangerouslySetInnerHTML={{ __html: typeof window !== "undefined" ? DOMPurify.sanitize(policy.content.replace(/\n/g, "<br/>")) : policy.content.replace(/\n/g, "<br/>") }} />
                  </div>
                  <button
                    onClick={() => acknowledgePolicy(policy.id)}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    J'ai lu et j'accepte cette politique
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {employee.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-white font-semibold">{employee.name}</h2>
                <p className="text-sm text-slate-400">{employee.department} • {employee.role || "Nouveau membre"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Progression</p>
                <p className="text-lg font-semibold text-white">{progress.percent}%</p>
              </div>
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Liste des étapes */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-violet-400" />
                Votre parcours
              </h3>
              <div className="space-y-2">
                {steps.map((step, index) => {
                  const Icon = STEP_ICONS[step.type] || FileText;
                  const isActive = index === currentStepIndex;
                  const isCompleted = step.status === "completed";

                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStepIndex(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        isActive
                          ? "bg-violet-600/20 border border-violet-500/50"
                          : isCompleted
                          ? "bg-slate-700/30 hover:bg-slate-700/50"
                          : "hover:bg-slate-700/30"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      ) : isActive ? (
                        <Play className="h-5 w-5 text-violet-400 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isActive ? "text-white" : isCompleted ? "text-slate-300" : "text-slate-400"
                        }`}>
                          {step.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Icon className="h-3 w-3" />
                          <span>{step.duration} min</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Politiques */}
                <button
                  onClick={() => setShowPolicies(true)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    pendingPolicies.length === 0
                      ? "bg-slate-700/30"
                      : "hover:bg-slate-700/30"
                  }`}
                >
                  {pendingPolicies.length === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <Shield className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-300">Politiques internes</p>
                    <p className="text-xs text-slate-500">
                      {pendingPolicies.length === 0 
                        ? "Toutes acceptées" 
                        : `${pendingPolicies.length} en attente`}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {currentStep && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden">
                {/* En-tête de l'étape */}
                <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 p-6 border-b border-slate-700/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-violet-500/20">
                      <StepIcon className="h-8 w-8 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          Étape {currentStepIndex + 1} / {steps.length}
                        </span>
                        {currentStep.role && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                            {currentStep.role}
                          </span>
                        )}
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-1">{currentStep.title}</h1>
                      <p className="text-slate-400">{currentStep.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{currentStep.duration} min</span>
                    </div>
                  </div>
                </div>

                {/* Contenu de l'étape */}
                <div className="p-6">
                  <div className="prose prose-invert prose-lg max-w-none mb-8">
                    <div dangerouslySetInnerHTML={{ __html: typeof window !== "undefined" ? DOMPurify.sanitize(currentStep.content.replace(/\n/g, "<br/>")) : currentStep.content.replace(/\n/g, "<br/>") }} />
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                    <button
                      onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                      disabled={currentStepIndex === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      Précédent
                    </button>

                    {currentStep.status === "completed" ? (
                      <button
                        onClick={() => {
                          if (currentStepIndex < steps.length - 1) {
                            setCurrentStepIndex(currentStepIndex + 1);
                          } else if (pendingPolicies.length > 0) {
                            setShowPolicies(true);
                          }
                        }}
                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                      >
                        {currentStepIndex < steps.length - 1 ? "Suivant" : "Voir les politiques"}
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => completeStep(currentStep.id)}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Marquer comme terminé
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Chargement de votre parcours...</p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingContent />
    </Suspense>
  );
}
