"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { SignaturePad } from "@/components/SignaturePad";
import {
  Send,
  MessageSquare,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  Calendar,
  Target,
  FileText,
  Bell,
  Download,
  Video,
  Phone,
  MapPin,
  ChevronRight,
  ThumbsUp,
  MessageCircle,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  X,
  ExternalLink,
  Play,
  Pause,
  Settings,
  Home,
  Briefcase,
  Mail,
  Image,
  File,
  Archive,
  Folder,
  Star,
  Filter,
  PenTool,
  History,
  CheckCircle,
  XCircle,
  FileCheck,
} from "lucide-react";

// Types
interface PortalData {
  portal: {
    id: string;
    clientName: string;
    clientEmail: string | null;
    welcomeMessage: string | null;
  };
  projects: Project[];
  tickets: Ticket[];
}

interface Project {
  id: string;
  name: string;
  status: string | null;
  stage: string | null;
  projectType: string | null;
  timeline: string | null;
  description: string | null;
  milestones: Milestone[];
  _count: { tasks: number; milestones: number };
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  deliverables: string | null;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string | null;
  priority: string;
  status: string;
  createdAt: string;
  responses: TicketResponse[];
}

interface TicketResponse {
  id: string;
  content: string;
  authorType: string;
  authorName: string | null;
  createdAt: string;
}

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: string | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  version: number;
  clientFeedback: string | null;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderType: string;
  senderName: string;
  attachments: string | null;
  createdAt: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ClientFile {
  id: string;
  name: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  category: string | null;
  uploadedBy: string;
  createdAt: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meetingDate: string;
  duration: number | null;
  location: string | null;
  meetingType: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface BudgetData {
  budgets: Array<{
    id: string;
    projectId: string | null;
    totalBudget: number;
    spentAmount: number;
    currency: string;
    breakdown: string | null;
  }>;
  summary: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    percentUsed: number;
  };
}

interface MilestoneData {
  milestones: Array<{
    id: string;
    title: string;
    description: string | null;
    phase: string | null;
    status: string;
    dueDate: string | null;
    completedAt: string | null;
    order: number;
  }>;
  progress: {
    total: number;
    completed: number;
    inProgress: number;
    upcoming: number;
    percentage: number;
  };
}

