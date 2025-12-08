import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parseCSV(content) {
  const lines = content.split("\n");
  const headers = lines[0].replace(/^\uFEFF/, "").split(",");

  const records = [];
  let currentRecord = [];
  let inQuotes = false;
  let currentField = "";

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (line[j + 1] === '"') {
          currentField += '"';
          j++;
        } else {
          inQuotes = false;
        }
      } else if (char === "," && !inQuotes) {
        currentRecord.push(currentField.trim());
        currentField = "";
      } else {
        currentField += char;
      }
    }

    if (!inQuotes) {
      currentRecord.push(currentField.trim());
      currentField = "";

      if (currentRecord.length >= headers.length) {
        const record = {};
        headers.forEach((header, index) => {
          record[header.trim()] = currentRecord[index] || "";
        });
        records.push(record);
      }
      currentRecord = [];
    } else {
      currentField += "\n";
    }
  }

  return records;
}

function extractPhotoUrl(photoField) {
  if (!photoField) return null;
  const match = photoField.match(/\((https?:\/\/[^)]+)\)/);
  return match ? match[1] : null;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month - 1, day);
    }
  }
  return null;
}

async function main() {
  const csvPath = path.join(process.cwd(), "../upload/Contacts-Gridview.csv");
  console.log("Reading CSV from:", csvPath);

  const content = fs.readFileSync(csvPath, "utf-8");
  const records = parseCSV(content);

  console.log(`Found ${records.length} contacts to import`);

  // Clear existing contacts
  console.log("Clearing existing contacts...");
  await prisma.contact.deleteMany({});

  // Insert contacts
  console.log("Inserting contacts...");

  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    const fullName = record["Nom complet"]?.trim();

    if (!fullName) {
      skipped++;
      continue;
    }

    try {
      await prisma.contact.create({
        data: {
          fullName: fullName,
          firstName: record["Prénom"]?.trim() || null,
          lastName: record["Nom"]?.trim() || null,
          level: record["Niveau."] ? parseInt(record["Niveau."], 10) || null : null,
          potentialSale: record["Vente potentielle"]?.toLowerCase() === "checked",
          photoUrl: extractPhotoUrl(record["Photo"]),
          linkedinUrl: record["LinkedIn"]?.trim() || null,
          position: record["Poste"]?.trim() || null,
          company: record["Compagnie"]?.trim() || null,
          email: record["Courriel"]?.trim() || null,
          phone: record["Téléphone"]?.trim() || null,
          relation: record["Relation"]?.trim() || null,
          circles: record["Cercles"]?.trim() || null,
          employmentField: record["Domaine d'emploi"]?.trim() || null,
          lastUpdated: parseDate(record["MAJ"]),
          region: record["Région"]?.trim() || null,
          birthday: record["Anniversaire"]?.trim() || null,
          link: record["Lien"]?.trim() || null,
          tags: record["Tags"]?.trim() || null,
          linkedOpportunities: record["Opportunités liées"]?.trim() || null,
          projects: record["Projets"]?.trim() || null,
          language: record["Langue de correspondance"]?.trim() || null,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing contact "${fullName}":`, error.message);
      skipped++;
    }
  }

  console.log(`Successfully imported ${imported} contacts`);
  console.log(`Skipped ${skipped} records`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
