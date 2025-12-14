"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  BarChart3,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  Save,
} from "lucide-react";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  targetType: string;
  targetDepartment: string | null;
  isAnonymous: boolean;
  questionCount: number;
  responseCount: number;
  createdAt: string;
}

interface SurveyQuestion {
  id?: string;
  questionText: string;
  questionType: string;
  options: string[];
  isRequired: boolean;
  order: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

const QUESTION_TYPES = [
  { value: "text", label: "Texte libre" },
  { value: "multiple_choice", label: "Choix unique" },
  { value: "checkbox", label: "Choix multiples" },
  { value: "rating", label: "Échelle de notation" },
  { value: "yes_no", label: "Oui / Non" },
];

const DEPARTMENTS = ["Lab", "Bureau", "Studio", "Admin"];

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetType: "all",
    targetDepartment: "",
    isAnonymous: false,
    startDate: "",
    endDate: "",
  });
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  useEffect(() => {
    fetchSurveys();
  }, []);

  async function fetchSurveys() {
    try {
      const res = await fetch("/api/admin/surveys");
      if (res.ok) {
        const data = await res.json();
        setSurveys(data.surveys || []);
      }
    } catch (error) {
      console.error("Error fetching surveys:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      targetType: "all",
      targetDepartment: "",
      isAnonymous: false,
      startDate: "",
      endDate: "",
    });
    setQuestions([]);
  }

  function openCreateModal() {
    resetForm();
    setEditingSurvey(null);
    setShowCreateModal(true);
  }

  async function openEditModal(survey: Survey) {
    setEditingSurvey(survey);
    setFormData({
      title: survey.title,
      description: survey.description || "",
      targetType: survey.targetType,
      targetDepartment: survey.targetDepartment || "",
      isAnonymous: survey.isAnonymous,
      startDate: survey.startDate ? survey.startDate.split("T")[0] : "",
      endDate: survey.endDate ? survey.endDate.split("T")[0] : "",
    });

    // Charger les questions
    try {
      const res = await fetch(`/api/admin/surveys/${survey.id}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options ? JSON.parse(q.options) : [],
          isRequired: q.isRequired,
          order: q.order,
          scaleMin: q.scaleMin,
          scaleMax: q.scaleMax,
          scaleMinLabel: q.scaleMinLabel,
          scaleMaxLabel: q.scaleMaxLabel,
        })));
      }
    } catch (error) {
      console.error("Error loading survey details:", error);
    }

    setShowCreateModal(true);
  }

  function addQuestion() {
    setQuestions([...questions, {
      questionText: "",
      questionType: "text",
      options: [],
      isRequired: true,
      order: questions.length,
    }]);
  }

  function updateQuestion(index: number, updates: Partial<SurveyQuestion>) {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, direction: "up" | "down") {
    if ((direction === "up" && index === 0) || (direction === "down" && index === questions.length - 1)) {
      return;
    }
    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
  }

  async function saveSurvey() {
    if (!formData.title.trim()) {
      alert("Veuillez entrer un titre");
      return;
    }
    if (questions.length === 0) {
      alert("Veuillez ajouter au moins une question");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        questions: questions.map((q, i) => ({
          ...q,
          order: i,
          options: q.options.length > 0 ? JSON.stringify(q.options) : null,
        })),
      };

      const url = editingSurvey ? `/api/admin/surveys/${editingSurvey.id}` : "/api/admin/surveys";
      const method = editingSurvey ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchSurveys();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving survey:", error);
    } finally {
      setSaving(false);
    }
  }

  async function updateSurveyStatus(surveyId: string, status: string) {
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchSurveys();
      }
    } catch (error) {
      console.error("Error updating survey status:", error);
    }
  }

  async function deleteSurvey(surveyId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce sondage ?")) return;

    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSurveys();
      }
    } catch (error) {
      console.error("Error deleting survey:", error);
    }
  }

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || survey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: surveys.length,
    draft: surveys.filter(s => s.status === "draft").length,
    active: surveys.filter(s => s.status === "active").length,
    closed: surveys.filter(s => s.status === "closed").length,
    totalResponses: surveys.reduce((acc, s) => acc + s.responseCount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="w-7 h-7 text-indigo-400" />
                Gestion des sondages
              </h1>
              <p className="text-slate-400 text-sm">Créez et gérez les sondages pour les employés</p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau sondage
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <ClipboardList className="w-4 h-4" />
              Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Edit2 className="w-4 h-4" />
              Brouillons
            </div>
            <p className="text-2xl font-bold text-slate-400">{stats.draft}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Actifs
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
              <XCircle className="w-4 h-4" />
              Fermés
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.closed}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-indigo-400 text-sm mb-1">
              <Users className="w-4 h-4" />
              Réponses
            </div>
            <p className="text-2xl font-bold text-indigo-400">{stats.totalResponses}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="active">Actifs</option>
              <option value="closed">Fermés</option>
            </select>
          </div>
        </div>

        {/* Surveys List */}
        <div className="space-y-4">
          {filteredSurveys.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-xl">
              <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Aucun sondage trouvé</p>
              <button
                onClick={openCreateModal}
                className="mt-4 text-indigo-400 hover:text-indigo-300"
              >
                Créer un sondage
              </button>
            </div>
          ) : (
            filteredSurveys.map((survey) => (
              <div key={survey.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">{survey.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        survey.status === "draft" ? "bg-slate-500/20 text-slate-400" :
                        survey.status === "active" ? "bg-green-500/20 text-green-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {survey.status === "draft" ? "Brouillon" :
                         survey.status === "active" ? "Actif" : "Fermé"}
                      </span>
                    </div>
                    {survey.description && (
                      <p className="text-sm text-slate-400 mt-1">{survey.description}</p>
                    )}
                    <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" />
                        {survey.questionCount} question{survey.questionCount > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {survey.responseCount} réponse{survey.responseCount > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {survey.targetType === "all" ? "Tous les employés" :
                         survey.targetType === "department" ? `Département: ${survey.targetDepartment}` : "Spécifique"}
                      </span>
                      {survey.isAnonymous && (
                        <span className="px-2 py-0.5 bg-slate-700 rounded">Anonyme</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {survey.status === "draft" && (
                      <button
                        onClick={() => updateSurveyStatus(survey.id, "active")}
                        className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                        title="Activer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    {survey.status === "active" && (
                      <button
                        onClick={() => updateSurveyStatus(survey.id, "closed")}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Fermer"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    <Link
                      href={`/admin/surveys/${survey.id}/results`}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Voir les résultats"
                    >
                      <BarChart3 className="w-5 h-5 text-slate-400" />
                    </Link>
                    <button
                      onClick={() => openEditModal(survey)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => deleteSurvey(survey.id)}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl my-8">
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-400" />
                  {editingSurvey ? "Modifier le sondage" : "Nouveau sondage"}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Titre *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titre du sondage"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      placeholder="Description optionnelle"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Cible</label>
                      <select
                        value={formData.targetType}
                        onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">Tous les employés</option>
                        <option value="department">Par département</option>
                      </select>
                    </div>
                    {formData.targetType === "department" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Département</label>
                        <select
                          value={formData.targetDepartment}
                          onChange={(e) => setFormData({ ...formData, targetDepartment: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Sélectionner...</option>
                          {DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Date de début</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Date de fin</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAnonymous}
                      onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-slate-300">Réponses anonymes</span>
                  </label>
                </div>

                {/* Questions */}
                <div className="border-t border-slate-700 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-white">Questions</h3>
                    <button
                      onClick={addQuestion}
                      className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une question
                    </button>
                  </div>
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={index} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveQuestion(index, "up")}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveQuestion(index, "down")}
                              disabled={index === questions.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex gap-3">
                              <input
                                type="text"
                                value={question.questionText}
                                onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
                                placeholder={`Question ${index + 1}`}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <select
                                value={question.questionType}
                                onChange={(e) => updateQuestion(index, { questionType: e.target.value, options: [] })}
                                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {QUESTION_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>

                            {(question.questionType === "multiple_choice" || question.questionType === "checkbox") && (
                              <div className="space-y-2">
                                <label className="text-xs text-slate-400">Options (une par ligne)</label>
                                <textarea
                                  value={question.options.join("\n")}
                                  onChange={(e) => updateQuestion(index, { options: e.target.value.split("\n").filter(o => o.trim()) })}
                                  rows={3}
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                                />
                              </div>
                            )}

                            {question.questionType === "rating" && (
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-slate-400">Min:</label>
                                  <input
                                    type="number"
                                    value={question.scaleMin || 1}
                                    onChange={(e) => updateQuestion(index, { scaleMin: parseInt(e.target.value) })}
                                    className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-slate-400">Max:</label>
                                  <input
                                    type="number"
                                    value={question.scaleMax || 5}
                                    onChange={(e) => updateQuestion(index, { scaleMax: parseInt(e.target.value) })}
                                    className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                  />
                                </div>
                              </div>
                            )}

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={question.isRequired}
                                onChange={(e) => updateQuestion(index, { isRequired: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded"
                              />
                              <span className="text-sm text-slate-300">Obligatoire</span>
                            </label>
                          </div>
                          <button
                            onClick={() => removeQuestion(index)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {questions.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        Aucune question. Cliquez sur "Ajouter une question" pour commencer.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveSurvey}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingSurvey ? "Enregistrer" : "Créer le sondage"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
