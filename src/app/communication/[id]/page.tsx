"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Plus,
  Share2,
  Mail,
  Megaphone,
  Key,
  MessageSquare,
  CheckSquare,
  Globe,
  Phone,
  Building2,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Send,
  X,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

// Types
interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountUrl: string | null;
  username: string | null;
  followers: number | null;
  status: string;
  accessEmail: string | null;
  accessPassword: string | null;
  postsPerWeek: number | null;
}

interface Newsletter {
  id: string;
  name: string;
  platform: string | null;
  listSize: number | null;
  frequency: string | null;
  lastSentDate: string | null;
  nextSendDate: string | null;
  openRate: number | null;
  clickRate: number | null;
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  spent: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
}

interface ClientAccess {
  id: string;
  name: string;
  type: string;
  url: string | null;
  username: string | null;
  password: string | null;
  email: string | null;
  expiryDate: string | null;
}

interface ClientTask {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: string | null;
}

interface ClientMessage {
  id: string;
  direction: string;
  channel: string;
  subject: string | null;
  content: string;
  sentAt: string;
  sentBy: string | null;
  isImportant: boolean;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  description: string | null;
  status: string;
  monthlyBudget: number | null;
  socialAccounts: SocialAccount[];
  newsletters: Newsletter[];
  campaigns: Campaign[];
  accesses: ClientAccess[];
  tasks: ClientTask[];
  messages: ClientMessage[];
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Youtube,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  twitter: "#1DA1F2",
  youtube: "#FF0000",
  tiktok: "#000000",
};

const CAMPAIGN_TYPES: Record<string, { label: string; color: string }> = {
  google_ads: { label: "Google Ads", color: "#4285F4" },
  facebook_ads: { label: "Facebook Ads", color: "#1877F2" },
  linkedin_ads: { label: "LinkedIn Ads", color: "#0A66C2" },
  seo: { label: "SEO", color: "#10B981" },
  email: { label: "Email", color: "#F59E0B" },
  influencer: { label: "Influenceur", color: "#EC4899" },
};

