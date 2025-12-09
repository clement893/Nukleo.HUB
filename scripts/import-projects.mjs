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

function parseFloat(value) {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return isNaN(parsed) ? null : parsed;
}

// Normalize status values
function normalizeStatus(status) {
  if (!status) return null;
  const normalized = status.trim();
  
  // Map common variations
  const statusMap = {
    "not started": "Not started",
    "en cours": "En cours",
    "actif": "Actif",
    "done": "Done",
    "optimisation": "Optimisation",
    "retours clients": "Retours clients",
    "demandé": "Demandé",
    "bloqué": "Bloqué",
    "flag": "Flag",
  };

  const lower = normalized.toLowerCase();
  return statusMap[lower] || (normalized.length > 0 && normalized.length < 30 ? normalized : null);
}

async function main() {
  const csvPath = path.join(process.cwd(), "../upload/Projets-Gridview.csv");
  console.log("Reading CSV from:", csvPath);

  const content = fs.readFileSync(csvPath, "utf-8");
  const records = parseCSV(content);

  console.log(`Found ${records.length} projects to import`);

  // Clear existing projects
  console.log("Clearing existing projects...");
  await prisma.project.deleteMany({});

  // Insert projects
  console.log("Inserting projects...");

  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    const name = record["Name"]?.trim();

    if (!name) {
      skipped++;
      continue;
    }

    try {
      await prisma.project.create({
        data: {
          name: name,
          client: record["Client "]?.trim() || null,
          team: record["Équipe"]?.trim() || null,
          status: normalizeStatus(record["Status 1"]),
          stage: record["Étape"]?.trim() || null,
          billing: record["Facturation"]?.trim() || null,
          lead: record["Lead"]?.trim() || null,
          clientComm: record["Comm client"]?.trim() || null,
          contactName: record["Contact"]?.trim() || null,
          contactMethod: record["Contact Method"]?.trim() || null,
          hourlyRate: parseFloat(record["Taux horaire"]),
          proposalUrl: record["Proposal"]?.trim() || null,
          budget: record["Budget"]?.trim() || null,
          driveUrl: record["Drive"]?.trim() || null,
          asanaUrl: record["Asana"]?.trim() || null,
          slackUrl: record["Slack"]?.trim() || null,
          timeline: record["Échéancier"]?.trim() || null,
          projectType: record["Type de projet"]?.trim() || null,
          year: record["Année de réalisation"]?.trim() || null,
          description: record["Description"]?.trim() || null,
          brief: record["Brief"]?.trim() || null,
          testimonial: record["Témoignage"]?.trim() || null,
          portfolio: record["Portfolio"]?.trim() || null,
          report: record["Rapport"]?.trim() || null,
          communication: record["Communication"]?.trim() || null,
          departments: record["Départements"]?.trim() || null,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing project "${name}":`, error.message);
      skipped++;
    }
  }

  console.log(`Successfully imported ${imported} projects`);
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
