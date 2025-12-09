"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Target,
  Percent,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

interface HomeData {
  kpis: {
    activeOpportunities: number;
    pipelineValue: number;
    wonAmount: number;
    conversionRate: number;
  };
  pipelineDistribution: Array<{
    stage: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    stage: string | null;
    time: string;
  }>;
  newContacts: Array<{
    id: string;
    name: string;
    company: string;
    position: string;
    photoUrl: string | null;
    time: string;
  }>;
  deadlines: Array<{
    id: string;
    title: string;
    project: string;
    dueDate: string;
    priority: string;
  }>;
  agenda: Array<{
    day: string;
    events: number;
  }>;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M$`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K$`;
  }
  return `${value}$`;
};

export function KPICards() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
            <div className="h-10 w-10 bg-muted rounded-lg mb-4" />
            <div className="h-8 w-20 bg-muted rounded mb-2" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const kpiData = [
    {
      title: "Opportunités actives",
      value: data?.kpis.activeOpportunities.toString() || "0",
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Valeur du pipeline",
      value: formatCurrency(data?.kpis.pipelineValue || 0),
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Revenus signés",
      value: formatCurrency(data?.kpis.wonAmount || 0),
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Taux de conversion",
      value: `${data?.kpis.conversionRate || 0}%`,
      icon: Percent,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

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
            <ArrowUpRight className="h-4 w-4 text-accent" />
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
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-full bg-muted rounded mb-1" />
              <div className="h-2 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pipelineData = data?.pipelineDistribution || [];
  const maxCount = Math.max(...pipelineData.map((p) => p.count), 1);
  const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#10b981", "#14b8a6", "#06b6d4"];

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Répartition du pipeline</h3>
      <div className="space-y-3">
        {pipelineData.map((item, index) => (
          <div key={item.stage} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.stage}</span>
              <span className="text-foreground font-medium">{item.count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: colors[index % colors.length],
                }}
              />
            </div>
          </div>
        ))}
        {pipelineData.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune donnée disponible
          </p>
        )}
      </div>
    </div>
  );
}

export function RecentActivity() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-2 w-2 bg-muted rounded-full mt-2" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentActivity = data?.recentActivity || [];

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Activité récente</h3>
      <div className="space-y-4">
        {recentActivity.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div
              className={`mt-0.5 h-2 w-2 rounded-full ${
                item.type === "opportunity" ? "bg-primary" : "bg-accent"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <div className="text-right">
              {item.stage && (
                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {item.stage}
                </span>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
            </div>
          </div>
        ))}
        {recentActivity.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune activité récente
          </p>
        )}
      </div>
    </div>
  );
}

export function NewContacts() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex justify-between mb-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-5 w-5 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-9 w-9 bg-muted rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const newContacts = data?.newContacts || [];

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Nouveaux contacts</h3>
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {newContacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {contact.photoUrl ? (
              <img
                src={contact.photoUrl}
                alt={contact.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20">
                <span className="text-xs font-medium text-secondary">
                  {contact.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {contact.position ? `${contact.position} • ` : ""}{contact.company}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{contact.time}</span>
          </div>
        ))}
        {newContacts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun nouveau contact
          </p>
        )}
      </div>
    </div>
  );
}

export function UpcomingDeadlines() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const priorityColors: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-accent",
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex justify-between mb-4">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-5 w-5 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-2 w-2 bg-muted rounded-full mt-2" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const deadlines = data?.deadlines || [];

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Échéances</h3>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {deadlines.map((deadline) => (
          <div
            key={deadline.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          >
            <div
              className={`mt-1.5 h-2 w-2 rounded-full ${
                priorityColors[deadline.priority] || "bg-gray-500"
              }`}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{deadline.title}</p>
              <p className="text-xs text-muted-foreground">{deadline.project}</p>
            </div>
            <span className="text-xs text-muted-foreground">{deadline.dueDate}</span>
          </div>
        ))}
        {deadlines.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune échéance à venir
          </p>
        )}
      </div>
    </div>
  );
}

export function WeekAgenda() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex justify-between mb-4">
          <div className="h-6 w-40 bg-muted rounded" />
          <div className="h-5 w-5 bg-muted rounded" />
        </div>
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 text-center p-3 animate-pulse">
              <div className="h-3 w-8 bg-muted rounded mx-auto mb-2" />
              <div className="h-8 w-8 bg-muted rounded-full mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const agenda = data?.agenda || [];

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Agenda de la semaine</h3>
        <Calendar className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex justify-between gap-2">
        {agenda.map((day, index) => (
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
