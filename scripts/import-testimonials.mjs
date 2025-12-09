import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: node import-testimonials.mjs <path-to-csv>');
  process.exit(1);
}

async function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, ''));
  
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parsing (handles basic cases)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    records.push(record);
  }
  
  return records;
}

function mapStatus(status) {
  const statusMap = {
    'En ligne': 'online',
    'Reçu': 'received',
    'Demandé': 'requested',
  };
  return statusMap[status] || 'pending';
}

async function main() {
  console.log('Parsing CSV...');
  const records = await parseCSV(csvPath);
  console.log(`Found ${records.length} records`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const record of records) {
    const clientName = record['Client'] || record['Entreprises'];
    if (!clientName) {
      skipped++;
      continue;
    }
    
    const textFr = record['Témoignage FR'] || '';
    const textEn = record['Témoignage EN'] || '';
    
    // Skip if no testimonial text
    if (!textFr && !textEn) {
      skipped++;
      continue;
    }
    
    try {
      await prisma.testimonial.create({
        data: {
          clientName,
          contactName: record['Contact'] || null,
          companyName: record['Entreprises'] || clientName,
          status: mapStatus(record['Testimonial Status']),
          textFr: textFr || null,
          textEn: textEn || null,
          titleFr: record['Titre FR'] || null,
          titleEn: record['Titre EN'] || null,
          rating: 5,
          featured: record['Testimonial Status'] === 'En ligne',
        },
      });
      imported++;
      console.log(`✓ Imported: ${clientName}`);
    } catch (error) {
      console.error(`✗ Error importing ${clientName}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
