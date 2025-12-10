import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function updateContactPhotos() {
  // Lire le fichier JSON avec les photos
  const contactsPhotos = JSON.parse(fs.readFileSync('/home/ubuntu/contacts_photos.json', 'utf-8'));
  
  console.log(`📷 Mise à jour des photos pour ${contactsPhotos.length} contacts...`);
  
  let updated = 0;
  let notFound = 0;
  let errors = 0;
  
  for (const contact of contactsPhotos) {
    try {
      // Chercher le contact par nom complet (fullName)
      const result = await prisma.contact.updateMany({
        where: {
          fullName: contact.fullName
        },
        data: {
          photoUrl: contact.photoUrl
        }
      });
      
      if (result.count > 0) {
        updated += result.count;
        console.log(`✅ ${contact.fullName}: photo mise à jour`);
      } else {
        notFound++;
        console.log(`⚠️ ${contact.fullName}: contact non trouvé`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ ${contact.fullName}: erreur - ${error.message}`);
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`   - Mis à jour: ${updated}`);
  console.log(`   - Non trouvés: ${notFound}`);
  console.log(`   - Erreurs: ${errors}`);
  
  await prisma.$disconnect();
}

updateContactPhotos().catch(console.error);
