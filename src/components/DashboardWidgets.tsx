"use client";

import {
  TrendingUp,
  DollarSign,
  Target,
  Percent,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Mock data
const kpiData = [
  {
    title: "Opportunités actives",
    value: "47",
    change: "+12%",
    trend: "up",
    icon: Target,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Valeur du pipeline",
    value: "2.4M$",
    change: "+8%",
    trend: "up",
    icon: DollarSign,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Revenus signés",
    value: "890K$",
    change: "+23%",
    trend: "up",
    icon: TrendingUp,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    title: "Taux de conversion",
    value: "34%",
    change: "-2%",
    trend: "down",
    icon: Percent,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

const pipelineData = [
  { name: "Pistes", value: 15, color: "#6366f1" },
  { name: "Qualification", value: 12, color: "#8b5cf6" },
  { name: "Contact", value: 8, color: "#a855f7" },
  { name: "Découverte", value: 6, color: "#d946ef" },
  { name: "Proposition", value: 4, color: "#ec4899" },
  { name: "Négociation", value: 2, color: "#10b981" },
];

const recentActivity = [
  {
    type: "opportunity",
    title: "Campagne digitale Q1",
    client: "TechCorp Inc.",
    time: "Il y a 2h",
    status: "Proposition envoyée",
  },
  {
    type: "project",
    title: "Refonte site web",
    client: "StartupXYZ",
    time: "Il y a 4h",
    status: "En production",
  },
  {
    type: "opportunity",
    title: "Stratégie réseaux sociaux",
    client: "ModeCo",
    time: "Il y a 6h",
    status: "Découverte",
  },
  {
    type: "project",
    title: "Vidéo corporate",
    client: "FinanceGroup",
    time: "Hier",
    status: "Révision interne",
  },
];

const newContacts = [
  { name: "Marie Dupont", company: "TechCorp Inc.", role: "Directrice Marketing" },
  { name: "Jean Martin", company: "StartupXYZ", role: "CEO" },
  { name: "Sophie Bernard", company: "ModeCo", role: "Brand Manager" },
  { name: "Pierre Leroy", company: "FinanceGroup", role: "VP Communication" },
];

const upcomingDeadlines = [
  { title: "Livraison maquettes", project: "Refonte site web", date: "Demain", priority: "high" },
  { title: "Présentation client", project: "Campagne Q1", date: "Dans 2 jours", priority: "medium" },
  { title: "Révision brief", project: "Vidéo corporate", date: "Dans 3 jours", priority: "low" },
];

const weekAgenda = [
  { day: "Lun", events: 3 },
  { day: "Mar", events: 2 },
  { day: "Mer", events: 5 },
  { day: "Jeu", events: 1 },
  { day: "Ven", events: 4 },
];

export function KPICards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => (
        <div
          key={kpi.title}
          className="glass-card rounded-xl p-5 transition-all hover:border-primary/20"
        >
          <div className="flex items-start justify-between">
            <div className={`rounded-lg p-2.5 ${kpi.bgColor}`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div
              className={`flex items-center gap-1 text-sm ${
                kpi.trend === "up" ? "text-accent" : "text-red-500"
              }`}
            >
              {kpi.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {kpi.change}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{kpi.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PipelineChart() {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Répartition du pipeline</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pipelineData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#16161d",
                border: "1px solid #27272a",
                borderRadius: "8px",
                color: "#f4f4f5",
              }}
              cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {pipelineData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RecentActivity() {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Activité récente</h3>
      <div className="space-y-4">
        {recentActivity.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div
              className={`mt-0.5 h-2 w-2 rounded-full ${
                item.type === "opportunity" ? "bg-primary" : "bg-accent"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.client}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {item.status}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewContacts() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Nouveaux contacts</h3>
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {newContacts.map((contact, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20">
              <span className="text-xs font-medium text-secondary">
                {contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {contact.role} • {contact.company}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UpcomingDeadlines() {
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-accent",
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Échéances</h3>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {upcomingDeadlines.map((deadline, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          >
            <div
              className={`mt-1.5 h-2 w-2 rounded-full ${
                priorityColors[deadline.priority as keyof typeof priorityColors]
              }`}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{deadline.title}</p>
              <p className="text-xs text-muted-foreground">{deadline.project}</p>
            </div>
            <span className="text-xs text-muted-foreground">{deadline.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeekAgenda() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Agenda de la semaine</h3>
        <Calendar className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex justify-between gap-2">
        {weekAgenda.map((day, index) => (
          <div
            key={index}
            className="flex-1 text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <p className="text-xs text-muted-foreground mb-2">{day.day}</p>
            <div
              className={`mx-auto h-8 w-8 rounded-full flex items-center justify-center ${
                day.events > 3
                  ? "bg-primary text-white"
                  : day.events > 0
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="text-sm font-medium">{day.events}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
