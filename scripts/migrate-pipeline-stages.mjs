/**
 * Script de migration pour mettre à jour les IDs des étapes du pipeline
 * 
 * Ce script met à jour les anciens IDs vers les nouveaux IDs séquentiels
 * pour garantir un ordre correct (1, 2, 3, 4, 5, etc.)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping des anciens IDs vers les nouveaux IDs
const stageMigrations = {
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

async function migratePipelineStages() {
  console.log("🚀 Début de la migration des étapes du pipeline...\n");

  try {
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

    console.log(`📊 ${opportunitiesToMigrate.length} opportunités à migrer\n`);

    if (opportunitiesToMigrate.length === 0) {
      console.log("✅ Aucune migration nécessaire. Toutes les opportunités utilisent déjà les nouveaux IDs.");
      return;
    }

    // Afficher le résumé des migrations
    const migrationSummary = {};
    for (const opp of opportunitiesToMigrate) {
      const newStage = stageMigrations[opp.stage];
      if (!migrationSummary[opp.stage]) {
        migrationSummary[opp.stage] = { count: 0, newStage };
      }
      migrationSummary[opp.stage].count++;
    }

    console.log("📋 Résumé des migrations:");
    for (const [oldStage, { count, newStage }] of Object.entries(migrationSummary)) {
      console.log(`   ${oldStage} → ${newStage} (${count} opportunités)`);
    }
    console.log();

    // Effectuer les migrations
    let migratedCount = 0;
    for (const [oldStage, newStage] of Object.entries(stageMigrations)) {
      const result = await prisma.opportunity.updateMany({
        where: {
          stage: oldStage,
        },
        data: {
          stage: newStage,
        },
      });
      migratedCount += result.count;
      if (result.count > 0) {
        console.log(`✅ ${result.count} opportunités migrées: ${oldStage} → ${newStage}`);
      }
    }

    console.log(`\n✨ Migration terminée! ${migratedCount} opportunités migrées au total.`);
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migratePipelineStages()
  .then(() => {
    console.log("\n✅ Migration réussie!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration échouée:", error);
    process.exit(1);
  });
