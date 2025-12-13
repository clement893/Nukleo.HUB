import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

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
};

// POST - Exécuter la migration des étapes du pipeline
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Compter les opportunités à migrer
    const opportunitiesToMigrate = await prisma.opportunity.findMany({
      where: {
        stage: {
          in: Object.keys(stageMigrations),
        },
      },
      select: {
        id: true,
        stage: true,
      },
    });

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

    logger.info(
      `Pipeline stages migration completed`,
      "MIGRATION",
      { migratedCount, migrations }
    );

    return NextResponse.json({
      message: `Migration terminée! ${migratedCount} opportunités migrées.`,
      migrated: migratedCount,
      migrations,
      summary: migrationSummary,
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

    // Compter les opportunités avec les anciens IDs
    const opportunitiesWithOldStages = await prisma.opportunity.findMany({
      where: {
        stage: {
          in: Object.keys(stageMigrations),
        },
      },
      select: {
        id: true,
        stage: true,
        name: true,
      },
    });

    const summary: Record<string, number> = {};
    for (const opp of opportunitiesWithOldStages) {
      summary[opp.stage] = (summary[opp.stage] || 0) + 1;
    }

    return NextResponse.json({
      needsMigration: opportunitiesWithOldStages.length > 0,
      count: opportunitiesWithOldStages.length,
      summary,
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
