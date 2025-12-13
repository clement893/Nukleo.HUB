"use client";

import { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { logger } from "@/lib/logger";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  // Logger l'erreur
  logger.error("React Error Boundary caught error", error, "FRONTEND", {
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-card p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Une erreur est survenue
            </h1>
            <p className="text-sm text-muted-foreground">
              Désolé, quelque chose s'est mal passé
            </p>
          </div>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 rounded-lg bg-muted p-4">
            <p className="text-sm font-mono text-red-400 break-all">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Stack trace
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={resetErrorBoundary}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            <Home className="h-4 w-4" />
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        logger.error(
          "Error Boundary caught error",
          error,
          "FRONTEND",
          {
            componentStack: errorInfo?.componentStack || "Unknown",
          }
        );
        if (onError) {
          onError(error, { componentStack: errorInfo?.componentStack || "" });
        }
      }}
      onReset={() => {
        // Optionnel: nettoyer l'état ou rediriger
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
