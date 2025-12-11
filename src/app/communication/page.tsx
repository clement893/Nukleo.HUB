"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Search,
  Building2,
  Globe,
  Mail,
  Calendar,
  CalendarDays,
  FileText,
  Target,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Users,
  Zap,
  Sparkles,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Send,
  ThumbsUp,
  MessageSquare,
  Palette,
  FolderOpen,
  Filter,
  LayoutGrid,
  List,
  Megaphone,
  PenTool,
  Video,
  Mic,
  Image as ImageIcon,
  FileImage,
  Hash,
  Link2,
  ExternalLink,
} from "lucide-react";

// Types
interface CommunicationClient {
  id: string;
  name: string;
  logoUrl: string | null;
  status: string;
  monthlyBudget: number | null;
}

interface ContentCalendarEntry {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  contentType: string;
  platform: string;
  status: string;
  scheduledDate: string;
  publishedDate: string | null;
  content: string | null;
  hashtags: string | null;
  caption: string | null;
  assignedTo: string | null;
  client: { id: string; name: string; logoUrl: string | null };
}

interface CommunicationBrief {
  id: string;
  clientId: string;
  title: string;
  projectType: string;
  status: string;
  priority: string;
  deadline: string | null;
  budget: number | null;
  client: { id: string; name: string; logoUrl: string | null };
}

interface CommunicationStrategy {
  id: string;
  clientId: string;
  title: string;
  type: string;
  status: string;
  period: string | null;
  client: { id: string; name: string; logoUrl: string | null };
}

interface ContentIdea {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  format: string | null;
  status: string;
  votes: number;
  client: { id: string; name: string; logoUrl: string | null };
}

// Constants
const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-500" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "text-sky-500" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-500" },
  { id: "tiktok", label: "TikTok", icon: Play, color: "text-black" },
  { id: "blog", label: "Blog", icon: FileText, color: "text-emerald-500" },
  { id: "newsletter", label: "Newsletter", icon: Mail, color: "text-violet-500" },
];

const CONTENT_TYPES = [
  { id: "post", label: "Publication", icon: ImageIcon },
  { id: "story", label: "Story", icon: Play },
  { id: "reel", label: "Reel/Short", icon: Video },
  { id: "carousel", label: "Carrousel", icon: LayoutGrid },
  { id: "article", label: "Article", icon: FileText },
  { id: "video", label: "Vidéo", icon: Video },
  { id: "podcast", label: "Podcast", icon: Mic },
  { id: "infographic", label: "Infographie", icon: BarChart3 },
];