const TASK_STATUS: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  todo: { label: "À faire", color: "#6B7280", icon: Circle },
  in_progress: { label: "En cours", color: "#F59E0B", icon: Loader2 },
  review: { label: "En révision", color: "#8B5CF6", icon: AlertCircle },
  done: { label: "Terminé", color: "#10B981", icon: CheckCircle2 },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
  urgent: "#DC2626",
};

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // Modal states
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showAddAccess, setShowAddAccess] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMessage, setShowAddMessage] = useState(false);

  // Form states
  const [newSocial, setNewSocial] = useState({ platform: "facebook", accountName: "", accountUrl: "", username: "", followers: "" });
  const [newCampaign, setNewCampaign] = useState({ name: "", type: "google_ads", budget: "", startDate: "", endDate: "" });
  const [newAccess, setNewAccess] = useState({ name: "", type: "website", url: "", username: "", password: "", email: "" });
  const [newTask, setNewTask] = useState({ title: "", description: "", type: "content", priority: "medium", dueDate: "" });
  const [newMessage, setNewMessage] = useState({ direction: "outbound", channel: "email", subject: "", content: "" });

  useEffect(() => {
    fetchClient();
  }, [resolvedParams.id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communication/clients/${resolvedParams.id}`);
      const data = await res.json();
      setClient(data);
    } catch (error) {
      console.error("Error fetching client:", error);
    }
    setLoading(false);
  };

  const handleAddSocial = async () => {
    if (!newSocial.accountName) return;
    try {
      await fetch("/api/communication/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: resolvedParams.id,
          ...newSocial,
          followers: newSocial.followers ? parseInt(newSocial.followers) : null,
        }),
      });
      setShowAddSocial(false);
      setNewSocial({ platform: "facebook", accountName: "", accountUrl: "", username: "", followers: "" });
      fetchClient();
    } catch (error) {
      console.error("Error adding social:", error);
    }
  };

  const handleAddCampaign = async () => {
    if (!newCampaign.name) return;
    try {
      await fetch("/api/communication/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: resolvedParams.id,
          ...newCampaign,
          budget: newCampaign.budget ? parseInt(newCampaign.budget) : null,
        }),
      });
      setShowAddCampaign(false);
      setNewCampaign({ name: "", type: "google_ads", budget: "", startDate: "", endDate: "" });
      fetchClient();
    } catch (error) {
      console.error("Error adding campaign:", error);
    }
  };

  const handleAddAccess = async () => {
    if (!newAccess.name) return;
    try {
      await fetch("/api/communication/accesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: resolvedParams.id, ...newAccess }),
      });
      setShowAddAccess(false);
      setNewAccess({ name: "", type: "website", url: "", username: "", password: "", email: "" });
      fetchClient();
    } catch (error) {
      console.error("Error adding access:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;
    try {
      await fetch("/api/communication/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: resolvedParams.id, ...newTask }),
      });
      setShowAddTask(false);
      setNewTask({ title: "", description: "", type: "content", priority: "medium", dueDate: "" });
      fetchClient();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleAddMessage = async () => {
    if (!newMessage.content) return;
    try {
      await fetch("/api/communication/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: resolvedParams.id, ...newMessage }),
      });
      setShowAddMessage(false);
      setNewMessage({ direction: "outbound", channel: "email", subject: "", content: "" });
      fetchClient();
    } catch (error) {
      console.error("Error adding message:", error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetch("/api/communication/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status }),
      });
      fetchClient();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      await fetch(`/api/communication/${type}?id=${id}`, { method: "DELETE" });
      fetchClient();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const togglePassword = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-64 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-64 flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Client non trouvé</p>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: TrendingUp },
    { id: "social", label: "Médias sociaux", icon: Share2, count: client.socialAccounts.length },
    { id: "campaigns", label: "Campagnes", icon: Megaphone, count: client.campaigns.length },
    { id: "accesses", label: "Accès", icon: Key, count: client.accesses.length },
    { id: "tasks", label: "Tâches", icon: CheckSquare, count: client.tasks.filter((t) => t.status !== "done").length },
    { id: "messages", label: "Communications", icon: MessageSquare, count: client.messages.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center gap-4 px-8">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                {client.logoUrl ? (
                  <img src={client.logoUrl} alt={client.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  getInitials(client.name)
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{client.name}</h1>
                <p className="text-sm text-muted-foreground">{client.company || client.industry || "Client"}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-8 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-muted">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-3 gap-6">
              {/* Client info */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Informations</h3>
                <div className="space-y-3 text-sm">
                  {client.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${client.email}`} className="hover:text-primary">{client.email}</a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                        {client.website.replace(/^https?:\/\//, "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {client.industry && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{client.industry}</span>
                    </div>
                  )}
                  {client.monthlyBudget && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>{client.monthlyBudget.toLocaleString()}$/mois</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className="col-span-2 grid grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <Share2 className="h-5 w-5 text-blue-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">{client.socialAccounts.length}</p>
                  <p className="text-sm text-muted-foreground">Réseaux sociaux</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <Megaphone className="h-5 w-5 text-violet-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">{client.campaigns.length}</p>
                  <p className="text-sm text-muted-foreground">Campagnes</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <Key className="h-5 w-5 text-amber-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">{client.accesses.length}</p>
                  <p className="text-sm text-muted-foreground">Accès</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <CheckSquare className="h-5 w-5 text-emerald-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">{client.tasks.filter((t) => t.status !== "done").length}</p>
                  <p className="text-sm text-muted-foreground">Tâches actives</p>
                </div>
              </div>

              {/* Recent tasks */}
              <div className="col-span-2 bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Tâches récentes</h3>
                  <button onClick={() => setActiveTab("tasks")} className="text-sm text-primary hover:underline">
                    Voir tout
                  </button>
                </div>
                {client.tasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune tâche</p>
                ) : (
                  <div className="space-y-2">
                    {client.tasks.slice(0, 5).map((task) => {
                      const statusInfo = TASK_STATUS[task.status] || TASK_STATUS.todo;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <StatusIcon className="h-4 w-4" style={{ color: statusInfo.color }} />
                          <span className="flex-1 text-sm text-foreground">{task.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${PRIORITY_COLORS[task.priority]}20`, color: PRIORITY_COLORS[task.priority] }}>
                            {task.priority}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Social accounts preview */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Réseaux sociaux</h3>
                  <button onClick={() => setActiveTab("social")} className="text-sm text-primary hover:underline">
                    Gérer
                  </button>
                </div>
                {client.socialAccounts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun compte</p>
                ) : (
                  <div className="space-y-2">
                    {client.socialAccounts.map((account) => {
                      const Icon = PLATFORM_ICONS[account.platform] || Share2;
                      return (
                        <div key={account.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <Icon className="h-4 w-4" style={{ color: PLATFORM_COLORS[account.platform] }} />
                          <span className="flex-1 text-sm text-foreground">{account.accountName}</span>
                          {account.followers && (
                            <span className="text-xs text-muted-foreground">{account.followers.toLocaleString()}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === "social" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-foreground">Médias sociaux</h2>
                <button onClick={() => setShowAddSocial(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Ajouter un compte
                </button>
              </div>
              {client.socialAccounts.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun compte de médias sociaux</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {client.socialAccounts.map((account) => {
                    const Icon = PLATFORM_ICONS[account.platform] || Share2;
                    return (
                      <div key={account.id} className="bg-card border border-border rounded-xl p-4 group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${PLATFORM_COLORS[account.platform]}20` }}>
                              <Icon className="h-5 w-5" style={{ color: PLATFORM_COLORS[account.platform] }} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{account.accountName}</p>
                              <p className="text-sm text-muted-foreground capitalize">{account.platform}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteItem("social", account.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {account.followers && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <Users className="h-4 w-4 inline mr-1" />
                            {account.followers.toLocaleString()} abonnés
                          </p>
                        )}
                        {account.accountUrl && (
                          <a href={account.accountUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Voir le profil <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === "campaigns" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-foreground">Campagnes</h2>
                <button onClick={() => setShowAddCampaign(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Nouvelle campagne
                </button>
              </div>
              {client.campaigns.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune campagne</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {client.campaigns.map((campaign) => {
                    const typeInfo = CAMPAIGN_TYPES[campaign.type] || { label: campaign.type, color: "#6B7280" };
                    return (
                      <div key={campaign.id} className="bg-card border border-border rounded-xl p-4 group">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${typeInfo.color}20` }}>
                              <Megaphone className="h-5 w-5" style={{ color: typeInfo.color }} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{campaign.name}</p>
                              <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              campaign.status === "active" ? "bg-emerald-500/10 text-emerald-500" :
                              campaign.status === "paused" ? "bg-amber-500/10 text-amber-500" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {campaign.status}
                            </span>
                            <button onClick={() => handleDeleteItem("campaigns", campaign.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                          {campaign.budget && (
                            <div>
                              <p className="text-muted-foreground">Budget</p>
                              <p className="font-medium text-foreground">{campaign.budget.toLocaleString()}$</p>
                            </div>
                          )}
                          {campaign.impressions && (
                            <div>
                              <p className="text-muted-foreground">Impressions</p>
                              <p className="font-medium text-foreground">{campaign.impressions.toLocaleString()}</p>
                            </div>
                          )}
                          {campaign.clicks && (
                            <div>
                              <p className="text-muted-foreground">Clics</p>
                              <p className="font-medium text-foreground">{campaign.clicks.toLocaleString()}</p>
                            </div>
                          )}
                          {campaign.conversions && (
                            <div>
                              <p className="text-muted-foreground">Conversions</p>
                              <p className="font-medium text-foreground">{campaign.conversions.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Accesses Tab */}
          {activeTab === "accesses" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-foreground">Accès & Liens</h2>
                <button onClick={() => setShowAddAccess(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Ajouter un accès
                </button>
              </div>
              {client.accesses.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun accès enregistré</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Identifiant</th>
                        <th className="px-4 py-3">Mot de passe</th>
                        <th className="px-4 py-3">URL</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.accesses.map((access) => (
                        <tr key={access.id} className="border-t border-border group">
                          <td className="px-4 py-3 font-medium text-foreground">{access.name}</td>
                          <td className="px-4 py-3 text-muted-foreground capitalize">{access.type}</td>
                          <td className="px-4 py-3 text-foreground">{access.username || access.email || "-"}</td>
                          <td className="px-4 py-3">
                            {access.password ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-foreground">
                                  {showPassword[access.id] ? access.password : "••••••••"}
                                </span>
                                <button onClick={() => togglePassword(access.id)} className="p-1 rounded hover:bg-muted">
                                  {showPassword[access.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {access.url ? (
                              <a href={access.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                Ouvrir <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteItem("accesses", access.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-foreground">Tâches</h2>
                <button onClick={() => setShowAddTask(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Nouvelle tâche
                </button>
              </div>
              {client.tasks.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune tâche</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {client.tasks.map((task) => {
                    const statusInfo = TASK_STATUS[task.status] || TASK_STATUS.todo;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div key={task.id} className="bg-card border border-border rounded-xl p-4 group flex items-center gap-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                          style={{ color: statusInfo.color }}
                        >
                          {Object.entries(TASK_STATUS).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                        <div className="flex-1">
                          <p className={`font-medium ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${PRIORITY_COLORS[task.priority]}20`, color: PRIORITY_COLORS[task.priority] }}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                        <button onClick={() => handleDeleteItem("tasks", task.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-foreground">Communications</h2>
                <button onClick={() => setShowAddMessage(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Nouveau message
                </button>
              </div>
              {client.messages.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune communication</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {client.messages.map((message) => (
                    <div key={message.id} className={`bg-card border border-border rounded-xl p-4 ${message.direction === "inbound" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-emerald-500"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${message.direction === "inbound" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                            {message.direction === "inbound" ? "Reçu" : "Envoyé"}
                          </span>
                          <span className="text-sm text-muted-foreground capitalize">{message.channel}</span>
                          {message.isImportant && <AlertCircle className="h-4 w-4 text-amber-500" />}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(message.sentAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {message.subject && <p className="font-medium text-foreground mb-1">{message.subject}</p>}
                      <p className="text-sm text-muted-foreground">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Social Modal */}
        {showAddSocial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Ajouter un compte</h2>
                <button onClick={() => setShowAddSocial(false)} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plateforme</label>
                  <select value={newSocial.platform} onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du compte *</label>
                  <input type="text" value={newSocial.accountName} onChange={(e) => setNewSocial({ ...newSocial, accountName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL du profil</label>
                  <input type="url" value={newSocial.accountUrl} onChange={(e) => setNewSocial({ ...newSocial, accountUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre d'abonnés</label>
                  <input type="number" value={newSocial.followers} onChange={(e) => setNewSocial({ ...newSocial, followers: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddSocial(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Annuler</button>
                <button onClick={handleAddSocial} disabled={!newSocial.accountName} className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">Ajouter</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Campaign Modal */}
        {showAddCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Nouvelle campagne</h2>
                <button onClick={() => setShowAddCampaign(false)} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={newCampaign.type} onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                    {Object.entries(CAMPAIGN_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Budget ($)</label>
                  <input type="number" value={newCampaign.budget} onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date début</label>
                    <input type="date" value={newCampaign.startDate} onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date fin</label>
                    <input type="date" value={newCampaign.endDate} onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddCampaign(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Annuler</button>
                <button onClick={handleAddCampaign} disabled={!newCampaign.name} className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">Créer</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Access Modal */}
        {showAddAccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Ajouter un accès</h2>
                <button onClick={() => setShowAddAccess(false)} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du service *</label>
                  <input type="text" value={newAccess.name} onChange={(e) => setNewAccess({ ...newAccess, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={newAccess.type} onChange={(e) => setNewAccess({ ...newAccess, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                    <option value="website">Site web</option>
                    <option value="hosting">Hébergement</option>
                    <option value="domain">Domaine</option>
                    <option value="analytics">Analytics</option>
                    <option value="cms">CMS</option>
                    <option value="crm">CRM</option>
                    <option value="email">Email</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input type="url" value={newAccess.url} onChange={(e) => setNewAccess({ ...newAccess, url: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Identifiant</label>
                    <input type="text" value={newAccess.username} onChange={(e) => setNewAccess({ ...newAccess, username: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mot de passe</label>
                    <input type="password" value={newAccess.password} onChange={(e) => setNewAccess({ ...newAccess, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddAccess(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Annuler</button>
                <button onClick={handleAddAccess} disabled={!newAccess.name} className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">Ajouter</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Nouvelle tâche</h2>
                <button onClick={() => setShowAddTask(false)} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre *</label>
                  <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select value={newTask.type} onChange={(e) => setNewTask({ ...newTask, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                      <option value="content">Contenu</option>
                      <option value="design">Design</option>
                      <option value="development">Développement</option>
                      <option value="meeting">Réunion</option>
                      <option value="review">Révision</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priorité</label>
                    <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'échéance</label>
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddTask(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Annuler</button>
                <button onClick={handleAddTask} disabled={!newTask.title} className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">Créer</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Message Modal */}
        {showAddMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Nouveau message</h2>
                <button onClick={() => setShowAddMessage(false)} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Direction</label>
                    <select value={newMessage.direction} onChange={(e) => setNewMessage({ ...newMessage, direction: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                      <option value="outbound">Envoyé</option>
                      <option value="inbound">Reçu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Canal</label>
                    <select value={newMessage.channel} onChange={(e) => setNewMessage({ ...newMessage, channel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                      <option value="email">Email</option>
                      <option value="phone">Téléphone</option>
                      <option value="meeting">Réunion</option>
                      <option value="slack">Slack</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sujet</label>
                  <input type="text" value={newMessage.subject} onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contenu *</label>
                  <textarea value={newMessage.content} onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background" rows={4} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddMessage(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Annuler</button>
                <button onClick={handleAddMessage} disabled={!newMessage.content} className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">Envoyer</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
