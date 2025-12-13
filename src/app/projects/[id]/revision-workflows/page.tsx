"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Users,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  Filter,
  CheckSquare,
  FileCheck,
} from "lucide-react";

interface RevisionWorkflow {
  deliverable: {
    id: string;
    title: string | null;
    type: string | null;
  };
  version: {
    id: string;
    versionNumber: number;
    status: string;
    fileUrl: string | null;
    changeLog: string | null;
    createdAt: string;
  };
  workflow: {
    id: string;
    workflowType: string;
    currentLevel: number;
    status: string;
    revisionRound: number;
    createdAt: string;
    updatedAt: string;
    levels: Array<{
      id: string;
      levelNumber: number;
      name: string;
      description: string | null;
      approverType: string;
      approverName: string | null;
      status: string;
      deadline: string | null;
      approvers: Array<{
        id: string;
        approverName: string;
        status: string;
        approvedAt: string | null;
        comments: string | null;
      }>;
      comments: Array<{
        id: string;
        commentType: string;
        content: string;
        authorName: string;
        createdAt: string;
      }>;
    }>;
    revisions: Array<{
      id: string;
      roundNumber: number;
      status: string;
      requestedBy: string;
      reason: string | null;
      createdAt: string;
    }>;
    checklist: {
      id: string;
      status: string;
      overallScore: number | null;
      items: Array<{
        id: string;
        category: string;
        title: string;
        status: string;
        checkedBy: string | null;
      }>;
    } | null;
  } | null;
}

