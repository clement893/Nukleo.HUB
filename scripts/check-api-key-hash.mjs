#!/usr/bin/env node

/**
 * Script pour vérifier le hash SHA-256 d'une clé API
 * Usage: node scripts/check-api-key-hash.mjs <api-key>
 */

import { createHash } from "crypto";

const apiKey = process.argv[2];

if (!apiKey) {
  console.error("Usage: node scripts/check-api-key-hash.mjs <api-key>");
  process.exit(1);
}

const hash = createHash("sha256").update(apiKey).digest("hex");

console.log("Clé API:", apiKey);
console.log("Préfixe:", apiKey.substring(0, 11));
console.log("Hash SHA-256:", hash);
console.log("\nPour vérifier dans la base de données:");
console.log("SELECT * FROM \"ApiKey\" WHERE key = '" + hash + "';");

