"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Plus,
  Calendar,
  FileText,
  Target,
  Lightbulb,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  ThumbsUp,
  Eye,
  MessageSquare,
  Loader2,
  Image as ImageIcon,
  Video,
  FileEdit,
  Megaphone,
  TrendingUp,
  Users,
  Hash,
  Link,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Globe,
} from "lucide-react";

// Types
interface CommunicationClient {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  industry: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  monthlyBudget: number | null;
  status: string;
}

interface ContentCalendar {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  platform: string;
  scheduledDate: string;
  scheduledTime: string | null;
  status: string;
  content: string | null;
  hashtags: string | null;
  mediaUrls: string | null;
}

interface CommunicationBrief {
  id: string;
  title: string;
  projectType: string;
  status: string;
  priority: string;
  deadline: string | null;
  context: string | null;
  objectives: string | null;
  targetAudience: string | null;
  deliverables: string | null;
  budget: number | null;
}

interface CommunicationStrategy {
  id: string;
  title: string;
  strategyType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  objectives: string | null;
  positioning: string | null;
  channels: string | null;
  kpis: string | null;
}

interface ContentIdea {
  id: string;
  title: string;
  description: string | null;
  category: string;
  platform: string | null;
  votes: number;
  status: string;
}

const platformIcons: { [key: string]: React.ReactNode } = {
  facebook: <Facebook className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  tiktok: <Video className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  blog: <FileEdit className="w-4 h-4" />,
  newsletter: <Send className="w-4 h-4" />,
};