const PROJECT_TYPES = [
  { id: "branding", label: "Branding", color: "bg-violet-500" },
  { id: "campaign", label: "Campagne", color: "bg-blue-500" },
  { id: "social_media", label: "Réseaux sociaux", color: "bg-pink-500" },
  { id: "website", label: "Site web", color: "bg-emerald-500" },
  { id: "video", label: "Vidéo", color: "bg-red-500" },
  { id: "event", label: "Événement", color: "bg-amber-500" },
  { id: "launch", label: "Lancement", color: "bg-cyan-500" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-500/10", text: "text-gray-500", label: "Brouillon" },
  scheduled: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Planifié" },
  published: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Publié" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-500", label: "Annulé" },
  in_review: { bg: "bg-amber-500/10", text: "text-amber-500", label: "En révision" },
  approved: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Approuvé" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-500", label: "En cours" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Terminé" },
  active: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Actif" },
  paused: { bg: "bg-amber-500/10", text: "text-amber-500", label: "En pause" },
  idea: { bg: "bg-violet-500/10", text: "text-violet-500", label: "Idée" },
  rejected: { bg: "bg-red-500/10", text: "text-red-500", label: "Rejeté" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-gray-500/10", text: "text-gray-500", label: "Basse" },
  medium: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Moyenne" },
  high: { bg: "bg-amber-500/10", text: "text-amber-500", label: "Haute" },
  urgent: { bg: "bg-red-500/10", text: "text-red-500", label: "Urgente" },
};

export default function CommunicationHubPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "briefs" | "strategies" | "ideas" | "clients">("dashboard");
  const [clients, setClients] = useState<CommunicationClient[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<ContentCalendarEntry[]>([]);
  const [briefs, setBriefs] = useState<CommunicationBrief[]>([]);
  const [strategies, setStrategies] = useState<CommunicationStrategy[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week" | "list">("month");
  
  // Modal states
  const [showAddCalendarModal, setShowAddCalendarModal] = useState(false);
  const [showAddBriefModal, setShowAddBriefModal] = useState(false);
  const [showAddIdeaModal, setShowAddIdeaModal] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, calendarRes, briefsRes, strategiesRes, ideasRes] = await Promise.all([
        fetch("/api/communication/clients"),
        fetch("/api/communication/calendar"),
        fetch("/api/communication/briefs"),
        fetch("/api/communication/strategies"),
        fetch("/api/communication/ideas"),
      ]);

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }
      if (calendarRes.ok) {
        const data = await calendarRes.json();
        setCalendarEntries(data.entries || []);
      }
      if (briefsRes.ok) {
        const data = await briefsRes.json();
        setBriefs(data.briefs || []);
      }
      if (strategiesRes.ok) {
        const data = await strategiesRes.json();
        setStrategies(data.strategies || []);
      }
      if (ideasRes.ok) {
        const data = await ideasRes.json();
        setIdeas(data.ideas || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find(p => p.id === platform);
    if (!p) return <Globe className="w-4 h-4" />;
    const Icon = p.icon;
    return <Icon className={`w-4 h-4 ${p.color}`} />;
  };

  const getContentTypeIcon = (type: string) => {
    const t = CONTENT_TYPES.find(t => t.id === type);
    if (!t) return <FileText className="w-4 h-4" />;
    const Icon = t.icon;
    return <Icon className="w-4 h-4" />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-CA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Calendar helpers
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

  const getEntriesForDate = (date: Date) => {
    return calendarEntries.filter(entry => {
      const entryDate = new Date(entry.scheduledDate);
      return entryDate.toDateString() === date.toDateString();
    });
  };

  // Stats
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === "active").length,
    scheduledPosts: calendarEntries.filter(e => e.status === "scheduled").length,
    publishedThisMonth: calendarEntries.filter(e => {
      const date = new Date(e.publishedDate || e.scheduledDate);
      const now = new Date();
      return e.status === "published" && date.getMonth() === now.getMonth();
    }).length,
    activeBriefs: briefs.filter(b => ["draft", "in_review", "in_progress"].includes(b.status)).length,
    pendingIdeas: ideas.filter(i => i.status === "idea").length,
  };

  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutGrid },
    { id: "calendar", label: "Calendrier", icon: CalendarDays },
    { id: "briefs", label: "Briefs", icon: FileText },
    { id: "strategies", label: "Stratégies", icon: Target },
    { id: "ideas", label: "Idées", icon: Lightbulb },
    { id: "clients", label: "Clients", icon: Building2 },
  ];

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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Megaphone className="w-8 h-8" />
                  Hub de Communication
                </h1>
                <p className="text-white/80 mt-1">
                  Centre de commande pour vos communications numériques
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddIdeaModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  Nouvelle idée
                </button>
                <button
                  onClick={() => setShowAddCalendarModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 text-violet-600 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Planifier
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mt-6 bg-white/10 rounded-lg p-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? "bg-white text-violet-600 font-medium"
                        : "text-white/80 hover:text-white hover:bg-white/10"
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

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-6 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg">
                      <Building2 className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.totalClients}</div>
                      <div className="text-xs text-muted-foreground">Clients</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.activeClients}</div>
                      <div className="text-xs text-muted-foreground">Actifs</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.scheduledPosts}</div>
                      <div className="text-xs text-muted-foreground">Planifiés</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                      <Send className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.publishedThisMonth}</div>
                      <div className="text-xs text-muted-foreground">Publiés ce mois</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <FileText className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.activeBriefs}</div>
                      <div className="text-xs text-muted-foreground">Briefs actifs</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.pendingIdeas}</div>
                      <div className="text-xs text-muted-foreground">Idées en attente</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => setShowAddCalendarModal(true)}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <CalendarDays className="w-8 h-8" />
                  <div className="text-left">
                    <div className="font-semibold">Planifier du contenu</div>
                    <div className="text-sm text-white/80">Calendrier éditorial</div>
                  </div>
                </button>
                <button
                  onClick={() => setShowAddBriefModal(true)}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <FileText className="w-8 h-8" />
                  <div className="text-left">
                    <div className="font-semibold">Créer un brief</div>
                    <div className="text-sm text-white/80">Nouveau projet</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("strategies")}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Target className="w-8 h-8" />
                  <div className="text-left">
                    <div className="font-semibold">Stratégies</div>
                    <div className="text-sm text-white/80">Plans de comm</div>
                  </div>
                </button>
                <button
                  onClick={() => setShowAddIdeaModal(true)}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Lightbulb className="w-8 h-8" />
                  <div className="text-left">
                    <div className="font-semibold">Brainstorming</div>
                    <div className="text-sm text-white/80">Banque d&apos;idées</div>
                  </div>
                </button>
              </div>

              {/* Upcoming Content */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Prochaines publications</h2>
                    <button
                      onClick={() => setActiveTab("calendar")}
                      className="text-sm text-primary hover:underline"
                    >
                      Voir tout
                    </button>
                  </div>
                  <div className="space-y-3">
                    {calendarEntries
                      .filter(e => e.status === "scheduled" && new Date(e.scheduledDate) >= new Date())
                      .slice(0, 5)
                      .map(entry => (
                        <div key={entry.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          {getPlatformIcon(entry.platform)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{entry.title}</div>
                            <div className="text-xs text-muted-foreground">{entry.client.name}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(entry.scheduledDate)}
                          </div>
                        </div>
                      ))}
                    {calendarEntries.filter(e => e.status === "scheduled").length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune publication planifiée
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Briefs en cours</h2>
                    <button
                      onClick={() => setActiveTab("briefs")}
                      className="text-sm text-primary hover:underline"
                    >
                      Voir tout
                    </button>
                  </div>
                  <div className="space-y-3">
                    {briefs
                      .filter(b => ["draft", "in_review", "in_progress"].includes(b.status))
                      .slice(0, 5)
                      .map(brief => (
                        <div key={brief.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${PROJECT_TYPES.find(t => t.id === brief.projectType)?.color || "bg-gray-500"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{brief.title}</div>
                            <div className="text-xs text-muted-foreground">{brief.client.name}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[brief.status]?.bg} ${STATUS_COLORS[brief.status]?.text}`}>
                            {STATUS_COLORS[brief.status]?.label}
                          </span>
                        </div>
                      ))}
                    {briefs.filter(b => ["draft", "in_review", "in_progress"].includes(b.status)).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucun brief en cours
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Ideas */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Idées populaires</h2>
                  <button
                    onClick={() => setActiveTab("ideas")}
                    className="text-sm text-primary hover:underline"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {ideas
                    .filter(i => i.status === "idea")
                    .sort((a, b) => b.votes - a.votes)
                    .slice(0, 6)
                    .map(idea => (
                      <div key={idea.id} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-muted-foreground">{idea.client.name}</span>
                          <div className="flex items-center gap-1 text-amber-500">
                            <ThumbsUp className="w-3 h-3" />
                            <span className="text-xs font-medium">{idea.votes}</span>
                          </div>
                        </div>
                        <div className="font-medium text-foreground mb-1">{idea.title}</div>
                        {idea.platform && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getPlatformIcon(idea.platform)}
                            <span>{PLATFORMS.find(p => p.id === idea.platform)?.label}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <div className="space-y-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-foreground">
                    {currentMonth.toLocaleDateString("fr-CA", { month: "long", year: "numeric" })}
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    Aujourd&apos;hui
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="">Tous les clients</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowAddCalendarModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Planifier
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-7 border-b border-border">
                  {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(day => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/50">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    const entries = date ? getEntriesForDate(date).filter(e => !selectedClient || e.clientId === selectedClient) : [];
                    const isToday = date?.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[120px] p-2 border-b border-r border-border ${
                          date ? "bg-background" : "bg-muted/30"
                        } ${isToday ? "bg-primary/5" : ""}`}
                      >
                        {date && (
                          <>
                            <div className={`text-sm mb-1 ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {entries.slice(0, 3).map(entry => (
                                <div
                                  key={entry.id}
                                  className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                                    STATUS_COLORS[entry.status]?.bg
                                  } ${STATUS_COLORS[entry.status]?.text}`}
                                  title={`${entry.title} - ${entry.client.name}`}
                                >
                                  <span className="mr-1">{getPlatformIcon(entry.platform)}</span>
                                  {entry.title}
                                </div>
                              ))}
                              {entries.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{entries.length - 3} autres
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
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
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau brief
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {briefs.map(brief => (
                  <Link
                    key={brief.id}
                    href={`/communication/${brief.clientId}?tab=briefs&brief=${brief.id}`}
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${PROJECT_TYPES.find(t => t.id === brief.projectType)?.color} text-white`}>
                        {PROJECT_TYPES.find(t => t.id === brief.projectType)?.label}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[brief.priority]?.bg} ${PRIORITY_COLORS[brief.priority]?.text}`}>
                        {PRIORITY_COLORS[brief.priority]?.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{brief.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{brief.client.name}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full ${STATUS_COLORS[brief.status]?.bg} ${STATUS_COLORS[brief.status]?.text}`}>
                        {STATUS_COLORS[brief.status]?.label}
                      </span>
                      {brief.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(brief.deadline)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {briefs.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun brief créé</p>
                  <button
                    onClick={() => setShowAddBriefModal(true)}
                    className="mt-4 text-primary hover:underline"
                  >
                    Créer votre premier brief
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
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" />
                  Nouvelle stratégie
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {strategies.map(strategy => (
                  <Link
                    key={strategy.id}
                    href={`/communication/${strategy.clientId}?tab=strategies&strategy=${strategy.id}`}
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        <span className="text-xs text-muted-foreground uppercase">{strategy.type}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[strategy.status]?.bg} ${STATUS_COLORS[strategy.status]?.text}`}>
                        {STATUS_COLORS[strategy.status]?.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{strategy.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{strategy.client.name}</p>
                    {strategy.period && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {strategy.period}
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              {strategies.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune stratégie créée</p>
                </div>
              )}
            </div>
          )}

          {/* Ideas Tab */}
          {activeTab === "ideas" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Banque d&apos;idées</h2>
                <button
                  onClick={() => setShowAddIdeaModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle idée
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {ideas.map(idea => (
                  <div
                    key={idea.id}
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {idea.platform && getPlatformIcon(idea.platform)}
                        <span className="text-xs text-muted-foreground">{idea.client.name}</span>
                      </div>
                      <button
                        onClick={async () => {
                          await fetch("/api/communication/ideas", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: idea.id, vote: 1 }),
                          });
                          fetchData();
                        }}
                        className="flex items-center gap-1 text-amber-500 hover:text-amber-400 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm font-medium">{idea.votes}</span>
                      </button>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{idea.title}</h3>
                    {idea.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{idea.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[idea.status]?.bg} ${STATUS_COLORS[idea.status]?.text}`}>
                        {STATUS_COLORS[idea.status]?.label}
                      </span>
                      {idea.category && (
                        <span className="text-xs text-muted-foreground">{idea.category}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {ideas.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune idée enregistrée</p>
                  <button
                    onClick={() => setShowAddIdeaModal(true)}
                    className="mt-4 text-primary hover:underline"
                  >
                    Ajouter votre première idée
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === "clients" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Clients Communication</h2>
                <Link
                  href="/communication"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau client
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {clients.map(client => (
                  <Link
                    key={client.id}
                    href={`/communication/${client.id}`}
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {client.logoUrl ? (
                        <Image
                          src={client.logoUrl}
                          alt={client.name}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{client.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[client.status]?.bg} ${STATUS_COLORS[client.status]?.text}`}>
                          {STATUS_COLORS[client.status]?.label}
                        </span>
                      </div>
                    </div>
                    {client.monthlyBudget && (
                      <div className="text-sm text-muted-foreground">
                        Budget: {client.monthlyBudget.toLocaleString("fr-CA")} $/mois
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Calendar Entry Modal */}
        {showAddCalendarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Planifier du contenu</h2>
                <button onClick={() => setShowAddCalendarModal(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await fetch("/api/communication/calendar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      clientId: formData.get("clientId"),
                      title: formData.get("title"),
                      description: formData.get("description"),
                      contentType: formData.get("contentType"),
                      platform: formData.get("platform"),
                      scheduledDate: formData.get("scheduledDate"),
                      caption: formData.get("caption"),
                      hashtags: formData.get("hashtags"),
                    }),
                  });
                  setShowAddCalendarModal(false);
                  fetchData();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Client</label>
                  <select name="clientId" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titre</label>
                  <input type="text" name="title" required className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Plateforme</label>
                    <select name="platform" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      {PLATFORMS.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Type de contenu</label>
                    <select name="contentType" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      {CONTENT_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Date de publication</label>
                  <input type="datetime-local" name="scheduledDate" required className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Légende/Caption</label>
                  <textarea name="caption" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Hashtags</label>
                  <input type="text" name="hashtags" placeholder="#marketing #digital" className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddCalendarModal(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
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
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Nouveau brief</h2>
                <button onClick={() => setShowAddBriefModal(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await fetch("/api/communication/briefs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      clientId: formData.get("clientId"),
                      title: formData.get("title"),
                      projectType: formData.get("projectType"),
                      priority: formData.get("priority"),
                      background: formData.get("background"),
                      objectives: formData.get("objectives"),
                      deadline: formData.get("deadline") || null,
                    }),
                  });
                  setShowAddBriefModal(false);
                  fetchData();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Client</label>
                  <select name="clientId" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titre du projet</label>
                  <input type="text" name="title" required className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Type de projet</label>
                    <select name="projectType" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      {PROJECT_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Priorité</label>
                    <select name="priority" className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      <option value="low">Basse</option>
                      <option value="medium" selected>Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Date limite</label>
                  <input type="date" name="deadline" className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contexte</label>
                  <textarea name="background" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg" placeholder="Décrivez le contexte du projet..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Objectifs</label>
                  <textarea name="objectives" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg" placeholder="Quels sont les objectifs à atteindre ?" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddBriefModal(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Créer le brief
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
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await fetch("/api/communication/ideas", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      clientId: formData.get("clientId"),
                      title: formData.get("title"),
                      description: formData.get("description"),
                      platform: formData.get("platform") || null,
                      category: formData.get("category") || null,
                    }),
                  });
                  setShowAddIdeaModal(false);
                  fetchData();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Client</label>
                  <select name="clientId" required className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titre de l&apos;idée</label>
                  <input type="text" name="title" required className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea name="description" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Plateforme</label>
                    <select name="platform" className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      <option value="">Non définie</option>
                      {PLATFORMS.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Catégorie</label>
                    <select name="category" className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                      <option value="">Non définie</option>
                      <option value="trending">Tendance</option>
                      <option value="evergreen">Evergreen</option>
                      <option value="seasonal">Saisonnier</option>
                      <option value="promotional">Promotionnel</option>
                      <option value="educational">Éducatif</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddIdeaModal(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Ajouter l&apos;idée
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