// Navigation tabs
const tabs = [
  { id: "dashboard", label: "Tableau de bord", icon: Home },
  { id: "projects", label: "Projets", icon: Briefcase },
  { id: "deliverables", label: "Livrables", icon: FileText },
  { id: "financial", label: "Financier", icon: DollarSign },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "files", label: "Fichiers", icon: FolderOpen },
  { id: "meetings", label: "Réunions", icon: Calendar },
  { id: "support", label: "Support", icon: MessageCircle },
];

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [deliverableFeedback, setDeliverableFeedback] = useState("");
  const [workflow, setWorkflow] = useState<any>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [projectHistory, setProjectHistory] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectMetrics, setProjectMetrics] = useState<any>(null);
  const [projectTimeline, setProjectTimeline] = useState<any>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch portal data
  useEffect(() => {
    fetchPortalData();
    fetchNotifications();
  }, [token]);

  // Fetch tab-specific data
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboard();
      fetchMilestones();
    }
    if (activeTab === "deliverables") fetchDeliverables();
    if (activeTab === "financial") fetchFinancial();
    if (activeTab === "projects") fetchProjectHistory();
    if (activeTab === "messages") fetchMessages();
    if (activeTab === "files") fetchFiles();
    if (activeTab === "meetings") fetchMeetings();
    if (activeTab === "budget") fetchBudget();
  }, [activeTab, token]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling for messages
  useEffect(() => {
    if (activeTab === "messages") {
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  async function fetchPortalData() {
    try {
      const res = await fetch(`/api/portal/${token}`);
      if (res.ok) {
        const data = await res.json();
        setPortalData(data);
        if (data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDeliverables() {
    try {
      const res = await fetch(`/api/portal/${token}/deliverables`);
      if (res.ok) {
        const data = await res.json();
        setDeliverables(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/portal/${token}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchNotifications() {
    try {
      const res = await fetch(`/api/portal/${token}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchFiles() {
    try {
      const res = await fetch(`/api/portal/${token}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchMeetings() {
    try {
      const res = await fetch(`/api/portal/${token}/meetings`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchBudget() {
    try {
      const res = await fetch(`/api/portal/${token}/budget`);
      if (res.ok) {
        const data = await res.json();
        setBudgetData(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchMilestones() {
    try {
      const res = await fetch(`/api/portal/${token}/milestones`);
      if (res.ok) {
        const data = await res.json();
        setMilestoneData(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchDashboard() {
    try {
      const res = await fetch(`/api/portal/${token}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchFinancial() {
    try {
      const res = await fetch(`/api/portal/${token}/financial`);
      if (res.ok) {
        const data = await res.json();
        setFinancialData(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchProjectHistory() {
    try {
      const res = await fetch(`/api/portal/${token}/projects/history`);
      if (res.ok) {
        const data = await res.json();
        setProjectHistory(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchProjectMetrics(projectId: string) {
    try {
      const res = await fetch(`/api/portal/${token}/projects/${projectId}/metrics`);
      if (res.ok) {
        const data = await res.json();
        setProjectMetrics(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function fetchProjectTimeline(projectId: string) {
    try {
      const res = await fetch(`/api/portal/${token}/projects/${projectId}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setProjectTimeline(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/portal/${token}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage, projectId: selectedProject }),
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setSendingMessage(false);
    }
  }

  async function fetchWorkflow(deliverableId: string) {
    setLoadingWorkflow(true);
    try {
      const res = await fetch(`/api/portal/${token}/deliverables/${deliverableId}/approval`);
      if (res.ok) {
        const data = await res.json();
        setWorkflow(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoadingWorkflow(false);
    }
  }

  async function fetchVersions(deliverableId: string) {
    try {
      const res = await fetch(`/api/portal/${token}/deliverables/${deliverableId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function handleDeliverableAction(action: string) {
    if (!selectedDeliverable) return;
    
    try {
      const res = await fetch(`/api/portal/${token}/deliverables`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverableId: selectedDeliverable.id,
          action,
          feedback: deliverableFeedback,
        }),
      });
      if (res.ok) {
        setShowDeliverableModal(false);
        setSelectedDeliverable(null);
        setDeliverableFeedback("");
        fetchDeliverables();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function handleWorkflowStepAction(stepId: string, action: "approve" | "reject" | "request_revision") {
    if (!selectedDeliverable) return;
    
    try {
      const res = await fetch(`/api/portal/${token}/deliverables/${selectedDeliverable.id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "approve" ? "approve_step" : action === "reject" ? "reject_step" : "request_revision",
          stepId,
          comments: deliverableFeedback,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflow(data);
        setDeliverableFeedback("");
        fetchDeliverables();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  function handleShowSignaturePad(stepId?: string) {
    setShowSignaturePad(true);
    (window as any).__signatureStepId = stepId;
  }

  async function handleSignatureSave(signatureData: string) {
    if (!selectedDeliverable) return;
    
    const stepId = (window as any).__signatureStepId;
    
    try {
      const res = await fetch(`/api/portal/${token}/deliverables/${selectedDeliverable.id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_signature",
          stepId,
          signatureData,
          signatureMethod: "draw",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflow(data);
        setShowSignaturePad(false);
        (window as any).__signatureStepId = undefined;
      }
    } catch (error) {
      console.error("Erreur:", error);
      setShowSignaturePad(false);
      (window as any).__signatureStepId = undefined;
    }
  }

  useEffect(() => {
    if (showDeliverableModal && selectedDeliverable) {
      fetchWorkflow(selectedDeliverable.id);
      fetchVersions(selectedDeliverable.id);
    }
  }, [showDeliverableModal, selectedDeliverable]);

  async function markNotificationsAsRead() {
    try {
      await fetch(`/api/portal/${token}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement de votre portail...</p>
        </div>
      </div>
    );
  }

  if (!portalData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Portail non trouvé</h1>
          <p className="text-gray-400">Ce lien n'est plus valide ou a expiré.</p>
        </div>
      </div>
    );
  }

  const { portal, projects, tickets } = portalData;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pl-64">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
                {portal.clientName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Bienvenue, {portal.clientName}</h1>
                <p className="text-white/80 text-sm">Votre espace client Nukleo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-[#12121a] rounded-xl shadow-xl border border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markNotificationsAsRead}
                          className="text-sm text-purple-400 hover:text-purple-300"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-gray-400 text-center">Aucune notification</p>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b border-gray-700/50 ${!notif.isRead ? "bg-purple-500/10" : ""}`}
                          >
                            <p className="text-sm text-white font-medium">{notif.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notif.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#0a0a0f] text-purple-400"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Welcome Message */}
            {portal.welcomeMessage && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                <p className="text-white">{portal.welcomeMessage}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-[#12121a] rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{projects.length}</p>
                    <p className="text-sm text-gray-400">Projets</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#12121a] rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{milestoneData?.progress.completed || 0}</p>
                    <p className="text-sm text-gray-400">Étapes terminées</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#12121a] rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{deliverables.filter(d => d.status === "in_review").length}</p>
                    <p className="text-sm text-gray-400">À approuver</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#12121a] rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{tickets.filter(t => t.status === "open").length}</p>
                    <p className="text-sm text-gray-400">Tickets ouverts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Progress */}
            {milestoneData && milestoneData.milestones.length > 0 && (
              <div className="bg-[#12121a] rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Progression du projet</h2>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Avancement global</span>
                    <span className="text-white font-semibold">{milestoneData.progress.percentage}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${milestoneData.progress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  {milestoneData.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          milestone.status === "completed" ? "bg-green-500" :
                          milestone.status === "in_progress" ? "bg-purple-500" :
                          "bg-gray-600"
                        }`}>
                          {milestone.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : milestone.status === "in_progress" ? (
                            <Clock className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-xs text-white">{index + 1}</span>
                          )}
                        </div>
                        {index < milestoneData.milestones.length - 1 && (
                          <div className={`w-0.5 h-12 ${
                            milestone.status === "completed" ? "bg-green-500" : "bg-gray-600"
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <h3 className="text-white font-medium">{milestone.title}</h3>
                        {milestone.description && (
                          <p className="text-gray-400 text-sm mt-1">{milestone.description}</p>
                        )}
                        {milestone.dueDate && (
                          <p className="text-gray-500 text-xs mt-2">
                            Échéance: {new Date(milestone.dueDate).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-6">
              <button
                onClick={() => setActiveTab("messages")}
                className="bg-[#12121a] rounded-xl p-6 text-left hover:bg-[#1a1a24] transition-colors group"
              >
                <MessageSquare className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-white font-semibold">Envoyer un message</h3>
                <p className="text-gray-400 text-sm mt-1">Discutez avec l'équipe Nukleo</p>
                <ChevronRight className="w-5 h-5 text-gray-500 mt-4 group-hover:text-purple-400 transition-colors" />
              </button>
              <button
                onClick={() => setActiveTab("deliverables")}
                className="bg-[#12121a] rounded-xl p-6 text-left hover:bg-[#1a1a24] transition-colors group"
              >
                <FileText className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="text-white font-semibold">Voir les livrables</h3>
                <p className="text-gray-400 text-sm mt-1">Approuvez les travaux en cours</p>
                <ChevronRight className="w-5 h-5 text-gray-500 mt-4 group-hover:text-green-400 transition-colors" />
              </button>
              <button
                onClick={() => setActiveTab("meetings")}
                className="bg-[#12121a] rounded-xl p-6 text-left hover:bg-[#1a1a24] transition-colors group"
              >
                <Calendar className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-semibold">Planifier une réunion</h3>
                <p className="text-gray-400 text-sm mt-1">Réservez un créneau</p>
                <ChevronRight className="w-5 h-5 text-gray-500 mt-4 group-hover:text-blue-400 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Vos projets</h2>
            
            {projects.length === 0 ? (
              <div className="bg-[#12121a] rounded-xl p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Aucun projet</h3>
                <p className="text-gray-400">Vos projets apparaîtront ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-[#12121a] rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                        <p className="text-gray-400 text-sm">{project.projectType || "Projet"}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        project.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                        project.status === "completed" ? "bg-green-500/20 text-green-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {project.status === "in_progress" ? "En cours" :
                         project.status === "completed" ? "Terminé" : project.status}
                      </span>
                    </div>
                    
                    {project.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {project._count.milestones} étapes
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {project._count.tasks} tâches
                      </span>
                    </div>
                    
                    {project.milestones.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-xs text-gray-500 mb-2">Prochaine étape</p>
                        <p className="text-white text-sm">
                          {project.milestones.find(m => m.status !== "completed")?.title || "Toutes les étapes terminées"}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deliverables Tab */}
        {activeTab === "deliverables" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Livrables</h2>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">
                  {deliverables.filter(d => d.status === "in_review").length} en attente d'approbation
                </span>
              </div>
            </div>
            
            {deliverables.length === 0 ? (
              <div className="bg-[#12121a] rounded-xl p-12 text-center">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Aucun livrable</h3>
                <p className="text-gray-400">Les livrables de vos projets apparaîtront ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {deliverables.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="bg-[#12121a] rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                    onClick={() => {
                      setSelectedDeliverable(deliverable);
                      setShowDeliverableModal(true);
                    }}
                  >
                    {deliverable.thumbnailUrl ? (
                      <img
                        src={deliverable.thumbnailUrl}
                        alt={deliverable.title}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium">{deliverable.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          deliverable.status === "approved" ? "bg-green-500/20 text-green-400" :
                          deliverable.status === "in_review" ? "bg-yellow-500/20 text-yellow-400" :
                          deliverable.status === "rejected" ? "bg-red-500/20 text-red-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {deliverable.status === "approved" ? "Approuvé" :
                           deliverable.status === "in_review" ? "À approuver" :
                           deliverable.status === "rejected" ? "Rejeté" :
                           deliverable.status === "revision_requested" ? "Révision demandée" :
                           "En attente"}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">{deliverable.description}</p>
                      <p className="text-gray-500 text-xs mt-2">Version {deliverable.version}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="bg-[#12121a] rounded-xl h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Messages</h2>
              <p className="text-gray-400 text-sm">Discutez avec l'équipe Nukleo</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Aucun message pour le moment</p>
                  <p className="text-gray-500 text-sm">Envoyez un message pour démarrer la conversation</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === "client" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] rounded-xl p-4 ${
                      msg.senderType === "client"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}>
                      <p className="text-sm font-medium mb-1">{msg.senderName}</p>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-2">
                        {new Date(msg.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Fichiers</h2>
            </div>
            
            {files.length === 0 ? (
              <div className="bg-[#12121a] rounded-xl p-12 text-center">
                <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Aucun fichier</h3>
                <p className="text-gray-400">Les fichiers partagés apparaîtront ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {files.map((file) => (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#12121a] rounded-xl p-4 hover:bg-[#1a1a24] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mb-3">
                      {file.fileType === "image" ? <Image className="w-6 h-6 text-blue-400" /> :
                       file.fileType === "pdf" ? <FileText className="w-6 h-6 text-red-400" /> :
                       file.fileType === "video" ? <Video className="w-6 h-6 text-purple-400" /> :
                       file.fileType === "archive" ? <Archive className="w-6 h-6 text-yellow-400" /> :
                       <File className="w-6 h-6 text-gray-400" />}
                    </div>
                    <h3 className="text-white font-medium text-sm truncate">{file.name}</h3>
                    <p className="text-gray-500 text-xs mt-1">{file.category || "Fichier"}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-gray-500 text-xs">
                        {file.fileSize ? `${Math.round(file.fileSize / 1024)} Ko` : ""}
                      </span>
                      <Download className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === "meetings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Réunions</h2>
            </div>
            
            {meetings.length === 0 ? (
              <div className="bg-[#12121a] rounded-xl p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Aucune réunion</h3>
                <p className="text-gray-400">Les réunions planifiées apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="bg-[#12121a] rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          meeting.meetingType === "video" ? "bg-blue-500/20" :
                          meeting.meetingType === "phone" ? "bg-green-500/20" :
                          "bg-purple-500/20"
                        }`}>
                          {meeting.meetingType === "video" ? <Video className="w-6 h-6 text-blue-400" /> :
                           meeting.meetingType === "phone" ? <Phone className="w-6 h-6 text-green-400" /> :
                           <MapPin className="w-6 h-6 text-purple-400" />}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{meeting.title}</h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {new Date(meeting.meetingDate).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {meeting.duration && (
                            <p className="text-gray-500 text-sm">Durée: {meeting.duration} min</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        meeting.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                        meeting.status === "completed" ? "bg-green-500/20 text-green-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {meeting.status === "scheduled" ? "Planifiée" :
                         meeting.status === "completed" ? "Terminée" : meeting.status}
                      </span>
                    </div>
                    
                    {meeting.location && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <a
                          href={meeting.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Rejoindre la réunion
                        </a>
                      </div>
                    )}
                    
                    {meeting.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-gray-400 text-sm font-medium mb-2">Notes de réunion</p>
                        <p className="text-gray-300 text-sm">{meeting.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Suivi du budget</h2>
            
            {!budgetData || budgetData.budgets.length === 0 ? (
              <div className="bg-[#12121a] rounded-xl p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Aucun budget configuré</h3>
                <p className="text-gray-400">Le suivi budgétaire sera disponible prochainement</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-[#12121a] rounded-xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Budget total</p>
                    <p className="text-2xl font-bold text-white">
                      {budgetData.summary.totalBudget.toLocaleString()} $
                    </p>
                  </div>
                  <div className="bg-[#12121a] rounded-xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Dépensé</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {budgetData.summary.totalSpent.toLocaleString()} $
                    </p>
                  </div>
                  <div className="bg-[#12121a] rounded-xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Restant</p>
                    <p className="text-2xl font-bold text-green-400">
                      {budgetData.summary.remaining.toLocaleString()} $
                    </p>
                  </div>
                  <div className="bg-[#12121a] rounded-xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Utilisation</p>
                    <p className="text-2xl font-bold text-white">
                      {budgetData.summary.percentUsed}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-[#12121a] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Progression du budget</span>
                    <span className="text-white font-semibold">{budgetData.summary.percentUsed}%</span>
                  </div>
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetData.summary.percentUsed > 90 ? "bg-red-500" :
                        budgetData.summary.percentUsed > 70 ? "bg-yellow-500" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(budgetData.summary.percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Support Tab */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Support</h2>
              <button
                onClick={() => setShowTicketModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Nouveau ticket
              </button>
            </div>
            
            {tickets.length === 0 ? (
              <div className="bg-[#12121a] rounded-xl p-12 text-center">
                <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Aucun ticket</h3>
                <p className="text-gray-400">Créez un ticket pour obtenir de l'aide</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-[#12121a] rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold">{ticket.subject}</h3>
                        <p className="text-gray-400 text-sm mt-1">{ticket.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        ticket.status === "open" ? "bg-blue-500/20 text-blue-400" :
                        ticket.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400" :
                        ticket.status === "resolved" ? "bg-green-500/20 text-green-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {ticket.status === "open" ? "Ouvert" :
                         ticket.status === "in_progress" ? "En cours" :
                         ticket.status === "resolved" ? "Résolu" : ticket.status}
                      </span>
                    </div>
                    
                    {ticket.responses.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                        {ticket.responses.map((response) => (
                          <div key={response.id} className="bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                response.authorType === "employee" ? "bg-purple-500/20 text-purple-400" : "bg-gray-600 text-gray-300"
                              }`}>
                                {response.authorType === "employee" ? "Nukleo" : "Vous"}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {new Date(response.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{response.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Deliverable Modal */}
      {showDeliverableModal && selectedDeliverable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-[#12121a] z-10">
              <h2 className="text-xl font-semibold text-white">{selectedDeliverable.title}</h2>
              <button
                onClick={() => {
                  setShowDeliverableModal(false);
                  setSelectedDeliverable(null);
                  setDeliverableFeedback("");
                  setWorkflow(null);
                  setVersions([]);
                }}
                className="text-gray-400 hover:text-white"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations du livrable */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  {selectedDeliverable.thumbnailUrl && (
                    <img
                      src={selectedDeliverable.thumbnailUrl}
                      alt={selectedDeliverable.title}
                      className="w-full rounded-lg mb-4"
                    />
                  )}
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Description</p>
                    <p className="text-white">{selectedDeliverable.description || "Aucune description"}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Type</p>
                      <p className="text-white">{selectedDeliverable.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Version</p>
                      <p className="text-white">{selectedDeliverable.version}</p>
                    </div>
                  </div>
                  
                  {selectedDeliverable.fileUrl && (
                    <a
                      href={selectedDeliverable.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 mt-4"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger le fichier
                    </a>
                  )}
                </div>

                {/* Workflow d'approbation */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FileCheck className="w-5 h-5" />
                      Workflow d'approbation
                    </h3>
                    {workflow && (
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        workflow.status === "approved" ? "bg-green-500/20 text-green-400" :
                        workflow.status === "rejected" ? "bg-red-500/20 text-red-400" :
                        workflow.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {workflow.status === "approved" ? "Approuvé" :
                         workflow.status === "rejected" ? "Rejeté" :
                         workflow.status === "in_progress" ? "En cours" : "En attente"}
                      </span>
                    )}
                  </div>

                  {loadingWorkflow ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                    </div>
                  ) : workflow && workflow.steps && workflow.steps.length > 0 ? (
                    <div className="space-y-3">
                      {workflow.steps.map((step: any, index: number) => {
                        const isCurrentStep = step.stepNumber === workflow.currentStep;
                        const isCompleted = step.status === "approved";
                        const isRejected = step.status === "rejected";
                        
                        return (
                          <div
                            key={step.id}
                            className={`border rounded-lg p-4 ${
                              isCurrentStep && !isCompleted && !isRejected
                                ? "border-purple-500 bg-purple-500/10"
                                : isCompleted
                                ? "border-green-500 bg-green-500/10"
                                : isRejected
                                ? "border-red-500 bg-red-500/10"
                                : "border-gray-700 bg-gray-800/50"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isCompleted ? "bg-green-500" :
                                  isRejected ? "bg-red-500" :
                                  isCurrentStep ? "bg-purple-500" :
                                  "bg-gray-600"
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  ) : isRejected ? (
                                    <XCircle className="w-4 h-4 text-white" />
                                  ) : (
                                    <span className="text-xs text-white">{step.stepNumber}</span>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-white font-medium">{step.name}</h4>
                                  {step.description && (
                                    <p className="text-gray-400 text-sm">{step.description}</p>
                                  )}
                                </div>
                              </div>
                              {step.approvedAt && (
                                <span className="text-xs text-gray-500">
                                  {new Date(step.approvedAt).toLocaleDateString("fr-FR")}
                                </span>
                              )}
                            </div>

                            {step.comments && (
                              <div className="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-300">
                                {step.comments}
                              </div>
                            )}

                            {isCurrentStep && !isCompleted && !isRejected && (
                              <div className="mt-4 space-y-3">
                                <div>
                                  <label className="block text-gray-400 text-sm mb-2">
                                    Commentaires (optionnel)
                                  </label>
                                  <textarea
                                    value={deliverableFeedback}
                                    onChange={(e) => setDeliverableFeedback(e.target.value)}
                                    placeholder="Ajoutez un commentaire..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                    rows={2}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleWorkflowStepAction(step.id, "approve")}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approuver
                                  </button>
                                  <button
                                    onClick={() => handleWorkflowStepAction(step.id, "request_revision")}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Révision
                                  </button>
                                  <button
                                    onClick={() => handleWorkflowStepAction(step.id, "reject")}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Rejeter
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleShowSignaturePad(step.id)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                >
                                  <PenTool className="w-4 h-4" />
                                  Ajouter une signature
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>Aucun workflow d'approbation configuré</p>
                      <p className="text-sm mt-2">Utilisez le système d'approbation simple ci-dessous</p>
                    </div>
                  )}

                  {/* Signatures */}
                  {workflow && workflow.signatures && workflow.signatures.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <PenTool className="w-4 h-4" />
                        Signatures ({workflow.signatures.length})
                      </h4>
                      <div className="space-y-2">
                        {workflow.signatures.map((signature: any) => (
                          <div key={signature.id} className="bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white text-sm">{signature.signerName}</span>
                              <span className="text-gray-500 text-xs">
                                {new Date(signature.signedAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            <img
                              src={signature.signatureData}
                              alt={`Signature de ${signature.signerName}`}
                              className="h-16 bg-white rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historique */}
                  {workflow && workflow.history && workflow.history.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Historique
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {workflow.history.map((item: any) => (
                          <div key={item.id} className="bg-gray-800 rounded-lg p-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-white">{item.actorName}</span>
                              <span className="text-gray-500 text-xs">
                                {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            <p className="text-gray-400 mt-1">
                              {item.action === "approve" ? "✓ Approuvé" :
                               item.action === "reject" ? "✗ Rejeté" :
                               item.action === "request_revision" ? "↻ Révision demandée" :
                               item.action === "signature_added" ? "✍ Signature ajoutée" :
                               item.action}
                            </p>
                            {item.comments && (
                              <p className="text-gray-500 text-xs mt-1">{item.comments}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Versions */}
              {versions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Versions</h3>
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div key={version.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium">Version {version.versionNumber}</span>
                          {version.changeLog && (
                            <p className="text-gray-400 text-sm mt-1">{version.changeLog}</p>
                          )}
                          <span className="text-gray-500 text-xs">
                            {new Date(version.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          version.status === "approved" ? "bg-green-500/20 text-green-400" :
                          version.status === "rejected" ? "bg-red-500/20 text-red-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {version.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Système d'approbation simple (fallback) */}
              {(!workflow || !workflow.steps || workflow.steps.length === 0) && selectedDeliverable.status === "in_review" && (
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Approbation simple</h3>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Votre feedback (optionnel)</label>
                    <textarea
                      value={deliverableFeedback}
                      onChange={(e) => setDeliverableFeedback(e.target.value)}
                      placeholder="Ajoutez un commentaire..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => handleDeliverableAction("approve")}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <ThumbsUp className="w-5 h-5" />
                      Approuver
                    </button>
                    <button
                      onClick={() => handleDeliverableAction("request_revision")}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Demander une révision
                    </button>
                    <button
                      onClick={() => handleShowSignaturePad()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <PenTool className="w-5 h-5" />
                      Signer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <SignaturePad
            onSave={handleSignatureSave}
            onCancel={() => {
              setShowSignaturePad(false);
              (window as any).__signatureStepId = undefined;
            }}
            signerName={portalData?.portal.clientName}
          />
        </div>
      )}
    </div>
  );
}
