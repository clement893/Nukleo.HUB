import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { cache, CACHE_TTL } from "@/lib/cache";

// Stages considered as "won"
const WON_STAGES = ["Gagné", "Closed Won", "Won"];
// Stages considered as "lost"
const LOST_STAGES = ["Perdu", "Closed Lost", "Lost"];
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

const CACHE_KEY = "dashboard:stats";

export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    // Vérifier le cache
    const cached = cache.get<object>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Requêtes optimisées en parallèle pour les statistiques
    const [opportunities, _totalCount] = await Promise.all([
      prisma.opportunity.findMany({
        select: {
          id: true,
          name: true,
          value: true,
          stage: true,
          company: true,
          contact: true,
          openDate: true,
          closedDate: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 1000, // Limite pour éviter de charger trop de données
      }),
      prisma.opportunity.count(),
    ]);

    // Calculate statistics
    const totalOpportunities = opportunities.length;
    
    const activeOpportunities = opportunities.filter(
      (opp) => opp.stage && ACTIVE_STAGES.includes(opp.stage)
    );
    const activeCount = activeOpportunities.length;
    
    const wonOpportunities = opportunities.filter(
      (opp) => opp.stage && WON_STAGES.includes(opp.stage)
    );
    const wonCount = wonOpportunities.length;
    const wonAmount = wonOpportunities.reduce(
      (sum, opp) => sum + (opp.value || 0),
      0
    );

    const lostOpportunities = opportunities.filter(
      (opp) => opp.stage && LOST_STAGES.includes(opp.stage)
    );
    const lostCount = lostOpportunities.length;

    // Pipeline value (active opportunities)
    const pipelineValue = activeOpportunities.reduce(
      (sum, opp) => sum + (opp.value || 0),
      0
    );

    // Proposals sent count
    const proposalsSent = opportunities.filter(
      (opp) => opp.stage === "Proposition envoyée"
    ).length;

    // Conversion rate (won / (won + lost))
    const closedCount = wonCount + lostCount;
    const conversionRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;

    // Group by stage for chart
    const stageStats: Record<string, { count: number; value: number }> = {};
    for (const opp of opportunities) {
      const stage = opp.stage || "Non défini";
      if (!stageStats[stage]) {
        stageStats[stage] = { count: 0, value: 0 };
      }
      stageStats[stage].count++;
      stageStats[stage].value += opp.value || 0;
    }

    // Convert to array and sort by pipeline order
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
      "Renouvellement à venir",
      "Renouvellements potentiels",
      "Gagné",
      "Perdu",
    ];

    const stageData = stageOrder
      .filter((stage) => stageStats[stage])
      .map((stage) => ({
        stage,
        count: stageStats[stage].count,
        value: stageStats[stage].value,
      }));

    // Recent opportunities (last 10)
    const recentOpportunities = opportunities.slice(0, 10).map((opp) => ({
      id: opp.id,
      name: opp.name,
      value: opp.value,
      stage: opp.stage,
      company: opp.company,
      contact: opp.contact,
      updatedAt: opp.updatedAt,
    }));

    const result = {
      summary: {
        totalOpportunities,
        activeCount,
        pipelineValue,
        proposalsSent,
        wonCount,
        wonAmount,
        lostCount,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      stageData,
      recentOpportunities,
    };

    // Mettre en cache pour 2 minutes
    cache.set(CACHE_KEY, result, CACHE_TTL.MEDIUM);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
