"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Target,
  Lightbulb,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Globe,
  Mail,
  ThumbsUp,
  Sparkles,
  TrendingUp,
  Users,
  Megaphone,
  BarChart3,
  Zap,
  Eye,
  MessageSquare,
  Share2,
  Heart,
  Bookmark,
  ExternalLink,
} from "lucide-react";

interface CommunicationClient {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  email: string | null;
  status: string;
  monthlyBudget: number | null;
  description: string | null;
}

interface ContentCalendarItem {
  id: string;
  title: string;
  contentType: string;
  platform: string;
  scheduledDate: string;
  status: string;
  content: string | null;
  hashtags: string | null;
}

interface CommunicationBrief {
  id: string;
  title: string;
  projectType: string;
  status: string;
  priority: string;
  deadline: string | null;
  context: string | null;
}

interface CommunicationStrategy {
  id: string;
  title: string;
  strategyType: string;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
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

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
  { value: "twitter", label: "Twitter/X", icon: Twitter, color: "text-sky-500" },
  { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600" },
  { value: "website", label: "Site web", icon: Globe, color: "text-emerald-500" },
  { value: "newsletter", label: "Infolettre", icon: Mail, color: "text-amber-500" },
];

const CONTENT_TYPES = [
  { value: "post", label: "Publication" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel/Short" },
  { value: "video", label: "Vidéo" },
  { value: "article", label: "Article" },
  { value: "newsletter", label: "Infolettre" },
  { value: "ad", label: "Publicité" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  planned: "bg-blue-500",
  in_progress: "bg-amber-500",
  review: "bg-purple-500",
  approved: "bg-emerald-500",
  published: "bg-green-600",
  cancelled: "bg-red-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};

export default function ClientHubPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<CommunicationClient | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "briefs" | "strategies" | "ideas">("dashboard");
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [calendarItems, setCalendarItems] = useState<ContentCalendarItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddCalendarModal, setShowAddCalendarModal] = useState(false);

  // Briefs state
  const [briefs, setBriefs] = useState<CommunicationBrief[]>([]);
  const [showAddBriefModal, setShowAddBriefModal] = useState(false);

  // Strategies state
  const [strategies, setStrategies] = useState<CommunicationStrategy[]>([]);
  const [showAddStrategyModal, setShowAddStrategyModal] = useState(false);

  // Ideas state
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [showAddIdeaModal, setShowAddIdeaModal] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchCalendarItems();
      fetchBriefs();
      fetchStrategies();
      fetchIdeas();
    }
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/communication/clients`);
      if (res.ok) {
        const clients = await res.json();
        const foundClient = clients.find((c: CommunicationClient) => c.id === clientId);
        setClient(foundClient || null);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarItems = async () => {
    try {
      const res = await fetch(`/api/communication/calendar?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setCalendarItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    }
  };

  const fetchBriefs = async () => {
    try {
      const res = await fetch(`/api/communication/briefs?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setBriefs(data.briefs || []);
      }
    } catch (error) {
      console.error("Error fetching briefs:", error);
    }
  };

  const fetchStrategies = async () => {
    try {
      const res = await fetch(`/api/communication/strategies?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setStrategies(data.strategies || []);
      }
    } catch (error) {
      console.error("Error fetching strategies:", error);
    }
  };

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`/api/communication/ideas?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas || []);
      }
    } catch (error) {
      console.error("Error fetching ideas:", error);
    }
  };

  const handleCreateCalendarItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const itemData = {
      clientId,
      title: formData.get("title"),
      contentType: formData.get("contentType"),
      platform: formData.get("platform"),
      scheduledDate: formData.get("scheduledDate"),
      content: formData.get("content") || null,
      hashtags: formData.get("hashtags") || null,
      status: "planned",
    };

    try {
      const res = await fetch("/api/communication/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });

      if (res.ok) {
        setShowAddCalendarModal(false);
        fetchCalendarItems();
      }
    } catch (error) {
      console.error("Error creating calendar item:", error);
    }
  };

  const handleCreateBrief = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const briefData = {
      clientId,
      title: formData.get("title"),
      projectType: formData.get("projectType"),
      priority: formData.get("priority"),
      deadline: formData.get("deadline") || null,
      context: formData.get("context") || null,
      status: "draft",
    };

    try {
      const res = await fetch("/api/communication/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(briefData),
      });

      if (res.ok) {
        setShowAddBriefModal(false);
        fetchBriefs();
      }
    } catch (error) {
      console.error("Error creating brief:", error);
    }
  };

  const handleCreateStrategy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const strategyData = {
      clientId,
      title: formData.get("title"),
      strategyType: formData.get("strategyType"),
      periodStart: formData.get("periodStart") || null,
      periodEnd: formData.get("periodEnd") || null,
      status: "draft",
    };

    try {
      const res = await fetch("/api/communication/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strategyData),
      });

      if (res.ok) {
        setShowAddStrategyModal(false);
        fetchStrategies();
      }
    } catch (error) {
      console.error("Error creating strategy:", error);
    }
  };

  const handleCreateIdea = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const ideaData = {
      clientId,
      title: formData.get("title"),
      description: formData.get("description") || null,
      category: formData.get("category"),
      platform: formData.get("platform") || null,
      status: "new",
    };

    try {
      const res = await fetch("/api/communication/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ideaData),
      });

      if (res.ok) {
        setShowAddIdeaModal(false);
        fetchIdeas();
      }
    } catch (error) {
      console.error("Error creating idea:", error);
    }
  };

  const handleVoteIdea = async (ideaId: string, currentVotes: number) => {
    try {
      const res = await fetch("/api/communication/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ideaId, votes: currentVotes + 1 }),
      });

      if (res.ok) {
        fetchIdeas();
      }
    } catch (error) {
      console.error("Error voting idea:", error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find(pl => pl.value === platform);
    if (p) {
      const Icon = p.icon;
      return <Icon className={`w-4 h-4 ${p.color}`} />;
    }
    return <Globe className="w-4 h-4 text-gray-500" />;
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getItemsForDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return calendarItems.filter(item => {
      const itemDate = new Date(item.scheduledDate);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month && itemDate.getDate() === day;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-foreground mb-2">Client non trouvé</h2>
            <Link href="/communication" className="text-primary hover:underline">
              Retour aux hubs
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "calendar", label: "Calendrier", icon: Calendar },
    { id: "briefs", label: "Briefs", icon: FileText },
    { id: "strategies", label: "Stratégies", icon: Target },
    { id: "ideas", label: "Idées", icon: Lightbulb },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/communication"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                {client.logoUrl ? (
                  <Image
                    src={client.logoUrl}
                    alt={client.name}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
                    {client.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{client.name}</h1>
                  <p className="text-white/70 text-sm">Hub de Communication</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-background text-foreground"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{calendarItems.length}</div>
                      <div className="text-sm text-muted-foreground">Publications</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{briefs.length}</div>
                      <div className="text-sm text-muted-foreground">Briefs</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <Target className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{strategies.length}</div>
                      <div className="text-sm text-muted-foreground">Stratégies</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{ideas.length}</div>
                      <div className="text-sm text-muted-foreground">Idées</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => { setActiveTab("calendar"); setShowAddCalendarModal(true); }}
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Plus className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">Planifier</div>
                    <div className="text-sm text-muted-foreground">Nouvelle publication</div>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveTab("briefs"); setShowAddBriefModal(true); }}
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">Créer brief</div>
                    <div className="text-sm text-muted-foreground">Nouveau projet</div>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveTab("strategies"); setShowAddStrategyModal(true); }}
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Target className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">Stratégie</div>
                    <div className="text-sm text-muted-foreground">Nouvelle stratégie</div>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveTab("ideas"); setShowAddIdeaModal(true); }}
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">Brainstorm</div>
                    <div className="text-sm text-muted-foreground">Nouvelle idée</div>
                  </div>
                </button>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Prochaines publications
                  </h3>
                  {calendarItems.filter(i => new Date(i.scheduledDate) >= new Date()).slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {calendarItems
                        .filter(i => new Date(i.scheduledDate) >= new Date())
                        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                        .slice(0, 5)
                        .map(item => (
                          <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg">
                            {getPlatformIcon(item.platform)}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{item.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(item.scheduledDate).toLocaleDateString("fr-CA")}
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 text-xs text-white rounded ${STATUS_COLORS[item.status]}`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune publication planifiée</p>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Idées populaires
                  </h3>
                  {ideas.sort((a, b) => b.votes - a.votes).slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {ideas
                        .sort((a, b) => b.votes - a.votes)
                        .slice(0, 5)
                        .map(idea => (
                          <div key={idea.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg">
                            <button
                              onClick={() => handleVoteIdea(idea.id, idea.votes)}
                              className="flex items-center gap-1 text-amber-500 hover:text-amber-400"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span className="text-sm font-medium">{idea.votes}</span>
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{idea.title}</div>
                              <div className="text-xs text-muted-foreground">{idea.category}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune idée pour le moment</p>
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
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-foreground">
                    {currentMonth.toLocaleDateString("fr-CA", { month: "long", year: "numeric" })}
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setShowAddCalendarModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Planifier
                </button>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-7 border-b border-border">
                  {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(day => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {getDaysInMonth(currentMonth).map((day, index) => (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-b border-r border-border ${
                        day === null ? "bg-muted/30" : ""
                      }`}
                    >
                      {day !== null && (
                        <>
                          <div className="text-sm font-medium text-foreground mb-1">{day}</div>
                          <div className="space-y-1">
                            {getItemsForDay(day).slice(0, 3).map(item => (
                              <div
                                key={item.id}
                                className={`text-xs p-1 rounded truncate text-white ${STATUS_COLORS[item.status]}`}
                              >
                                <div className="flex items-center gap-1">
                                  {getPlatformIcon(item.platform)}
                                  <span className="truncate">{item.title}</span>
                                </div>
                              </div>
                            ))}
                            {getItemsForDay(day).length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{getItemsForDay(day).length - 3} autres
                              </div>
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
                <h2 className="text-xl font-semibold text-foreground">Briefs de projets</h2>
                <button
                  onClick={() => setShowAddBriefModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau brief
                </button>
              </div>

              {briefs.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {briefs.map(brief => (
                    <div key={brief.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-0.5 text-xs text-white rounded ${PRIORITY_COLORS[brief.priority]}`}>
                          {brief.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs text-white rounded ${STATUS_COLORS[brief.status]}`}>
                          {brief.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{brief.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{brief.projectType}</p>
                      {brief.deadline && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(brief.deadline).toLocaleDateString("fr-CA")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Aucun brief</h3>
                  <p className="text-muted-foreground mb-4">Créez votre premier brief de projet</p>
                  <button
                    onClick={() => setShowAddBriefModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
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
                <h2 className="text-xl font-semibold text-foreground">Stratégies de communication</h2>
                <button
                  onClick={() => setShowAddStrategyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle stratégie
                </button>
              </div>

              {strategies.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {strategies.map(strategy => (
                    <div key={strategy.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-500 rounded">
                          {strategy.strategyType}
                        </span>
                        <span className={`px-2 py-0.5 text-xs text-white rounded ${STATUS_COLORS[strategy.status]}`}>
                          {strategy.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{strategy.title}</h3>
                      {(strategy.periodStart || strategy.periodEnd) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {strategy.periodStart && new Date(strategy.periodStart).toLocaleDateString("fr-CA")}
                          {strategy.periodStart && strategy.periodEnd && " - "}
                          {strategy.periodEnd && new Date(strategy.periodEnd).toLocaleDateString("fr-CA")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Aucune stratégie</h3>
                  <p className="text-muted-foreground mb-4">Définissez votre première stratégie</p>
                  <button
                    onClick={() => setShowAddStrategyModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
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
                <h2 className="text-xl font-semibold text-foreground">Banque d'idées</h2>
                <button
                  onClick={() => setShowAddIdeaModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle idée
                </button>
              </div>

              {ideas.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {ideas.sort((a, b) => b.votes - a.votes).map(idea => (
                    <div key={idea.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <button
                          onClick={() => handleVoteIdea(idea.id, idea.votes)}
                          className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="font-medium">{idea.votes}</span>
                        </button>
                        {idea.platform && getPlatformIcon(idea.platform)}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{idea.title}</h3>
                      {idea.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{idea.description}</p>
                      )}
                      <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                        {idea.category}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Aucune idée</h3>
                  <p className="text-muted-foreground mb-4">Lancez votre première session de brainstorming</p>
                  <button
                    onClick={() => setShowAddIdeaModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une idée
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Calendar Item Modal */}
        {showAddCalendarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Planifier une publication</h2>
                <button onClick={() => setShowAddCalendarModal(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleCreateCalendarItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titre *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="Titre de la publication"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Plateforme *</label>
                    <select name="platform" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      {PLATFORMS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Type *</label>
                    <select name="contentType" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      {CONTENT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Date de publication *</label>
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contenu</label>
                  <textarea
                    name="content"
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="Texte de la publication..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Hashtags</label>
                  <input
                    type="text"
                    name="hashtags"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="#hashtag1 #hashtag2"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowAddCalendarModal(false)} className="px-4 py-2 text-muted-foreground">
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                    Planifier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Brief Modal */}
        {showAddBriefModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Nouveau brief</h2>
                <button onClick={() => setShowAddBriefModal(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleCreateBrief} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titre *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Type de projet *</label>
                    <select name="projectType" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      <option value="branding">Branding</option>
                      <option value="campaign">Campagne</option>
                      <option value="social_media">Réseaux sociaux</option>
                      <option value="content">Contenu</option>
                      <option value="video">Vidéo</option>
                      <option value="website">Site web</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Priorité *</label>
                    <select name="priority" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contexte</label>
                  <textarea
                    name="context"
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="Contexte du projet..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowAddBriefModal(false)} className="px-4 py-2 text-muted-foreground">
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Strategy Modal */}
        {showAddStrategyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Nouvelle stratégie</h2>
                <button onClick={() => setShowAddStrategyModal(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleCreateStrategy} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titre *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Type de stratégie *</label>
                  <select name="strategyType" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                    <option value="annual">Annuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="campaign">Campagne</option>
                    <option value="crisis">Crise</option>
                    <option value="launch">Lancement</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Début</label>
                    <input
                      type="date"
                      name="periodStart"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Fin</label>
                    <input
                      type="date"
                      name="periodEnd"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowAddStrategyModal(false)} className="px-4 py-2 text-muted-foreground">
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Idea Modal */}
        {showAddIdeaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Nouvelle idée</h2>
                <button onClick={() => setShowAddIdeaModal(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleCreateIdea} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titre *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="Décrivez votre idée..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Catégorie *</label>
                    <select name="category" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      <option value="trending">Tendance</option>
                      <option value="evergreen">Evergreen</option>
                      <option value="seasonal">Saisonnier</option>
                      <option value="promotional">Promotionnel</option>
                      <option value="educational">Éducatif</option>
                      <option value="entertainment">Divertissement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Plateforme</label>
                    <select name="platform" className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      <option value="">Toutes</option>
                      {PLATFORMS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowAddIdeaModal(false)} className="px-4 py-2 text-muted-foreground">
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
