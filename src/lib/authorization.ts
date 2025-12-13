import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Système RBAC (Role-Based Access Control) pour Next.js
 * Gère les rôles et permissions des utilisateurs
 */

/**
 * Rôles disponibles
 */
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user",
  GUEST = "guest",
}

/**
 * Permissions par rôle
 */
export const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    "manage_users",
    "manage_roles",
    "manage_settings",
    "view_audit_logs",
    "manage_all_resources",
    "delete_accounts",
    "export_data",
    "manage_integrations",
  ],
  [UserRole.ADMIN]: [
    "manage_users",
    "manage_projects",
    "manage_clients",
    "manage_employees",
    "view_reports",
    "export_data",
    "manage_templates",
  ],
  [UserRole.MANAGER]: [
    "manage_projects",
    "manage_tasks",
    "assign_tasks",
    "view_reports",
    "manage_team_members",
  ],
  [UserRole.USER]: [
    "view_projects",
    "view_tasks",
    "create_tasks",
    "update_own_tasks",
    "view_own_profile",
    "update_own_profile",
  ],
  [UserRole.GUEST]: [
    "view_public_content",
  ],
};

/**
 * Vérifie si un utilisateur a une permission
 */
export function hasPermission(userRole: UserRole | string, permission: string): boolean {
  const role = userRole as UserRole;
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Vérifie si un utilisateur a l'un des rôles spécifiés
 */
export function hasRole(userRole: UserRole | string, ...roles: UserRole[]): boolean {
  return roles.includes(userRole as UserRole);
}

/**
 * Vérifie si un utilisateur peut accéder à une ressource
 */
export async function canAccessResource(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string
): Promise<boolean> {
  try {
    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // Super admin a accès à tout
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Vérifier les permissions spécifiques
    const permission = `${action}_${resourceType.toLowerCase()}`;
    return hasPermission(user.role as UserRole, permission);
  } catch (error) {
    console.error("Error checking resource access:", error);
    return false;
  }
}

/**
 * Middleware pour vérifier l'autorisation
 */
export async function checkAuthorization(
  userId: string,
  requiredRole: UserRole | UserRole[]
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });

    if (!user) {
      return { authorized: false, error: "User not found" };
    }

    if (!user.isActive) {
      return { authorized: false, error: "User account is inactive" };
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!hasRole(user.role as UserRole, ...roles)) {
      return { authorized: false, error: "Insufficient permissions" };
    }

    return { authorized: true };
  } catch (error) {
    console.error("Error checking authorization:", error);
    return { authorized: false, error: "Authorization check failed" };
  }
}

/**
 * Retourne une réponse d'erreur d'autorisation
 */
export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Retourne une réponse d'erreur de permission
 */
export function forbiddenResponse(message: string = "Forbidden"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Classe pour gérer les permissions granulaires
 */
export class PermissionManager {
  /**
   * Vérifie si un utilisateur peut effectuer une action sur une ressource
   */
  static async canPerformAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) return false;

      // Super admin peut tout faire
      if (user.role === UserRole.SUPER_ADMIN) return true;

      // Vérifier les permissions du rôle
      const permission = `${action}_${resourceType}`;
      return hasPermission(user.role as UserRole, permission);
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }
}

/**
 * Décorateur pour protéger les routes avec un rôle
 */
export function requireRole(...roles: UserRole[]) {
  return async (userId: string): Promise<NextResponse | null> => {
    if (!userId) {
      return unauthorizedResponse("Authentication required");
    }

    const result = await checkAuthorization(userId, roles);

    if (!result.authorized) {
      return forbiddenResponse(result.error);
    }

    return null; // Autorisation réussie
  };
}

/**
 * Décorateur pour protéger les routes avec une permission
 */
export function requirePermission(permission: string) {
  return async (userId: string): Promise<NextResponse | null> => {
    if (!userId) {
      return unauthorizedResponse("Authentication required");
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || !hasPermission(user.role as UserRole, permission)) {
        return forbiddenResponse("Insufficient permissions");
      }

      return null; // Autorisation réussie
    } catch (error) {
      console.error("Error checking permission:", error);
      return forbiddenResponse("Permission check failed");
    }
  };
}

/**
 * Vérifie si un utilisateur peut accéder à une ressource spécifique
 * basé sur les accès configurés (userAccess)
 */
export async function canAccessSpecificResource(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // Super admin a accès à tout
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Pour les utilisateurs normaux, vérifier les permissions du rôle
    return hasPermission(user.role as UserRole, `view_${resourceType.toLowerCase()}`);
  } catch (error) {
    console.error("Error checking specific resource access:", error);
    return false;
  }
}
