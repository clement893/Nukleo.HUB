#!/usr/bin/env node

/**
 * Script pour remplacer automatiquement console.error par logger structuré
 * Usage: node scripts/replace-console-error.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const SRC_DIR = "./src";
const EXCLUDE_PATTERNS = [
  "node_modules",
  ".next",
  ".git",
  "logger.ts", // Ne pas modifier le logger lui-même
];

function shouldProcessFile(filePath) {
  const ext = extname(filePath);
  return [".ts", ".tsx"].includes(ext);
}

function shouldExcludePath(path) {
  return EXCLUDE_PATTERNS.some((pattern) => path.includes(pattern));
}

function findFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldExcludePath(filePath)) {
        findFiles(filePath, fileList);
      }
    } else if (shouldProcessFile(filePath) && !shouldExcludePath(filePath)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function replaceConsoleError(content, filePath) {
  let modified = false;
  let newContent = content;

  // Vérifier si le fichier importe déjà logger
  const hasLoggerImport = /import.*logger.*from.*["']@\/lib\/logger["']/.test(content);
  
  // Patterns à remplacer
  const patterns = [
    // console.error("message", error)
    {
      regex: /console\.error\((["'`])([^"'`]+)\1\s*,\s*(\w+)\)/g,
      replacement: (match, quote, message, errorVar) => {
        modified = true;
        return `logger.error(${quote}${message}${quote}, ${errorVar} instanceof Error ? ${errorVar} : new Error(String(${errorVar})), "${getContext(filePath)}")`;
      },
    },
    // console.error("message", error, extra)
    {
      regex: /console\.error\((["'`])([^"'`]+)\1\s*,\s*(\w+)\s*,\s*({[^}]+})\)/g,
      replacement: (match, quote, message, errorVar, extra) => {
        modified = true;
        return `logger.error(${quote}${message}${quote}, ${errorVar} instanceof Error ? ${errorVar} : new Error(String(${errorVar})), "${getContext(filePath)}", ${extra})`;
      },
    },
    // console.error("message")
    {
      regex: /console\.error\((["'`])([^"'`]+)\1\)/g,
      replacement: (match, quote, message) => {
        modified = true;
        return `logger.error(${quote}${message}${quote}, undefined, "${getContext(filePath)}")`;
      },
    },
    // console.error(error)
    {
      regex: /console\.error\((\w+)\)/g,
      replacement: (match, errorVar) => {
        modified = true;
        return `logger.error("Error", ${errorVar} instanceof Error ? ${errorVar} : new Error(String(${errorVar})), "${getContext(filePath)}")`;
      },
    },
  ];

  patterns.forEach(({ regex, replacement }) => {
    newContent = newContent.replace(regex, replacement);
  });

  // Ajouter l'import logger si nécessaire
  if (modified && !hasLoggerImport) {
    // Trouver la dernière ligne d'import
    const importRegex = /^import\s+.*$/gm;
    const imports = newContent.match(importRegex) || [];
    
    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = newContent.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      newContent =
        newContent.slice(0, insertIndex) +
        '\nimport { logger } from "@/lib/logger";' +
        newContent.slice(insertIndex);
    } else {
      // Pas d'imports, ajouter au début après les commentaires
      const commentRegex = /^(\/\*\*[\s\S]*?\*\/|\/\/.*$)/m;
      const commentMatch = newContent.match(commentRegex);
      
      if (commentMatch) {
        const insertIndex = commentMatch.index + commentMatch[0].length;
        newContent =
          newContent.slice(0, insertIndex) +
          '\nimport { logger } from "@/lib/logger";' +
          newContent.slice(insertIndex);
      } else {
        newContent = 'import { logger } from "@/lib/logger";\n' + newContent;
      }
    }
  }

  return { content: newContent, modified };
}

function getContext(filePath) {
  // Extraire un contexte du chemin du fichier
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1].replace(/\.(ts|tsx)$/, "");
  const dirName = parts[parts.length - 2];
  
  if (filePath.includes("/api/")) {
    return parts.slice(parts.indexOf("api")).join("_").toUpperCase().replace(/\.(TS|TSX)$/, "");
  }
  
  return `${dirName}_${fileName}`.toUpperCase();
}

function main() {
  console.log("🔍 Recherche des fichiers avec console.error...\n");
  
  const files = findFiles(SRC_DIR);
  let processedCount = 0;
  let modifiedCount = 0;

  files.forEach((filePath) => {
    try {
      const content = readFileSync(filePath, "utf-8");
      
      if (content.includes("console.error")) {
        processedCount++;
        const { content: newContent, modified } = replaceConsoleError(content, filePath);
        
        if (modified) {
          writeFileSync(filePath, newContent, "utf-8");
          modifiedCount++;
          console.log(`✅ ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
    }
  });

  console.log(`\n📊 Résumé:`);
  console.log(`   Fichiers traités: ${processedCount}`);
  console.log(`   Fichiers modifiés: ${modifiedCount}`);
  console.log(`\n⚠️  Note: Vérifiez manuellement les remplacements pour vous assurer qu'ils sont corrects.`);
}

main();
