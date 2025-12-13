import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { PIPELINE_STAGES } from "@/types/opportunity";

// Mapping des anciens IDs vers les nouveaux IDs
const stageMigrations: Record<string, string> = {
  "03 - Rencontre booké": "02 - Rencontre booké",
  "04 - En discussion": "03 - En discussion",
  "05 - Proposal to do": "04 - Proposal to do",
  "06 - Proposal sent": "05 - Proposal sent",
  "07 - Contract to do": "06 - Contract to do",
  "En attente ou Silence radio": "07 - En attente ou Silence radio",
  "09 - Closed Won": "10 - Closed Won",
  "Closed Lost": "11 - Closed Lost",
  "Renouvellement à venir": "08 - Renouvellement à venir",
  "Renouvellements potentiels": "09 - Renouvellements potentiels",
  // Ajout de variantes possibles
  "Rencontre bookée": "02 - Rencontre booké",
  "Rencontre booké": "02 - Rencontre booké",
  "En attente": "07 - En attente ou Silence radio",
  "Gagné": "10 - Closed Won",
  "Perdu": "11 - Closed Lost",
};

// POST - Exécuter la migration des étapes du pipeline
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer toutes les opportunités pour détecter les stages à migrer
    const allOpportunities = await prisma.opportunity.findMany({
      select: {
        id: true,
        stage: true,
      },
    });

    // Stages attendus (convertir en string[] pour la comparaison)
    const expectedStages: string[] = PIPELINE_STAGES.map(s => s.id);

    // Trouver les opportunités avec des stages qui ne sont pas dans PIPELINE_STAGES
    const opportunitiesToMigrate = allOpportunities.filter(
      (opp): opp is { id: string; stage: string } => {
        return opp.stage !== null && !expectedStages.includes(opp.stage as string);
      }
    );

    if (opportunitiesToMigrate.length === 0) {
      return NextResponse.json({
        message: "Aucune migration nécessaire. Toutes les opportunités utilisent déjà les nouveaux IDs.",
        migrated: 0,
      });
    }

    // Afficher le résumé des migrations
    const migrationSummary: Record<string, { count: number; newStage: string }> = {};
    for (const opp of opportunitiesToMigrate) {
      const newStage = stageMigrations[opp.stage];
      if (!migrationSummary[opp.stage]) {
        migrationSummary[opp.stage] = { count: 0, newStage };
      }
      migrationSummary[opp.stage].count++;
    }

    // Effectuer les migrations
    let migratedCount = 0;
    const migrations: Array<{ oldStage: string; newStage: string; count: number }> = [];
    const unmappedStages: Record<string, number> = {};

    // Migrer les stages connus
    for (const [oldStage, newStage] of Object.entries(stageMigrations)) {
      const result = await prisma.opportunity.updateMany({
        where: {
          stage: oldStage,
        },
        data: {
          stage: newStage,
        },
      });
      
      if (result.count > 0) {
        migratedCount += result.count;
        migrations.push({
          oldStage,
          newStage,
          count: result.count,
        });
      }
    }

    // Compter les stages non mappés (qui n'ont pas de correspondance dans stageMigrations)
    for (const opp of opportunitiesToMigrate) {
      if (!stageMigrations[opp.stage]) {
        unmappedStages[opp.stage] = (unmappedStages[opp.stage] || 0) + 1;
      }
    }

    logger.info(
      `Pipeline stages migration completed`,
      "MIGRATION",
      { migratedCount, migrations }
    );

    return NextResponse.json({
      message: `Migration terminée! ${migratedCount} opportunités migrées.${Object.keys(unmappedStages).length > 0 ? ` Attention: ${Object.keys(unmappedStages).length} stage(s) non mappé(s) détecté(s).` : ""}`,
      migrated: migratedCount,
      migrations,
      summary: migrationSummary,
      unmappedStages: Object.keys(unmappedStages).length > 0 ? unmappedStages : undefined,
    });
  } catch (error) {
    logger.error(
      "Error migrating pipeline stages",
      error instanceof Error ? error : new Error(String(error)),
      "MIGRATION",
      {}
    );
    return NextResponse.json(
      { error: "Erreur lors de la migration" },
      { status: 500 }
    );
  }
}

// GET - Vérifier l'état de la migration
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer toutes les opportunités pour voir quels stages sont utilisés
    const allOpportunities = await prisma.opportunity.findMany({
      select: {
        id: true,
        stage: true,
        name: true,
      },
    });

    // Stages attendus (convertir en string[] pour la comparaison)
    const expectedStages: string[] = PIPELINE_STAGES.map(s => s.id);

    // Compter par stage
    const stageCounts: Record<string, number> = {};
    for (const opp of allOpportunities) {
      stageCounts[opp.stage] = (stageCounts[opp.stage] || 0) + 1;
    }

    // Trouver les stages qui ne sont pas dans PIPELINE_STAGES
    const unknownStages = Object.keys(stageCounts).filter(
      stage => !expectedStages.includes(stage as string)
    );

    // Compter les opportunités avec les anciens IDs (ceux dans stageMigrations)
    const opportunitiesWithOldStages = allOpportunities.filter(
      opp => Object.keys(stageMigrations).includes(opp.stage)
    );

    const summary: Record<string, number> = {};
    for (const opp of opportunitiesWithOldStages) {
      summary[opp.stage] = (summary[opp.stage] || 0) + 1;
    }

    // Résumé des stages inconnus
    const unknownSummary: Record<string, number> = {};
    for (const stage of unknownStages) {
      unknownSummary[stage] = stageCounts[stage];
    }

    return NextResponse.json({
      needsMigration: opportunitiesWithOldStages.length > 0,
      count: opportunitiesWithOldStages.length,
      summary,
      unknownStages: unknownSummary,
      allStageCounts: stageCounts,
      expectedStages,
      migrations: stageMigrations,
    });
  } catch (error) {
    logger.error(
      "Error checking migration status",
      error instanceof Error ? error : new Error(String(error)),
      "MIGRATION",
      {}
    );
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
