// import { prisma } from "@/lib/prisma";

/**
 * Système d'Audit Trail pour Next.js
 * Enregistre toutes les actions sensibles pour la traçabilité
 */

/**
 * Types d'actions auditables
 */
export enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  DOWNLOAD = "DOWNLOAD",
  SHARE = "SHARE",
  ARCHIVE = "ARCHIVE",
  RESTORE = "RESTORE",
  ERROR = "ERROR",
}

/**
 * Types de ressources
 */
export enum ResourceType {
  USER = "USER",
  EMPLOYEE = "EMPLOYEE",
  CLIENT = "CLIENT",
  PROJECT = "PROJECT",
  TASK = "TASK",
  TICKET = "TICKET",
  DOCUMENT = "DOCUMENT",
  CONTACT = "CONTACT",
  COMPANY = "COMPANY",
  PORTAL = "PORTAL",
  INVITATION = "INVITATION",
  REPORT = "REPORT",
  SETTING = "SETTING",
}

/**
 * Interface pour les données d'audit
 */
export interface AuditLogData {
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  resourceName?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure";
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Enregistre une action dans le journal d'audit
 * Note: Nécessite une table AuditLog dans le schéma Prisma
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    // Filtrer les données sensibles avant de les enregistrer
    const sanitizedData = sanitizeAuditData(data);

    // Log en console pour le moment (à remplacer par insertion DB quand la table existe)
    console.log("[AUDIT]", {
      timestamp: new Date().toISOString(),
      ...sanitizedData,
      changes: sanitizedData.changes ? JSON.stringify(sanitizedData.changes) : null,
      metadata: sanitizedData.metadata ? JSON.stringify(sanitizedData.metadata) : null,
    });

    // Décommenter quand la table AuditLog existe dans le schéma Prisma:
    /*
    await prisma.auditLog.create({
      data: {
        userId: sanitizedData.userId,
        action: sanitizedData.action,
        resourceType: sanitizedData.resourceType,
        resourceId: sanitizedData.resourceId,
        resourceName: sanitizedData.resourceName,
        changes: sanitizedData.changes ? JSON.stringify(sanitizedData.changes) : null,
        ipAddress: sanitizedData.ipAddress,
        userAgent: sanitizedData.userAgent,
        status: sanitizedData.status,
        errorMessage: sanitizedData.errorMessage,
        metadata: sanitizedData.metadata ? JSON.stringify(sanitizedData.metadata) : null,
        timestamp: new Date(),
      },
    });
    */
  } catch (error) {
    console.error("Failed to log audit:", error);
    // Ne pas lever d'erreur pour ne pas impacter l'opération principale
  }
}

/**
 * Enregistre une action de création
 */
export async function logCreate(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  resourceName?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.CREATE,
    resourceType,
    resourceId,
    resourceName,
    status: "success",
    metadata,
  });
}

/**
 * Enregistre une action de mise à jour
 */
export async function logUpdate(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  resourceName?: string,
  changes?: { before: Record<string, unknown>; after: Record<string, unknown> },
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.UPDATE,
    resourceType,
    resourceId,
    resourceName,
    changes,
    status: "success",
    metadata,
  });
}

/**
 * Enregistre une action de suppression
 */
export async function logDelete(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  resourceName?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.DELETE,
    resourceType,
    resourceId,
    resourceName,
    status: "success",
    metadata,
  });
}

/**
 * Enregistre une action de lecture
 */
export async function logRead(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  resourceName?: string
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.READ,
    resourceType,
    resourceId,
    resourceName,
    status: "success",
  });
}

/**
 * Enregistre une action d'export
 */
export async function logExport(
  userId: string,
  resourceType: ResourceType,
  count: number,
  format: string
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.EXPORT,
    resourceType,
    resourceId: "bulk",
    status: "success",
    metadata: { count, format },
  });
}

/**
 * Enregistre une erreur
 */
export async function logError(
  userId: string,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  error: Error,
  ipAddress?: string
): Promise<void> {
  await logAudit({
    userId,
    action,
    resourceType,
    resourceId,
    status: "failure",
    errorMessage: error.message,
    ipAddress,
  });
}

/**
 * Nettoie les données sensibles avant l'audit
 */
function sanitizeAuditData(data: AuditLogData): AuditLogData {
  const sanitized = { ...data };

  // Exclure les champs sensibles
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "accessToken",
    "refreshToken",
  ];

  if (sanitized.changes) {
    sanitized.changes = {
      before: sanitizeObject(sanitized.changes.before || {}),
      after: sanitizeObject(sanitized.changes.after || {}),
    };
  }

  if (sanitized.metadata) {
    sanitized.metadata = sanitizeObject(sanitized.metadata);
  }

  function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        result[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        result[key] = sanitizeObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return sanitized;
}

/**
 * Récupère l'adresse IP depuis une requête Next.js
 */
export function getIpAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

/**
 * Récupère le User-Agent depuis une requête Next.js
 */
export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "unknown";
}
