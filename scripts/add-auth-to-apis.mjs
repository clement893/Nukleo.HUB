#!/usr/bin/env node
/**
 * Script pour ajouter l'authentification à toutes les APIs
 * Usage: node scripts/add-auth-to-apis.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// APIs à exclure (déjà sécurisées ou publiques)
const excludePatterns = [
  'employee-portal',
  'portal',
  'auth',
  'cron',
  'invitations',
  'client-portals', // Utilise déjà getCurrentUser
];

// APIs admin qui nécessitent requireAdmin
const adminPatterns = [
  '/api/admin/',
];

function findRouteFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findRouteFiles(fullPath, files);
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

function shouldExclude(filePath) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function isAdminApi(filePath) {
  return adminPatterns.some(pattern => filePath.includes(pattern));
}

function hasAuthImport(content) {
  return content.includes('requireAuth') || 
         content.includes('requireAdmin') || 
         content.includes('getCurrentUser') ||
         content.includes('api-auth');
}

function addAuthToFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has auth
  if (hasAuthImport(content)) {
    console.log(`SKIP (already has auth): ${filePath}`);
    return false;
  }
  
  const isAdmin = isAdminApi(filePath);
  const authFunc = isAdmin ? 'requireAdmin' : 'requireAuth';
  
  // Add import after existing imports
  const importStatement = `import { ${authFunc}, isErrorResponse } from "@/lib/api-auth";\n`;
  
  // Find the last import line
  const lines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith('import{')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex === -1) {
    // No imports found, add at the beginning
    content = importStatement + content;
  } else {
    // Add after last import
    lines.splice(lastImportIndex + 1, 0, importStatement.trim());
    content = lines.join('\n');
  }
  
  // Add auth check to each exported function
  const functionPatterns = [
    /export async function (GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*\{/g,
  ];
  
  for (const pattern of functionPatterns) {
    content = content.replace(pattern, (match) => {
      const authCheck = `\n  const auth = await ${authFunc}();\n  if (isErrorResponse(auth)) return auth;\n`;
      // Insert after the opening brace
      return match + authCheck;
    });
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`UPDATED: ${filePath} (${authFunc})`);
  return true;
}

// Main
const apiDir = path.join(rootDir, 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route files\n`);

let updated = 0;
let skipped = 0;

for (const file of routeFiles) {
  const relativePath = path.relative(rootDir, file);
  
  if (shouldExclude(file)) {
    console.log(`EXCLUDE: ${relativePath}`);
    skipped++;
    continue;
  }
  
  try {
    if (addAuthToFile(file)) {
      updated++;
    } else {
      skipped++;
    }
  } catch (error) {
    console.error(`ERROR: ${relativePath} - ${error.message}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Updated: ${updated}`);
console.log(`Skipped: ${skipped}`);
console.log(`Total: ${routeFiles.length}`);
