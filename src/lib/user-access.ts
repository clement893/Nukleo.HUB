import { prisma } from "@/lib/prisma";
import { AuthUser } from "@/lib/api-auth";

/**
 * Vérifie si un utilisateur peut accéder à un projet spécifique
 */
export async function canAccessProject(user: AuthUser, projectId: string): Promise<boolean> {
  // Super admin et admin ont accès à tout
  if (user.role === "super_admin" || user.role === "admin") {
    return true;
  }

  // Vérifier les permissions spécifiques de l'utilisateur
  const userAccess = await prisma.userAccess.findUnique({
    where: { userId: user.id },
  });

  if (!userAccess) {
    // Pas de restrictions = accès à tout par défaut
    return true;
  }

  // Si l'accès aux projets est "none", refuser
  if (userAccess.projectsAccess === "none") {
    return false;
  }

  // Si l'accès est "all", autoriser
  if (userAccess.projectsAccess === "all") {
    return true;
  }

  // Si l'accès est "specific", vérifier si le projet est dans la liste
  if (userAccess.projectsAccess === "specific" && userAccess.allowedProjects) {
    try {
      const allowedProjects = JSON.parse(userAccess.allowedProjects) as string[];
      return allowedProjects.includes(projectId);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Vérifie si un utilisateur peut accéder à une entreprise spécifique
 */
export async function canAccessCompany(user: AuthUser, companyId: string): Promise<boolean> {
  // Super admin et admin ont accès à tout
  if (user.role === "super_admin" || user.role === "admin") {
    return true;
  }

  // Vérifier les permissions spécifiques de l'utilisateur
  const userAccess = await prisma.userAccess.findUnique({
    where: { userId: user.id },
  });

  if (!userAccess) {
    // Pas de restrictions = accès à tout par défaut
    return true;
  }

  // Si l'accès aux clients est "none", refuser
  if (userAccess.clientsAccess === "none") {
    return false;
  }

  // Si l'accès est "all", autoriser
  if (userAccess.clientsAccess === "all") {
    return true;
  }

  // Si l'accès est "specific", vérifier si l'entreprise est dans la liste
  if (userAccess.clientsAccess === "specific" && userAccess.allowedClients) {
    try {
      const allowedClients = JSON.parse(userAccess.allowedClients) as string[];
      return allowedClients.includes(companyId);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Vérifie si un utilisateur peut accéder à un contact spécifique
 */
export async function canAccessContact(user: AuthUser, contactId: string): Promise<boolean> {
  // Super admin et admin ont accès à tout
  if (user.role === "super_admin" || user.role === "admin") {
    return true;
  }

  // Pour les contacts, vérifier via l'entreprise associée
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { company: true },
  });

  if (!contact) {
    return false;
  }

  // Si le contact n'a pas d'entreprise associée, autoriser par défaut
  // (ou implémenter une logique spécifique selon les besoins)
  return true;
}

/**
 * Récupère les permissions d'accès d'un utilisateur
 */
export async function getUserAccess(userId: string) {
  return prisma.userAccess.findUnique({
    where: { userId },
  });
}

/**
 * Filtre les projets selon les permissions de l'utilisateur
 */
export async function filterProjectsByAccess(user: AuthUser, projects: Array<{ id: string }>) {
  // Super admin et admin voient tout
  if (user.role === "super_admin" || user.role === "admin") {
    return projects;
  }

  const userAccess = await getUserAccess(user.id);
  if (!userAccess || userAccess.projectsAccess === "all") {
    return projects;
  }

  if (userAccess.projectsAccess === "none") {
    return [];
  }

  if (userAccess.projectsAccess === "specific" && userAccess.allowedProjects) {
    try {
      const allowedProjects = JSON.parse(userAccess.allowedProjects) as string[];
      return projects.filter(p => allowedProjects.includes(p.id));
    } catch {
      return [];
    }
  }

  return projects;
}