export default function RevisionWorkflowsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [workflows, setWorkflows] = useState<RevisionWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<RevisionWorkflow | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, [projectId]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/revision-workflows`);
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "in_review":
        return <Clock className="w-5 h-5 text-blue-400" />;
      case "revision_requested":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "in_review":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "revision_requested":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const filteredWorkflows = workflows.filter((w) => {
    if (filterStatus === "all") return true;
    return w.workflow?.status === filterStatus;
  });

  const statusCounts = {
    all: workflows.length,
    draft: workflows.filter((w) => w.workflow?.status === "draft").length,
    in_review: workflows.filter((w) => w.workflow?.status === "in_review").length,
    revision_requested: workflows.filter((w) => w.workflow?.status === "revision_requested").length,
    approved: workflows.filter((w) => w.workflow?.status === "approved").length,
    rejected: workflows.filter((w) => w.workflow?.status === "rejected").length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="p-8">
          {/* Navigation */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href={`/projects/${projectId}/documents`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Documents
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Workflows de révision</span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Workflows de révision</h1>
              <p className="text-muted-foreground mt-1">
                Suivi des workflows de révision structurés pour ce projet
              </p>
            </div>
            <button
              onClick={fetchWorkflows}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {[
              { value: "all", label: "Tous" },
              { value: "draft", label: "Brouillon" },
              { value: "in_review", label: "En révision" },
              { value: "revision_requested", label: "Révision demandée" },
              { value: "approved", label: "Approuvé" },
              { value: "rejected", label: "Rejeté" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {filter.label} ({statusCounts[filter.value as keyof typeof statusCounts]})
              </button>
            ))}
          </div>

          {/* Workflows List */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement des workflows...</p>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun workflow de révision trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <div
                  key={workflow.workflow?.id}
                  className={`border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors ${getStatusColor(workflow.workflow?.status || "draft")}`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(workflow.workflow?.status || "draft")}
                        <h3 className="text-lg font-semibold text-foreground">
                          {workflow.deliverable.title || "Livrable sans titre"}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-muted rounded-full">
                          Version {workflow.version.versionNumber}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(workflow.workflow?.status || "draft")}`}>
                          {workflow.workflow?.status === "approved" && "Approuvé"}
                          {workflow.workflow?.status === "rejected" && "Rejeté"}
                          {workflow.workflow?.status === "in_review" && "En révision"}
                          {workflow.workflow?.status === "revision_requested" && "Révision demandée"}
                          {workflow.workflow?.status === "draft" && "Brouillon"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {workflow.deliverable.type || "Type non spécifié"}
                      </p>

                      {/* Workflow Progress */}
                      {workflow.workflow && (
                        <div className="space-y-3">
                          {/* Levels Progress */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Niveaux d'approbation:</span>
                            <div className="flex-1 flex items-center gap-1">
                              {workflow.workflow.levels.map((level, idx) => (
                                <div
                                  key={level.id}
                                  className={`flex-1 h-2 rounded-full ${
                                    level.status === "approved"
                                      ? "bg-green-500"
                                      : level.status === "rejected"
                                      ? "bg-red-500"
                                      : idx < workflow.workflow!.currentLevel - 1
                                      ? "bg-blue-500"
                                      : idx === workflow.workflow!.currentLevel - 1
                                      ? "bg-yellow-500"
                                      : "bg-gray-300"
                                  }`}
                                  title={level.name}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {workflow.workflow.currentLevel}/{workflow.workflow.levels.length}
                            </span>
                          </div>

                          {/* Current Level Info */}
                          {workflow.workflow.levels[workflow.workflow.currentLevel - 1] && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Niveau actuel:</span>{" "}
                              {workflow.workflow.levels[workflow.workflow.currentLevel - 1].name}
                              {workflow.workflow.levels[workflow.workflow.currentLevel - 1].approverName && (
                                <span className="ml-2">
                                  ({workflow.workflow.levels[workflow.workflow.currentLevel - 1].approverName})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>
                                {workflow.workflow.levels.reduce((sum, l) => sum + l.approvers.length, 0)} approbateur(s)
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>
                                {workflow.workflow.levels.reduce((sum, l) => sum + l.comments.length, 0)} commentaire(s)
                              </span>
                            </div>
                            {workflow.workflow.revisionRound > 1 && (
                              <div className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                <span>Round {workflow.workflow.revisionRound}</span>
                              </div>
                            )}
                            {workflow.workflow.checklist && (
                              <div className="flex items-center gap-1">
                                <CheckSquare className="w-3 h-3" />
                                <span>
                                  {workflow.workflow.checklist.items.filter((i) => i.status === "passed").length}/
                                  {workflow.workflow.checklist.items.length} checks
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Detail Modal */}
        {selectedWorkflow && (
          <WorkflowDetailModal
            workflow={selectedWorkflow}
            onClose={() => setSelectedWorkflow(null)}
            onUpdate={fetchWorkflows}
          />
        )}
      </main>
    </div>
  );
}

// Modal pour afficher les détails d'un workflow
function WorkflowDetailModal({
  workflow,
  onClose,
  onUpdate,
}: {
  workflow: RevisionWorkflow;
  onClose: () => void;
  onUpdate: () => void;
}) {
  if (!workflow.workflow) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{workflow.deliverable.title}</h2>
            <p className="text-sm text-muted-foreground">
              Version {workflow.version.versionNumber} • {workflow.deliverable.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Workflow Status */}
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg ${getStatusColor(workflow.workflow.status)}`}>
              {workflow.workflow.status}
            </div>
            <span className="text-sm text-muted-foreground">
              Round de révision: {workflow.workflow.revisionRound}
            </span>
          </div>

          {/* Approval Levels */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Niveaux d'approbation</h3>
            <div className="space-y-4">
              {workflow.workflow.levels.map((level) => (
                <div
                  key={level.id}
                  className={`border rounded-lg p-4 ${
                    level.levelNumber === workflow.workflow!.currentLevel
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Niveau {level.levelNumber}: {level.name}
                      </span>
                      {level.status === "approved" && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                      {level.status === "rejected" && <XCircle className="w-4 h-4 text-red-400" />}
                      {level.status === "pending" && <Clock className="w-4 h-4 text-gray-400" />}
                      {level.status === "in_progress" && <Clock className="w-4 h-4 text-blue-400 animate-pulse" />}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(level.status)}`}>
                      {level.status}
                    </span>
                  </div>
                  {level.description && (
                    <p className="text-sm text-muted-foreground mb-3">{level.description}</p>
                  )}

                  {/* Approvers */}
                  {level.approvers.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Approbateurs:</p>
                      {level.approvers.map((approver) => (
                        <div
                          key={approver.id}
                          className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2"
                        >
                          <span className="text-foreground">{approver.approverName}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(approver.status)}`}>
                            {approver.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comments */}
                  {level.comments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Commentaires:</p>
                      {level.comments.map((comment) => (
                        <div key={comment.id} className="text-sm bg-muted/30 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quality Checklist */}
          {workflow.workflow.checklist && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Checklist qualité</h3>
              <div className="space-y-2">
                {workflow.workflow.checklist.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {item.status === "passed" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      {item.status === "failed" && <XCircle className="w-4 h-4 text-red-400" />}
                      {item.status === "pending" && <Clock className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm text-foreground">{item.title}</span>
                      <span className="text-xs text-muted-foreground">({item.category})</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
    case "passed":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "rejected":
    case "failed":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "in_review":
    case "in_progress":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "revision_requested":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
}
