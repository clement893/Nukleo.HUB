#!/usr/bin/env node

/**
 * Script pour générer une nouvelle clé API
 * 
 * Usage:
 *   node scripts/generate-api-key.mjs "Nom de la clé" [--expires-in-days=30] [--rate-limit=1000] [--allowed-ips=ip1,ip2]
 * 
 * Exemple:
 *   node scripts/generate-api-key.mjs "Site web principal" --expires-in-days=365 --rate-limit=5000
 */

import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

const prisma = new PrismaClient();

function generateApiKey() {
  // Générer une clé aléatoire sécurisée
  const randomPart = randomBytes(32).toString("hex");
  const prefix = "nk_"; // Préfixe Nukleo
  const key = `${prefix}${randomPart}`;
  
  // Hash pour le stockage
  const hashedKey = createHash("sha256").update(key).digest("hex");
  
  return { key, hashedKey, prefix: `${prefix}${randomPart.substring(0, 8)}...` };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("Usage: node scripts/generate-api-key.mjs \"Nom de la clé\" [options]");
    console.error("\nOptions:");
    console.error("  --expires-in-days=N    Nombre de jours avant expiration (défaut: jamais)");
    console.error("  --rate-limit=N         Limite de requêtes par heure (défaut: 1000)");
    console.error("  --allowed-ips=ip1,ip2  IPs autorisées (séparées par virgule, défaut: toutes)");
    console.error("\nExemple:");
    console.error('  node scripts/generate-api-key.mjs "Site web principal" --expires-in-days=365 --rate-limit=5000');
    process.exit(1);
  }

  const name = args[0];
  
  // Parser les options
  let expiresInDays = null;
  let rateLimit = 1000;
  let allowedIps = null;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--expires-in-days=")) {
      expiresInDays = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--rate-limit=")) {
      rateLimit = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--allowed-ips=")) {
      const ips = arg.split("=")[1].split(",").map(ip => ip.trim());
      allowedIps = JSON.stringify(ips);
    }
  }

  // Calculer la date d'expiration
  let expiresAt = null;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  // Générer la clé
  const { key, hashedKey, prefix } = generateApiKey();

  try {
    // Créer la clé dans la base de données
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        keyPrefix: prefix,
        isActive: true,
        expiresAt,
        allowedIps,
        rateLimit,
      },
    });

    console.log("\n✅ Clé API créée avec succès!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`ID:        ${apiKey.id}`);
    console.log(`Nom:       ${apiKey.name}`);
    console.log(`Clé API:   ${key}`);
    console.log(`Préfixe:   ${apiKey.keyPrefix}`);
    console.log(`Limite:    ${apiKey.rateLimit} requêtes/heure`);
    if (apiKey.expiresAt) {
      console.log(`Expire le: ${apiKey.expiresAt.toLocaleDateString("fr-FR")}`);
    } else {
      console.log(`Expire le: Jamais`);
    }
    if (apiKey.allowedIps) {
      const ips = JSON.parse(apiKey.allowedIps);
      console.log(`IPs:       ${ips.join(", ")}`);
    } else {
      console.log(`IPs:       Toutes`);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: Copiez cette clé maintenant, elle ne sera plus affichée!");
    console.log("\nUtilisation:");
    console.log(`  Authorization: Bearer ${key}`);
    console.log(`  ou`);
    console.log(`  X-API-Key: ${key}`);
    console.log("\nEndpoint:");
    console.log(`  GET /api/public/testimonials?language=fr`);
    console.log(`  GET /api/public/testimonials?language=en`);
    console.log("\n");
  } catch (error) {
    console.error("❌ Erreur lors de la création de la clé API:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

