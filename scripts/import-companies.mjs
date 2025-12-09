import { PrismaClient } from "@prisma/client";
import { createReadStream } from "fs";
import { createInterface } from "readline";

const prisma = new PrismaClient();

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function cleanValue(value) {
  if (!value || value === "" || value === "null" || value === "undefined") {
    return null;
  }
  return value.replace(/^\uFEFF/, "").trim();
}

function cleanUrl(url) {
  if (!url) return null;
  const cleaned = cleanValue(url);
  if (!cleaned) return null;
  if (cleaned.toLowerCase().includes("not found")) return null;
  return cleaned;
}

async function importCompanies() {
  const csvPath = "/home/ubuntu/upload/Entreprises-Gridview.csv";

  const fileStream = createReadStream(csvPath, { encoding: "utf-8" });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = [];
  let lineNumber = 0;
  let imported = 0;
  let skipped = 0;

  for await (const line of rl) {
    lineNumber++;

    if (lineNumber === 1) {
      headers = parseCSVLine(line);
      console.log("Headers:", headers.slice(0, 10));
      continue;
    }

    const values = parseCSVLine(line);
    const name = cleanValue(values[0]);
    if (!name) {
      skipped++;
      continue;
    }

    try {
      const logoRaw = cleanValue(values[1]);
      let logoUrl = null;
      if (logoRaw) {
        const urlMatch = logoRaw.match(/\((https?:\/\/[^)]+)\)/);
        if (urlMatch) {
          logoUrl = urlMatch[1];
        }
      }

      const companyData = {
        name: name,
        logoUrl: logoUrl,
        website: cleanUrl(values[2]),
        address: cleanValue(values[3])?.includes("not found") ? null : cleanValue(values[3]),
        phone: cleanValue(values[4])?.includes("not found") ? null : cleanValue(values[4]),
        type: cleanValue(values[5]),
        mainContactName: cleanValue(values[7]),
        mainContactEmail: cleanValue(values[8]),
        description: cleanValue(values[10]),
        industry: cleanValue(values[11]),
        insight: cleanValue(values[12]),
        engagements: cleanValue(values[13]),
        linkedinUrl: cleanUrl(values[14]),
        facebookUrl: cleanUrl(values[15]),
        instagramUrl: cleanUrl(values[16]),
        agencyPartners: cleanValue(values[17]),
        referralPartners: cleanValue(values[18]),
        isClient: cleanValue(values[27])?.toLowerCase() === values[0]?.toLowerCase() || 
                  cleanValue(values[5])?.toLowerCase() === "client",
        testimonials: cleanValue(values[25]),
        events: cleanValue(values[26]),
      };

      await prisma.company.create({
        data: companyData,
      });

      imported++;
      if (imported % 50 === 0) {
        console.log(`Imported ${imported} companies...`);
      }
    } catch (error) {
      console.error(`Error importing company "${name}":`, error.message);
      skipped++;
    }
  }

  console.log(`\nImport completed!`);
  console.log(`Total imported: ${imported}`);
  console.log(`Total skipped: ${skipped}`);

  await prisma.$disconnect();
}

importCompanies().catch(console.error);
