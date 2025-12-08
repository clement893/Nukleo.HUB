import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === "") return null;
  
  // Handle MM/DD/YYYY format
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

function parseValue(valueStr) {
  if (!valueStr || valueStr.trim() === "") return null;
  
  // Remove $ and commas, then parse
  const cleaned = valueStr.replace(/[$,]/g, "");
  const value = parseFloat(cleaned);
  
  return isNaN(value) ? null : value;
}

function normalizeStage(stage) {
  if (!stage || stage.trim() === "") return "00 - Idées de contact";
  
  const stageMap = {
    "00 - Idées de contact": "00 - Idées de contact",
    "00 - Idées de projet": "00 - Idées de projet",
    "01 - Suivi /Emails": "01 - Suivi /Emails",
    "03 - Rencontre booké": "03 - Rencontre booké",
    "04 - En discussion": "04 - En discussion",
    "05 - Proposal to do": "05 - Proposal to do",
    "06 - Proposal sent": "06 - Proposal sent",
    "07 - Contract to do": "07 - Contract to do",
    "En attente ou Silence radio": "En attente ou Silence radio",
    "Renouvellement à venir": "Renouvellement à venir",
    "Renouvellements potentiels": "Renouvellements potentiels",
    "09 - Closed Won": "09 - Closed Won",
    "Closed Lost": "Closed Lost",
  };
  
  return stageMap[stage.trim()] || "00 - Idées de contact";
}

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

async function importOpportunities() {
  const csvPath = process.argv[2] || "/home/ubuntu/upload/Opportunités-Gridview.csv";
  
  console.log(`Reading CSV from: ${csvPath}`);
  
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  
  // Skip header
  const header = parseCSVLine(lines[0]);
  console.log("Headers:", header);
  
  const opportunities = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < 2 || !values[0]) continue;
    
    const name = values[0];
    const value = parseValue(values[1]);
    const company = values[2] || null;
    const referredBy = values[3] || null;
    const leadSourceType = values[4] || null;
    const contact = values[5] || null;
    const completedAt = parseDate(values[6]);
    const stage = normalizeStage(values[7]);
    const proposal = values[8] || null;
    const assignee = values[9] || null;
    const closedDate = parseDate(values[10]);
    const openDate = parseDate(values[11]);
    const region = values[12] || null;
    const segment = values[13] || null;
    const proposalSentDate = parseDate(values[14]);
    const projectType = values[15] || null;
    
    opportunities.push({
      name,
      value,
      company,
      referredBy,
      leadSourceType,
      contact,
      completedAt,
      stage,
      proposal,
      assignee,
      closedDate,
      openDate,
      region,
      segment,
      proposalSentDate,
      projectType,
    });
  }
  
  console.log(`Found ${opportunities.length} opportunities to import`);
  
  // Clear existing data
  console.log("Clearing existing opportunities...");
  await prisma.opportunity.deleteMany();
  
  // Insert new data
  console.log("Inserting opportunities...");
  
  let inserted = 0;
  for (const opp of opportunities) {
    try {
      await prisma.opportunity.create({ data: opp });
      inserted++;
    } catch (error) {
      console.error(`Error inserting "${opp.name}":`, error.message);
    }
  }
  
  console.log(`Successfully imported ${inserted} opportunities`);
  
  await prisma.$disconnect();
}

importOpportunities().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
