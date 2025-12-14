"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  ArrowLeft,
  Users,
  BarChart3,
  Download,
  Loader2,
  CheckCircle2,
  User,
} from "lucide-react";

interface SurveyQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options: string | null;
  isRequired: boolean;
  order: number;
  scaleMin: number | null;
  scaleMax: number | null;
}

interface SurveyAnswer {
  id: string;
  questionId: string;
  textAnswer: string | null;
  choiceAnswer: string | null;
  choicesAnswer: string | null;
  scaleAnswer: number | null;
}

interface SurveyResponse {
  id: string;
  employee: { id: string; name: string; department: string } | null;
  answers: SurveyAnswer[];
  completedAt: string;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  isAnonymous: boolean;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
}

export default function SurveyResultsPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveyResults();
  }, [surveyId]);

  async function fetchSurveyResults() {
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}`);
      if (res.ok) {
        const data = await res.json();
        setSurvey(data);
      }
    } catch (error) {
      console.error("Error fetching survey results:", error);
    } finally {
      setLoading(false);
    }
  }

  function getQuestionStats(question: SurveyQuestion) {
    const answers = survey?.responses.flatMap(r => 
      r.answers.filter(a => a.questionId === question.id)
    ) || [];

    if (question.questionType === "text") {
      return {
        type: "text",
        responses: answers.map(a => a.textAnswer).filter(Boolean),
      };
    }

    if (question.questionType === "multiple_choice" || question.questionType === "yes_no") {
      const options = question.questionType === "yes_no" 
        ? ["Oui", "Non"]
        : (question.options ? JSON.parse(question.options) : []);
      
      const counts: Record<string, number> = {};
      options.forEach((opt: string) => { counts[opt] = 0; });
      
      answers.forEach(a => {
        if (a.choiceAnswer && counts[a.choiceAnswer] !== undefined) {
          counts[a.choiceAnswer]++;
        }
      });

      return {
        type: "choice",
        options,
        counts,
        total: answers.length,
      };
    }

    if (question.questionType === "checkbox") {
      const options = question.options ? JSON.parse(question.options) : [];
      const counts: Record<string, number> = {};
      options.forEach((opt: string) => { counts[opt] = 0; });

      answers.forEach(a => {
        if (a.choicesAnswer) {
          const selected = JSON.parse(a.choicesAnswer);
          selected.forEach((s: string) => {
            if (counts[s] !== undefined) counts[s]++;
          });
        }
      });

      return {
        type: "checkbox",
        options,
        counts,
        total: answers.length,
      };
    }

    if (question.questionType === "rating") {
      const values = answers.map(a => a.scaleAnswer).filter((v): v is number => v !== null);
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      
      const distribution: Record<number, number> = {};
      for (let i = (question.scaleMin || 1); i <= (question.scaleMax || 5); i++) {
        distribution[i] = 0;
      }
      values.forEach(v => {
        if (distribution[v] !== undefined) distribution[v]++;
      });

      return {
        type: "rating",
        average: avg,
        distribution,
        total: values.length,
        min: question.scaleMin || 1,
        max: question.scaleMax || 5,
      };
    }

    return { type: "unknown" };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <p className="text-slate-400">Sondage non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/surveys" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-indigo-400" />
                Résultats du sondage
              </h1>
              <p className="text-slate-400">{survey.title}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Users className="w-4 h-4" />
              Réponses
            </div>
            <p className="text-2xl font-bold">{survey.responses.length}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <ClipboardList className="w-4 h-4" />
              Questions
            </div>
            <p className="text-2xl font-bold">{survey.questions.length}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Statut
            </div>
            <p className={`text-lg font-bold ${
              survey.status === "active" ? "text-green-400" :
              survey.status === "closed" ? "text-red-400" : "text-slate-400"
            }`}>
              {survey.status === "active" ? "Actif" :
               survey.status === "closed" ? "Fermé" : "Brouillon"}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <User className="w-4 h-4" />
              Anonyme
            </div>
            <p className="text-lg font-bold">{survey.isAnonymous ? "Oui" : "Non"}</p>
          </div>
        </div>

        {/* Questions Results */}
        <div className="space-y-6">
          {survey.questions.sort((a, b) => a.order - b.order).map((question, idx) => {
            const stats = getQuestionStats(question);

            return (
              <div key={question.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">
                  {idx + 1}. {question.questionText}
                  {question.isRequired && <span className="text-red-400 ml-1">*</span>}
                </h3>

                {stats.type === "text" && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 mb-3">{(stats as any).responses.length} réponse(s)</p>
                    {(stats as any).responses.length === 0 ? (
                      <p className="text-slate-500 italic">Aucune réponse</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {(stats as any).responses.map((response: string, i: number) => (
                          <div key={i} className="p-3 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                            {response}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(stats.type === "choice" || stats.type === "checkbox") && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-400">{(stats as any).total} réponse(s)</p>
                    {(stats as any).options.map((option: string) => {
                      const count = (stats as any).counts[option] || 0;
                      const percentage = (stats as any).total > 0 ? (count / (stats as any).total) * 100 : 0;
                      
                      return (
                        <div key={option} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{option}</span>
                            <span className="text-slate-400">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {stats.type === "rating" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-indigo-400">
                          {(stats as any).average.toFixed(1)}
                        </p>
                        <p className="text-xs text-slate-400">Moyenne</p>
                      </div>
                      <div className="text-sm text-slate-400">
                        sur {(stats as any).total} réponse(s)
                      </div>
                    </div>
                    <div className="space-y-2">
                      {Object.entries((stats as any).distribution).map(([value, count]) => {
                        const percentage = (stats as any).total > 0 ? ((count as number) / (stats as any).total) * 100 : 0;
                        return (
                          <div key={value} className="flex items-center gap-3">
                            <span className="w-8 text-center text-sm text-slate-400">{value}</span>
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-xs text-slate-400">{count as number}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Respondents List (if not anonymous) */}
        {!survey.isAnonymous && survey.responses.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Répondants
            </h3>
            <div className="space-y-2">
              {survey.responses.map((response) => (
                <div key={response.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {response.employee?.name || "Anonyme"}
                      </p>
                      {response.employee?.department && (
                        <p className="text-xs text-slate-400">{response.employee.department}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(response.completedAt).toLocaleDateString("fr-CA")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
