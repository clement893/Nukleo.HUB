"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  Video,
  HelpCircle,
  Shield,
  Compass,
  GripVertical,
  Clock,
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
}

interface Policy {
  id: number;
  title: string;
  content: string;
  category: string;
  version: string;
  isActive: boolean;
  requiresAck: boolean;
}

const STEP_TYPES = [
  { value: "info", label: "Information", icon: FileText },
  { value: "video", label: "Vidéo", icon: Video },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
  { value: "policy", label: "Politique", icon: Shield },
  { value: "tour", label: "Tour guidé", icon: Compass },
];

const POLICY_CATEGORIES = [
  { value: "general", label: "Général" },
  { value: "security", label: "Sécurité" },
  { value: "hr", label: "Ressources Humaines" },
  { value: "conduct", label: "Code de conduite" },
  { value: "remote", label: "Travail à distance" },
];

const ROLES = [
  { value: "", label: "Tous les rôles" },
  { value: "Lab", label: "Lab" },
  { value: "Bureau", label: "Bureau" },
  { value: "Studio", label: "Studio" },
  { value: "Admin", label: "Admin" },
];

export default function AdminOnboardingPage() {
  const [activeTab, setActiveTab] = useState<"steps" | "policies">("steps");
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [showStepForm, setShowStepForm] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);

  // Form states
  const [stepForm, setStepForm] = useState({
    title: "",
    description: "",
    content: "",
    type: "info",
    role: "",
    isRequired: true,
    duration: 5,
  });

  const [policyForm, setPolicyForm] = useState({
    title: "",
    content: "",
    category: "general",
    version: "1.0",
    isActive: true,
    requiresAck: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stepsRes, policiesRes] = await Promise.all([
        fetch("/api/onboarding/steps"),
        fetch("/api/policies"),
      ]);
      const stepsData = await stepsRes.json();
      const policiesData = await policiesRes.json();
      setSteps(stepsData);
      setPolicies(policiesData);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveStep = async () => {
    try {
      const method = editingStep ? "PUT" : "POST";
      const body = editingStep
        ? { id: editingStep.id, ...stepForm }
        : stepForm;

      await fetch("/api/onboarding/steps", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await fetchData();
      resetStepForm();
    } catch (error) {
      console.error("Erreur sauvegarde étape:", error);
    }
  };

  const deleteStep = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette étape?")) return;
    try {
      await fetch(`/api/onboarding/steps?id=${id}`, { method: "DELETE" });
      await fetchData();
    } catch (error) {
      console.error("Erreur suppression étape:", error);
    }
  };

  const savePolicy = async () => {
    try {
      const method = editingPolicy ? "PUT" : "POST";
      const body = editingPolicy
        ? { id: editingPolicy.id, ...policyForm }
        : policyForm;

      await fetch("/api/policies", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await fetchData();
      resetPolicyForm();
    } catch (error) {
      console.error("Erreur sauvegarde politique:", error);
    }
  };

  const resetStepForm = () => {
    setStepForm({
      title: "",
      description: "",
      content: "",
      type: "info",
      role: "",
      isRequired: true,
      duration: 5,
    });
    setEditingStep(null);
    setShowStepForm(false);
  };

  const resetPolicyForm = () => {
    setPolicyForm({
      title: "",
      content: "",
      category: "general",
      version: "1.0",
      isActive: true,
      requiresAck: true,
    });
    setEditingPolicy(null);
    setShowPolicyForm(false);
  };

  const editStep = (step: OnboardingStep) => {
    setStepForm({
      title: step.title,
      description: step.description,
      content: step.content,
      type: step.type,
      role: step.role || "",
      isRequired: step.isRequired,
      duration: step.duration,
    });
    setEditingStep(step);
    setShowStepForm(true);
  };

  const editPolicy = (policy: Policy) => {
    setPolicyForm({
      title: policy.title,
      content: policy.content,
      category: policy.category,
      version: policy.version,
      isActive: policy.isActive,
      requiresAck: policy.requiresAck,
    });
    setEditingPolicy(policy);
    setShowPolicyForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Administration Onboarding</h1>
              <p className="text-sm text-muted-foreground">
                Gérez les étapes d'intégration et les politiques internes
              </p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("steps")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "steps"
                  ? "bg-violet-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Étapes d'onboarding
            </button>
            <button
              onClick={() => setActiveTab("policies")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "policies"
                  ? "bg-violet-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Politiques internes
            </button>
          </div>

          {/* Steps Tab */}
          {activeTab === "steps" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {steps.length} étape{steps.length > 1 ? "s" : ""} configurée{steps.length > 1 ? "s" : ""}
                </h2>
                <button
                  onClick={() => setShowStepForm(true)}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle étape
                </button>
              </div>

              {/* Step Form Modal */}
              {showStepForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        {editingStep ? "Modifier l'étape" : "Nouvelle étape"}
                      </h3>
                      <button onClick={resetStepForm} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Titre</label>
                        <input
                          type="text"
                          value={stepForm.title}
                          onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                          placeholder="Ex: Bienvenue chez Nukleo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                        <input
                          type="text"
                          value={stepForm.description}
                          onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                          placeholder="Brève description de l'étape"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Contenu</label>
                        <textarea
                          value={stepForm.content}
                          onChange={(e) => setStepForm({ ...stepForm, content: e.target.value })}
                          rows={6}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                          placeholder="Contenu détaillé de l'étape..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                          <select
                            value={stepForm.type}
                            onChange={(e) => setStepForm({ ...stepForm, type: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                          >
                            {STEP_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Rôle cible</label>
                          <select
                            value={stepForm.role}
                            onChange={(e) => setStepForm({ ...stepForm, role: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                          >
                            {ROLES.map((role) => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Durée (minutes)</label>
                          <input
                            type="number"
                            value={stepForm.duration}
                            onChange={(e) => setStepForm({ ...stepForm, duration: parseInt(e.target.value) || 5 })}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                            min="1"
                          />
                        </div>
                        <div className="flex items-center gap-4 pt-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={stepForm.isRequired}
                              onChange={(e) => setStepForm({ ...stepForm, isRequired: e.target.checked })}
                              className="rounded border-border"
                            />
                            <span className="text-sm text-foreground">Obligatoire</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 border-t border-border flex justify-end gap-3">
                      <button
                        onClick={resetStepForm}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveStep}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Steps List */}
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const TypeIcon = STEP_TYPES.find((t) => t.value === step.type)?.icon || FileText;
                  return (
                    <div
                      key={step.id}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="text-muted-foreground cursor-grab">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <TypeIcon className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          <h3 className="font-medium text-foreground">{step.title}</h3>
                          {step.role && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                              {step.role}
                            </span>
                          )}
                          {step.isRequired && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                              Obligatoire
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{step.duration} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editStep(step)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteStep(step.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {steps.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune étape d'onboarding configurée</p>
                    <p className="text-sm">Créez votre première étape pour commencer</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === "policies" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {policies.length} politique{policies.length > 1 ? "s" : ""} configurée{policies.length > 1 ? "s" : ""}
                </h2>
                <button
                  onClick={() => setShowPolicyForm(true)}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle politique
                </button>
              </div>

              {/* Policy Form Modal */}
              {showPolicyForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        {editingPolicy ? "Modifier la politique" : "Nouvelle politique"}
                      </h3>
                      <button onClick={resetPolicyForm} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Titre</label>
                        <input
                          type="text"
                          value={policyForm.title}
                          onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                          placeholder="Ex: Politique de confidentialité"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Contenu</label>
                        <textarea
                          value={policyForm.content}
                          onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                          rows={10}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                          placeholder="Contenu de la politique..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Catégorie</label>
                          <select
                            value={policyForm.category}
                            onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                          >
                            {POLICY_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Version</label>
                          <input
                            type="text"
                            value={policyForm.version}
                            onChange={(e) => setPolicyForm({ ...policyForm, version: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground"
                            placeholder="1.0"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={policyForm.isActive}
                            onChange={(e) => setPolicyForm({ ...policyForm, isActive: e.target.checked })}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={policyForm.requiresAck}
                            onChange={(e) => setPolicyForm({ ...policyForm, requiresAck: e.target.checked })}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">Requiert acceptation</span>
                        </label>
                      </div>
                    </div>
                    <div className="p-6 border-t border-border flex justify-end gap-3">
                      <button
                        onClick={resetPolicyForm}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={savePolicy}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Policies List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{policy.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{POLICY_CATEGORIES.find((c) => c.value === policy.category)?.label}</span>
                            <span>•</span>
                            <span>v{policy.version}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => editPolicy(policy)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {policy.content}
                    </p>
                    <div className="flex items-center gap-2">
                      {policy.isActive ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">
                          Inactive
                        </span>
                      )}
                      {policy.requiresAck && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                          Acceptation requise
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {policies.length === 0 && !loading && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune politique configurée</p>
                    <p className="text-sm">Créez votre première politique pour commencer</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
