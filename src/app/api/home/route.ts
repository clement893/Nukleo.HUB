import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// Stages considered as "won"
const WON_STAGES = ["Gagné", "Closed Won", "Won"];
// Stages considered as "active" (in pipeline)
const ACTIVE_STAGES = [
  "Idées de contact",
  "Idées de projet",
  "Suivi / Emails",
  "Rencontre bookée",
  "En discussion",
  "Proposition à faire",
  "Proposition envoyée",
  "Contrat à faire",
  "En attente",
  "Renouvellement à venir",
  "Renouvellements potentiels",
];

export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    // Get opportunities statistics
    const opportunities = await prisma.opportunity.findMany({
      select: {
        id: true,
        name: true,
        value: true,
        stage: true,
        company: true,
        updatedAt: true,
      },
    });

    const activeOpportunities = opportunities.filter(
      (opp) => opp.stage && ACTIVE_STAGES.includes(opp.stage)
    );
    const wonOpportunities = opportunities.filter(
      (opp) => opp.stage && WON_STAGES.includes(opp.stage)
    );

    const pipelineValue = activeOpportunities.reduce(
      (sum, opp) => sum + (opp.value || 0),
      0
    );
    const wonAmount = wonOpportunities.reduce(
      (sum, opp) => sum + (opp.value || 0),
      0
    );

    // Conversion rate
    const closedCount = wonOpportunities.length + opportunities.filter(
      (opp) => opp.stage && ["Perdu", "Closed Lost", "Lost"].includes(opp.stage)
    ).length;
    const conversionRate = closedCount > 0 
      ? Math.round((wonOpportunities.length / closedCount) * 100) 
      : 0;

    // Stage distribution for chart
    const stageOrder = [
      "Idées de contact",
      "Idées de projet", 
      "Suivi / Emails",
      "Rencontre bookée",
      "En discussion",
      "Proposition à faire",
      "Proposition envoyée",
      "Contrat à faire",
      "En attente",
    ];

    const stageStats: Record<string, number> = {};
    for (const opp of activeOpportunities) {
      const stage = opp.stage || "Autre";
      stageStats[stage] = (stageStats[stage] || 0) + 1;
    }

    const pipelineDistribution = stageOrder
      .filter((stage) => stageStats[stage])
      .map((stage) => ({
        stage: stage.replace("Proposition ", "Prop. ").replace("Rencontre ", "Renc. "),
        count: stageStats[stage],
      }));

    // Recent activity (last 5 updated opportunities)
    const recentActivity = opportunities
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((opp) => ({
        id: opp.id,
        type: "opportunity" as const,
        title: opp.name || "Sans nom",
        subtitle: opp.company || "Entreprise non définie",
        stage: opp.stage,
        time: getRelativeTime(opp.updatedAt),
      }));

    // Recent contacts (last 5 added)
    const recentContacts = await prisma.contact.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        position: true,
        photoUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const newContacts = recentContacts.map((contact) => ({
      id: contact.id,
      name: `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Sans nom",
      company: contact.company || "Non défini",
      position: contact.position || "",
      photoUrl: contact.photoUrl,
      time: getRelativeTime(contact.createdAt),
    }));

    // Recent projects for deadlines
    const projects = await prisma.project.findMany({
      where: {
        status: { in: ["En cours", "En production"] },
      },
      select: {
        id: true,
        name: true,
        client: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const deadlines = projects.map((project, index) => ({
      id: project.id,
      title: project.name || "Sans nom",
      project: project.client || "Client non défini",
      dueDate: formatDate(new Date(Date.now() + (index + 1) * 86400000 * 2)), // Simulated due dates
      priority: index < 2 ? "high" : index < 4 ? "medium" : "low",
    }));

    // Week agenda (simulated based on real data)
    const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
    const agenda = weekDays.map((day, index) => ({
      day,
      events: Math.min(Math.floor(Math.random() * 4) + (recentActivity.length > 0 ? 1 : 0), 5),
    }));

    return NextResponse.json({
      kpis: {
        activeOpportunities: activeOpportunities.length,
        pipelineValue,
        wonAmount,
        conversionRate,
      },
      pipelineDistribution,
      recentActivity,
      newContacts,
      deadlines,
      agenda,
    });
  } catch (error) {
    console.error("Error fetching home data:", error);
    return NextResponse.json(
      { error: "Failed to fetch home data" },
      { status: 500 }
    );
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return formatDate(date);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
  });
}
