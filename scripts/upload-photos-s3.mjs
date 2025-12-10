import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Configuration S3 depuis les variables d'environnement
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const prisma = new PrismaClient();

async function uploadToS3(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Content = fileBuffer.toString('base64');
  
  // Déterminer le content type
  const ext = path.extname(fileName).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
  
  const response = await fetch(`${FORGE_API_URL}/storage/put`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FORGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: `contact-photos/${fileName}`,
      content: base64Content,
      contentType: contentType,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status}`);
  }
  
  const result = await response.json();
  return result.url;
}

async function main() {
  // Lire les photos téléchargées
  const downloadedPhotos = JSON.parse(fs.readFileSync('/home/ubuntu/downloaded_photos.json', 'utf-8'));
  
  console.log(`📤 Upload de ${downloadedPhotos.length} photos sur S3...`);
  
  let uploaded = 0;
  let updated = 0;
  let notFound = 0;
  let errors = 0;
  
  for (const photo of downloadedPhotos) {
    try {
      // Upload sur S3
      const s3Url = await uploadToS3(photo.localPath, photo.filename);
      uploaded++;
      
      // Mettre à jour le contact dans la base de données
      const result = await prisma.contact.updateMany({
        where: { fullName: photo.fullName },
        data: { photoUrl: s3Url },
      });
      
      if (result.count > 0) {
        updated += result.count;
        console.log(`✅ ${photo.fullName}: uploadé et mis à jour`);
      } else {
        notFound++;
        console.log(`⚠️ ${photo.fullName}: uploadé mais contact non trouvé en DB`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ ${photo.fullName}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`   - Uploadés sur S3: ${uploaded}`);
  console.log(`   - Mis à jour en DB: ${updated}`);
  console.log(`   - Contacts non trouvés: ${notFound}`);
  console.log(`   - Erreurs: ${errors}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
