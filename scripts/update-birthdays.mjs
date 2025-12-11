import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const birthdays = [
  { name: "Alexei Bissonnette", birthDate: "1998-01-16" },
  { name: "Antoine Doray", birthDate: "1998-09-04" },
  { name: "Margaux Geothals", birthDate: "1996-08-13" },
  { name: "Sarah Katerji", birthDate: "1998-02-23" },
  { name: "Clément Roy", birthDate: "1993-11-13" },
  { name: "Meriem Kouidri", birthDate: "2004-05-22" },
  { name: "Omar Hamdi", birthDate: "1995-07-04" },
  { name: "Timothé Lacoste", birthDate: "1996-03-06" },
  { name: "Camille Gauthier", birthDate: "2001-09-17" },
  { name: "Marie-Claire Lajeunesse", birthDate: "2005-06-08" },
  { name: "Hind Djebien", birthDate: "1999-11-11" },
  { name: "Maxime Besnier", birthDate: "2003-12-30" },
  { name: "Séverine Di Mambro", birthDate: "1972-11-03" },
  { name: "Jean-François Lemieux", birthDate: "1996-10-20" },
];

async function main() {
  console.log("Mise à jour des dates d'anniversaire des employés...");
  
  for (const employee of birthdays) {
    try {
      const result = await prisma.employee.updateMany({
        where: { name: employee.name },
        data: { birthDate: new Date(employee.birthDate) },
      });
      
      if (result.count > 0) {
        console.log(`✓ ${employee.name}: ${employee.birthDate}`);
      } else {
        console.log(`✗ ${employee.name}: Non trouvé`);
      }
    } catch (error) {
      console.error(`Erreur pour ${employee.name}:`, error.message);
    }
  }
  
  console.log("\\nTerminé!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