const statusColors: { [key: string]: string } = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const priorityColors: { [key: string]: string } = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function ClientHubPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [client, setClient] = useState<CommunicationClient | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "briefs" | "strategies" | "ideas">("dashboard");
  const [loading, setLoading] = useState(true);
  
  // Calendar state
  const [calendarItems, setCalendarItems] = useState<ContentCalendar[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Briefs state
  const [briefs, setBriefs] = useState<CommunicationBrief[]>([]);
  const [showBriefModal, setShowBriefModal] = useState(false);
  
  // Strategies state
  const [strategies, setStrategies] = useState<CommunicationStrategy[]>([]);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  
  // Ideas state
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  
  // Form states
  const [calendarForm, setCalendarForm] = useState({
    title: "",
    description: "",
    contentType: "post",
    platform: "instagram",
    scheduledDate: "",
    scheduledTime: "",
    content: "",
    hashtags: "",
    status: "draft",
  });
  
  const [briefForm, setBriefForm] = useState({
    title: "",
    projectType: "campaign",
    priority: "medium",
    deadline: "",
    context: "",
    objectives: "",
    targetAudience: "",
    deliverables: "",
    budget: "",
  });
  
  const [strategyForm, setStrategyForm] = useState({
    title: "",
    strategyType: "annual",
    startDate: "",
    endDate: "",
    objectives: "",
    positioning: "",
    channels: "",
    kpis: "",
  });
  
  const [ideaForm, setIdeaForm] = useState({
    title: "",
    description: "",
    category: "trend",
    platform: "instagram",
  });

  useEffect(() => {
    fetchClientData();
  }, [resolvedParams.id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client details
      const clientRes = await fetch(`/api/communication/clients/${resolvedParams.id}`);
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
      }
      
      // Fetch calendar items
      const calendarRes = await fetch(`/api/communication/calendar?clientId=${resolvedParams.id}`);
      if (calendarRes.ok) {
        const calendarData = await calendarRes.json();
        setCalendarItems(Array.isArray(calendarData) ? calendarData : []);
      }
      
      // Fetch briefs
      const briefsRes = await fetch(`/api/communication/briefs?clientId=${resolvedParams.id}`);
      if (briefsRes.ok) {
        const briefsData = await briefsRes.json();
        setBriefs(Array.isArray(briefsData) ? briefsData : []);
      }
      
      // Fetch strategies
      const strategiesRes = await fetch(`/api/communication/strategies?clientId=${resolvedParams.id}`);
      if (strategiesRes.ok) {
        const strategiesData = await strategiesRes.json();
        setStrategies(Array.isArray(strategiesData) ? strategiesData : []);
      }
      
      // Fetch ideas
      const ideasRes = await fetch(`/api/communication/ideas?clientId=${resolvedParams.id}`);
      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        setIdeas(Array.isArray(ideasData) ? ideasData : []);
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getItemsForDate = (date: Date) => {
    if (!Array.isArray(calendarItems)) return [];
    return calendarItems.filter(item => {
      const itemDate = new Date(item.scheduledDate);
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const handleCreateCalendarItem = async () => {
    try {
      const res = await fetch("/api/communication/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...calendarForm,
          clientId: resolvedParams.id,
        }),
      });
      
      if (res.ok) {
        setShowCalendarModal(false);
        setCalendarForm({
          title: "",
          description: "",
          contentType: "post",
          platform: "instagram",
          scheduledDate: "",
          scheduledTime: "",
          content: "",
          hashtags: "",
          status: "draft",
        });
        fetchClientData();
      }
    } catch (error) {
      console.error("Error creating calendar item:", error);
    }
  };

  const handleCreateBrief = async () => {
    try {
      const res = await fetch("/api/communication/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...briefForm,
          clientId: resolvedParams.id,
          budget: briefForm.budget ? parseFloat(briefForm.budget) : null,
        }),
      });
      
      if (res.ok) {
        setShowBriefModal(false);
        setBriefForm({
          title: "",
          projectType: "campaign",
          priority: "medium",
          deadline: "",
          context: "",
          objectives: "",
          targetAudience: "",
          deliverables: "",
          budget: "",
        });
        fetchClientData();
      }
    } catch (error) {
      console.error("Error creating brief:", error);
    }
  };

  const handleCreateStrategy = async () => {
    try {
      const res = await fetch("/api/communication/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...strategyForm,
          clientId: resolvedParams.id,
        }),
      });
      
      if (res.ok) {
        setShowStrategyModal(false);
        setStrategyForm({
          title: "",
          strategyType: "annual",
          startDate: "",
          endDate: "",
          objectives: "",
          positioning: "",
          channels: "",
          kpis: "",
        });
        fetchClientData();
      }
    } catch (error) {
      console.error("Error creating strategy:", error);
    }
  };

  const handleCreateIdea = async () => {
    try {
      const res = await fetch("/api/communication/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ideaForm,
          clientId: resolvedParams.id,
        }),
      });
      
      if (res.ok) {
        setShowIdeaModal(false);
        setIdeaForm({
          title: "",
          description: "",
          category: "trend",
          platform: "instagram",
        });
        fetchClientData();
      }
    } catch (error) {
      console.error("Error creating idea:", error);
    }
  };

  const handleVoteIdea = async (ideaId: string) => {
    try {
      await fetch(`/api/communication/ideas?id=${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote" }),
      });
      fetchClientData();
    } catch (error) {
      console.error("Error voting idea:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Client non trouvé</h2>
            <button
              onClick={() => router.push("/communication")}
              className="mt-4 text-purple-600 hover:text-purple-700"
            >
              Retour aux hubs
            </button>
          </div>
        </main>
      </div>
    );
  }

  const scheduledCount = Array.isArray(calendarItems) ? calendarItems.filter(i => i.status === "scheduled").length : 0;
  const publishedCount = Array.isArray(calendarItems) ? calendarItems.filter(i => i.status === "published").length : 0;
  const activeBriefs = Array.isArray(briefs) ? briefs.filter(b => b.status === "in_progress").length : 0;
  const totalIdeas = Array.isArray(ideas) ? ideas.length : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <button
              onClick={() => router.push("/communication")}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux hubs
            </button>
            
            <div className="flex items-center gap-6">
              {client.logoUrl ? (
                <img src={client.logoUrl} alt={client.name} className="w-20 h-20 rounded-xl object-cover bg-white" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {client.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{client.name}</h1>
                {client.description && (
                  <p className="text-white/80 mt-1">{client.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    client.status === "active" ? "bg-green-500/20 text-green-100" : "bg-gray-500/20 text-gray-100"
                  }`}>
                    {client.status === "active" ? "Actif" : client.status}
                  </span>
                  {client.monthlyBudget && (
                    <span className="text-white/80">
                      Budget: {client.monthlyBudget.toLocaleString()}$/mois
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-1 mt-8">
              {[
                { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
                { id: "calendar", label: "Calendrier", icon: Calendar },
                { id: "briefs", label: "Briefs", icon: FileText },
                { id: "strategies", label: "Stratégies", icon: Target },
                { id: "ideas", label: "Idées", icon: Lightbulb },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-purple-600"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{scheduledCount}</p>
                      <p className="text-sm text-gray-500">Planifiées</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
                      <p className="text-sm text-gray-500">Publiées</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{activeBriefs}</p>
                      <p className="text-sm text-gray-500">Briefs actifs</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{totalIdeas}</p>
                      <p className="text-sm text-gray-500">Idées</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => { setActiveTab("calendar"); setShowCalendarModal(true); }}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Planifier</h3>
                  <p className="text-sm text-gray-500">Nouvelle publication</p>
                </button>
                <button
                  onClick={() => { setActiveTab("briefs"); setShowBriefModal(true); }}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <FileText className="w-8 h-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Créer un brief</h3>
                  <p className="text-sm text-gray-500">Nouveau projet</p>
                </button>
                <button
                  onClick={() => { setActiveTab("strategies"); setShowStrategyModal(true); }}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <Target className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Stratégie</h3>
                  <p className="text-sm text-gray-500">Définir les objectifs</p>
                </button>
                <button
                  onClick={() => { setActiveTab("ideas"); setShowIdeaModal(true); }}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <Lightbulb className="w-8 h-8 text-yellow-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Brainstorming</h3>
                  <p className="text-sm text-gray-500">Nouvelle idée</p>
                </button>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Prochaines publications</h3>
                  {(Array.isArray(calendarItems) ? calendarItems : []).filter(i => i.status === "scheduled").slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {(Array.isArray(calendarItems) ? calendarItems : []).filter(i => i.status === "scheduled").slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            {platformIcons[item.platform] || <Globe className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.scheduledDate).toLocaleDateString("fr-FR")}
                              {item.scheduledTime && ` à ${item.scheduledTime}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune publication planifiée</p>
                  )}
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Idées populaires</h3>
                  {(Array.isArray(ideas) ? [...ideas].sort((a, b) => b.votes - a.votes) : []).slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {(Array.isArray(ideas) ? [...ideas].sort((a, b) => b.votes - a.votes) : []).slice(0, 5).map((idea) => (
                        <div key={idea.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <button
                            onClick={() => handleVoteIdea(idea.id)}
                            className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm font-medium">{idea.votes}</span>
                          </button>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{idea.title}</p>
                            <p className="text-xs text-gray-500">{idea.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune idée pour le moment</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Planifier
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-7 border-b">
                  {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-b border-r ${
                        date ? "hover:bg-gray-50 cursor-pointer" : "bg-gray-50"
                      }`}
                      onClick={() => {
                        if (date) {
                          setSelectedDate(date);
                          setCalendarForm(prev => ({
                            ...prev,
                            scheduledDate: date.toISOString().split("T")[0],
                          }));
                          setShowCalendarModal(true);
                        }
                      }}
                    >
                      {date && (
                        <>
                          <p className={`text-sm font-medium ${
                            date.toDateString() === new Date().toDateString()
                              ? "text-purple-600"
                              : "text-gray-900"
                          }`}>
                            {date.getDate()}
                          </p>
                          <div className="mt-1 space-y-1">
                            {getItemsForDate(date).slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                className={`text-xs p-1 rounded truncate ${statusColors[item.status] || "bg-gray-100"}`}
                              >
                                {platformIcons[item.platform]} {item.title}
                              </div>
                            ))}
                            {getItemsForDate(date).length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{getItemsForDate(date).length - 3} autres
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Briefs Tab */}
          {activeTab === "briefs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Briefs de projets</h2>
                <button
                  onClick={() => setShowBriefModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau brief
                </button>
              </div>

              {(Array.isArray(briefs) ? briefs : []).length > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                  {(Array.isArray(briefs) ? briefs : []).map((brief) => (
                    <div key={brief.id} className="bg-white rounded-xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{brief.title}</h3>
                          <p className="text-sm text-gray-500">{brief.projectType}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${priorityColors[brief.priority]}`}>
                          {brief.priority}
                        </span>
                      </div>
                      {brief.context && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{brief.context}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs ${statusColors[brief.status]}`}>
                          {brief.status}
                        </span>
                        {brief.deadline && (
                          <span className="text-sm text-gray-500">
                            Deadline: {new Date(brief.deadline).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun brief</h3>
                  <p className="text-gray-500 mb-4">Créez votre premier brief de projet</p>
                  <button
                    onClick={() => setShowBriefModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Créer un brief
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Strategies Tab */}
          {activeTab === "strategies" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Stratégies de communication</h2>
                <button
                  onClick={() => setShowStrategyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle stratégie
                </button>
              </div>

              {(Array.isArray(strategies) ? strategies : []).length > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                  {(Array.isArray(strategies) ? strategies : []).map((strategy) => (
                    <div key={strategy.id} className="bg-white rounded-xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{strategy.title}</h3>
                          <p className="text-sm text-gray-500">{strategy.strategyType}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${statusColors[strategy.status]}`}>
                          {strategy.status}
                        </span>
                      </div>
                      {strategy.objectives && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{strategy.objectives}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {strategy.startDate && (
                          <span>Début: {new Date(strategy.startDate).toLocaleDateString("fr-FR")}</span>
                        )}
                        {strategy.endDate && (
                          <span>Fin: {new Date(strategy.endDate).toLocaleDateString("fr-FR")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune stratégie</h3>
                  <p className="text-gray-500 mb-4">Définissez votre première stratégie</p>
                  <button
                    onClick={() => setShowStrategyModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Créer une stratégie
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ideas Tab */}
          {activeTab === "ideas" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Banque d'idées</h2>
                <button
                  onClick={() => setShowIdeaModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle idée
                </button>
              </div>

              {(Array.isArray(ideas) ? ideas : []).length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {(Array.isArray(ideas) ? [...ideas].sort((a, b) => b.votes - a.votes) : []).map((idea) => (
                    <div key={idea.id} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleVoteIdea(idea.id)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <ThumbsUp className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-bold text-purple-600">{idea.votes}</span>
                        </button>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{idea.title}</h3>
                          {idea.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{idea.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {idea.category}
                            </span>
                            {idea.platform && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-xs flex items-center gap-1">
                                {platformIcons[idea.platform]}
                                {idea.platform}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune idée</h3>
                  <p className="text-gray-500 mb-4">Lancez le brainstorming !</p>
                  <button
                    onClick={() => setShowIdeaModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Ajouter une idée
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar Modal */}
        {showCalendarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Planifier une publication</h2>
                <button onClick={() => setShowCalendarModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <input
                    type="text"
                    value={calendarForm.title}
                    onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Titre de la publication"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plateforme</label>
                    <select
                      value={calendarForm.platform}
                      onChange={(e) => setCalendarForm({ ...calendarForm, platform: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="twitter">Twitter</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="blog">Blog</option>
                      <option value="newsletter">Newsletter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={calendarForm.contentType}
                      onChange={(e) => setCalendarForm({ ...calendarForm, contentType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="post">Post</option>
                      <option value="story">Story</option>
                      <option value="reel">Reel</option>
                      <option value="video">Vidéo</option>
                      <option value="carousel">Carousel</option>
                      <option value="article">Article</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={calendarForm.scheduledDate}
                      onChange={(e) => setCalendarForm({ ...calendarForm, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                    <input
                      type="time"
                      value={calendarForm.scheduledTime}
                      onChange={(e) => setCalendarForm({ ...calendarForm, scheduledTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                  <textarea
                    value={calendarForm.content}
                    onChange={(e) => setCalendarForm({ ...calendarForm, content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={4}
                    placeholder="Texte de la publication..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags</label>
                  <input
                    type="text"
                    value={calendarForm.hashtags}
                    onChange={(e) => setCalendarForm({ ...calendarForm, hashtags: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="#hashtag1 #hashtag2"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowCalendarModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateCalendarItem}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Planifier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brief Modal */}
        {showBriefModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Nouveau brief</h2>
                <button onClick={() => setShowBriefModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <input
                    type="text"
                    value={briefForm.title}
                    onChange={(e) => setBriefForm({ ...briefForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Titre du projet"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={briefForm.projectType}
                      onChange={(e) => setBriefForm({ ...briefForm, projectType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="campaign">Campagne</option>
                      <option value="branding">Branding</option>
                      <option value="social_media">Réseaux sociaux</option>
                      <option value="content">Contenu</option>
                      <option value="event">Événement</option>
                      <option value="video">Vidéo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select
                      value={briefForm.priority}
                      onChange={(e) => setBriefForm({ ...briefForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input
                      type="date"
                      value={briefForm.deadline}
                      onChange={(e) => setBriefForm({ ...briefForm, deadline: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                    <input
                      type="number"
                      value={briefForm.budget}
                      onChange={(e) => setBriefForm({ ...briefForm, budget: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contexte</label>
                  <textarea
                    value={briefForm.context}
                    onChange={(e) => setBriefForm({ ...briefForm, context: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Contexte du projet..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objectifs</label>
                  <textarea
                    value={briefForm.objectives}
                    onChange={(e) => setBriefForm({ ...briefForm, objectives: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={2}
                    placeholder="Objectifs à atteindre..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowBriefModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateBrief}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Modal */}
        {showStrategyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Nouvelle stratégie</h2>
                <button onClick={() => setShowStrategyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <input
                    type="text"
                    value={strategyForm.title}
                    onChange={(e) => setStrategyForm({ ...strategyForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Titre de la stratégie"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={strategyForm.strategyType}
                    onChange={(e) => setStrategyForm({ ...strategyForm, strategyType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="annual">Annuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="campaign">Campagne</option>
                    <option value="crisis">Crise</option>
                    <option value="launch">Lancement</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                    <input
                      type="date"
                      value={strategyForm.startDate}
                      onChange={(e) => setStrategyForm({ ...strategyForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                    <input
                      type="date"
                      value={strategyForm.endDate}
                      onChange={(e) => setStrategyForm({ ...strategyForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objectifs</label>
                  <textarea
                    value={strategyForm.objectives}
                    onChange={(e) => setStrategyForm({ ...strategyForm, objectives: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Objectifs de la stratégie..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canaux</label>
                  <input
                    type="text"
                    value={strategyForm.channels}
                    onChange={(e) => setStrategyForm({ ...strategyForm, channels: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Instagram, LinkedIn, Newsletter..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowStrategyModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateStrategy}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Idea Modal */}
        {showIdeaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Nouvelle idée</h2>
                <button onClick={() => setShowIdeaModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <input
                    type="text"
                    value={ideaForm.title}
                    onChange={(e) => setIdeaForm({ ...ideaForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Titre de l'idée"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={ideaForm.description}
                    onChange={(e) => setIdeaForm({ ...ideaForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Décrivez votre idée..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select
                      value={ideaForm.category}
                      onChange={(e) => setIdeaForm({ ...ideaForm, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="trend">Tendance</option>
                      <option value="evergreen">Evergreen</option>
                      <option value="seasonal">Saisonnier</option>
                      <option value="event">Événement</option>
                      <option value="promo">Promotion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plateforme</label>
                    <select
                      value={ideaForm.platform}
                      onChange={(e) => setIdeaForm({ ...ideaForm, platform: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="twitter">Twitter</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="blog">Blog</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowIdeaModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateIdea}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
