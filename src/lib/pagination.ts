import { z } from "zod";

/**
 * Utilitaires pour la pagination des résultats API
 */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Extraire les paramètres de pagination depuis les query params
 * Si aucun paramètre n'est fourni, retourne null pour compatibilité rétroactive
 */
export function getPaginationParams(searchParams: URLSearchParams): PaginationParams | null {
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  
  // Si aucun paramètre de pagination n'est fourni, retourner null (mode rétrocompatible)
  if (!page && !limit) {
    return null;
  }
  
  const result = paginationSchema.safeParse({ page, limit });
  return result.success ? result.data : { page: 1, limit: 20 };
}

/**
 * Calculer le skip pour Prisma
 */
export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Créer une réponse paginée
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}
