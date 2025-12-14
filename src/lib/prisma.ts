import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Configuration optimisée de Prisma Client
 * - Connection pooling pour de meilleures performances
 * - Query logging en développement uniquement
 * - Optimisations pour la production
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" 
    ? ["query", "error", "warn"] 
    : ["error"],
  // Optimisations de performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimiser les requêtes
  errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
});

// Optimisation: fermer proprement les connexions à l'arrêt
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  
  // Cleanup on process termination
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
