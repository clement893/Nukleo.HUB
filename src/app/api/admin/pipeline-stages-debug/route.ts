import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PIPELINE_STAGES } from "@/types/opportunity";

// GET - Debug: Voir quels stages sont utilisés dans la base de données
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer toutes les opportunités avec leurs stages
    const opportunities = await prisma.opportunity.findMany({
      select: {
        id: true,
        name: true,
        stage: true,
      },
    });

    // Compter par stage
    const stageCounts: Record<string, number> = {};
    for (const opp of opportunities) {
      stageCounts[opp.stage] = (stageCounts[opp.stage] || 0) + 1;
    }

    // Stages attendus (convertir en string[] pour la comparaison)
    const expectedStages: string[] = PIPELINE_STAGES.map(s => s.id);

    // Stages dans la DB qui ne sont pas dans PIPELINE_STAGES
    const unknownStages = Object.keys(stageCounts).filter(
      stage => !expectedStages.includes(stage as string)
    );

    // Stages dans PIPELINE_STAGES qui n'ont pas d'opportunités
    const emptyStages = expectedStages.filter(
      stage => !(stage in stageCounts) || stageCounts[stage] === 0
    );

    return NextResponse.json({
      totalOpportunities: opportunities.length,
      stageCounts,
      expectedStages,
      unknownStages,
      emptyStages,
      opportunities: opportunities.slice(0, 20), // Premières 20 pour debug
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
