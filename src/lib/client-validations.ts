/**
 * Validations Zod côté client
 * Réutilise les schémas serveur pour cohérence
 */

import { z } from "zod";
import {
  contactCreateSchema,
  projectCreateSchema,
  taskCreateSchema,
  opportunityCreateSchema,
  eventCreateSchema,
  testimonialCreateSchema,
  companyCreateSchema,
} from "./validations";

// Réexporter les schémas pour usage client
export {
  contactCreateSchema,
  projectCreateSchema,
  taskCreateSchema,
  opportunityCreateSchema,
  eventCreateSchema,
  testimonialCreateSchema,
  companyCreateSchema,
};

/**
 * Helper pour valider côté client avec messages d'erreur en français
 */
export function validateClient<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Helper pour obtenir le premier message d'erreur
 */
export function getFirstError<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): string | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  
  const firstError = result.error.issues[0];
  return firstError?.message || "Erreur de validation";
}

/**
 * Helper pour obtenir tous les messages d'erreur par champ
 */
export function getFieldErrors<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });
  
  return errors;
}
