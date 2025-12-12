import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  details?: unknown;
  statusCode?: number;
}

/**
 * Gère les erreurs API de manière standardisée
 * Expose les détails en développement, messages génériques en production
 */
export function handleApiError(error: unknown, context: string = "API Error"): NextResponse {
  // Logger l'erreur complète en interne
  if (error instanceof Error) {
    console.error(`[${context}]`, {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } else {
    console.error(`[${context}]`, error);
  }

  // Déterminer le message d'erreur
  let errorMessage = "An error occurred while processing your request";
  let statusCode = 500;

  if (error instanceof Error) {
    if (process.env.NODE_ENV === "development") {
      errorMessage = error.message;
    }

    // Gérer les erreurs Prisma
    if (error.message.includes("Unique constraint failed")) {
      errorMessage = "This resource already exists";
      statusCode = 409;
    } else if (error.message.includes("Record to update not found")) {
      errorMessage = "Resource not found";
      statusCode = 404;
    } else if (error.message.includes("Record to delete not found")) {
      errorMessage = "Resource not found";
      statusCode = 404;
    }
  }

  return NextResponse.json(
    { error: errorMessage },
    { status: statusCode }
  );
}

/**
 * Valide et retourne une réponse d'erreur formatée
 */
export function validationError(
  errors: unknown,
  statusCode: number = 400
): NextResponse {
  const response: any = {
    error: "Validation failed",
  };
  
  if (process.env.NODE_ENV === "development" && errors) {
    response.details = errors;
  }
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Retourne une réponse de succès formatée
 */
export function successResponse<T>(data: T, statusCode: number = 200): NextResponse {
  return NextResponse.json(data, { status: statusCode });
}

/**
 * Retourne une réponse d'erreur personnalisée
 */
export function errorResponse(
  message: string,
  statusCode: number = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV === "development" && details && { details }),
    },
    { status: statusCode }
  );
}

/**
 * Classe d'erreur personnalisée pour les API
 */
export class ApiErrorException extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiErrorException";
  }
}
