import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// AWS S3 Configuration
const s3Client = new S3Client({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'nukleo-hub-photos';

// Employee data from the Excel file
const employeesData = [
  { name: "Clément", linkedin: "https://www.linkedin.com/in/clement-roy/", department: "Bureau", photo: "Clement(3).jpg" },
  { name: "Alexei", linkedin: "https://www.linkedin.com/in/alexei-bissonnette-9aa38a23a/", department: "Lab", photo: "Alexei(1).png" },
  { name: "Antoine", linkedin: "https://www.linkedin.com/in/antoine-doray-55b77b192/", department: "Admin", photo: "Antoine(1).jpg" },
  { name: "Margaux", linkedin: "https://www.linkedin.com/in/margaux-goethals-8407a5128/", department: "Studio", photo: "Marge(1).jpg" },
  { name: "Camille", linkedin: "https://www.linkedin.com/in/camillegauthier226/", department: "Studio", photo: "Camille(1).png" },
  { name: "Timothé", linkedin: "https://www.linkedin.com/in/timothe-lac/", department: "Lab", photo: "Timothe(1).jpg" },
  { name: "Sarah", linkedin: "https://www.linkedin.com/in/sarah-katerji/", department: "Lab", photo: "Sarah(1).jpg" },
  { name: "Séverine", linkedin: "https://www.linkedin.com/in/s%C3%A9verine-dimambro/", department: "Admin", photo: "Severine(1).jpg" },
  { name: "Maxime", linkedin: "https://www.linkedin.com/in/maxime-besnier/", department: "Bureau", photo: "Maxime(1).png" },
  { name: "Meriem", linkedin: "https://www.linkedin.com/in/meriem-kouidri16/", department: "Bureau", photo: "Meriem(1).jpg" },
  { name: "Jean-François", linkedin: "https://www.linkedin.com/in/jeffldev/", department: "Lab", photo: "Jean-Francois(1).png" },
  { name: "Hind", linkedin: "https://www.linkedin.com/in/hind-djebien-767288195/", department: "Lab", photo: "Hind(1).jpg" },
  { name: "Omar", linkedin: "https://www.linkedin.com/in/omarhamdi/", department: "Bureau", photo: "Omar(1).png" },
  // These don't have photos provided
  { name: "Ricardo", linkedin: "https://www.linkedin.com/in/ricardo-wierzynski/", department: "Lab", photo: null },
  { name: "Marie-Claire", linkedin: "https://www.linkedin.com/in/marieclairelajeunesse/", department: "Studio", photo: null },
];

async function uploadPhoto(photoFilename) {
  if (!photoFilename) return null;
  
  const photoPath = path.join('/home/ubuntu/upload', photoFilename);
  if (!fs.existsSync(photoPath)) {
    console.log(`Photo not found: ${photoPath}`);
    return null;
  }
  
  const fileBuffer = fs.readFileSync(photoPath);
  const ext = path.extname(photoFilename).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
  
  // Generate unique key
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const key = `employees/${timestamp}-${randomSuffix}${ext}`;
  
  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  
  await s3Client.send(command);
  
  const url = `https://${BUCKET_NAME}.s3.us-east-2.amazonaws.com/${key}`;
  console.log(`Uploaded ${photoFilename} -> ${url}`);
  return url;
}

async function main() {
  console.log('Starting employee import...');
  
  // First, delete existing employees to avoid duplicates
  console.log('Clearing existing employees...');
  await prisma.employee.deleteMany({});
  
  console.log('Importing employees...');
  
  for (const emp of employeesData) {
    console.log(`Processing ${emp.name}...`);
    
    // Upload photo
    const photoUrl = await uploadPhoto(emp.photo);
    
    // Create employee
    await prisma.employee.create({
      data: {
        name: emp.name,
        department: emp.department,
        linkedinUrl: emp.linkedin,
        photoUrl: photoUrl,
        capacityHoursPerWeek: 35,
      },
    });
    
    console.log(`✓ Added ${emp.name} (${emp.department})`);
  }
  
  console.log('\nImport complete!');
  
  // Show summary
  const counts = await prisma.employee.groupBy({
    by: ['department'],
    _count: { id: true },
  });
  
  console.log('\nEmployees by department:');
  for (const row of counts) {
    console.log(`  ${row.department}: ${row._count.id}`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
