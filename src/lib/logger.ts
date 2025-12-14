/**
 * Système de Logging Structuré pour Next.js
 * Différencie les logs de développement et production
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  requestId?: string;
}

/**
 * Logger structuré
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = process.env.NODE_ENV === "production" ? 100 : 1000; // Réduire en production
  private bufferFlushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Flush périodique du buffer en production pour éviter la surcharge mémoire
    if (!this.isDevelopment) {
      this.bufferFlushInterval = setInterval(() => {
        if (this.logBuffer.length > this.maxBufferSize * 0.8) {
          // Garder seulement les 50% les plus récents
          this.logBuffer = this.logBuffer.slice(-Math.floor(this.maxBufferSize / 2));
        }
      }, 60000); // Toutes les minutes
    }
  }

  /**
   * Enregistre un log
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      // Optimisation: limiter la taille des données en production
      data: this.isDevelopment ? data : this.limitDataSize(data),
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    // Ajouter au buffer avec gestion de la taille
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      // Supprimer les entrées les plus anciennes (FIFO)
      this.logBuffer.shift();
    }

    // Afficher dans la console
    this.printLog(entry);

    // En production, envoyer à un service de logging
    if (!this.isDevelopment && level !== LogLevel.DEBUG) {
      this.sendToLoggingService(entry);
    }
  }

  /**
   * Limite la taille des données pour éviter la surcharge mémoire
   */
  private limitDataSize(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined;
    
    const limited: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      // Limiter à 200 caractères par valeur
      limited[key] = stringValue.length > 200 
        ? stringValue.substring(0, 200) + "..." 
        : value;
    }
    return limited;
  }

  /**
   * Affiche un log dans la console
   */
  private printLog(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level}]`;
    const context = entry.context ? ` [${entry.context}]` : "";
    const message = `${prefix}${context} ${entry.message}`;

    const logData = entry.data ? { ...entry.data } : {};

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.log(message, logData);
        }
        break;
      case LogLevel.INFO:
        console.log(message, logData);
        break;
      case LogLevel.WARN:
        console.warn(message, logData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, logData);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
    }
  }

  /**
   * Envoie les logs à un service de logging (Sentry, DataDog, etc.)
   */
  private sendToLoggingService(entry: LogEntry): void {
    // À implémenter avec un service de logging réel
    // Pour maintenant, juste enregistrer
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      // Envoyer à Sentry, DataDog, etc.
      // fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
    }
  }

  /**
   * Log de débogage
   */
  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log d'information
   */
  info(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log d'erreur
   */
  error(
    message: string,
    error?: Error,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  /**
   * Log d'erreur fatale
   */
  fatal(
    message: string,
    error?: Error,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    this.log(LogLevel.FATAL, message, context, data, error);
  }

  /**
   * Récupère les logs du buffer
   */
  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let logs = [...this.logBuffer];

    if (level) {
      logs = logs.filter((log) => log.level === level);
    }

    return logs.slice(-limit);
  }

  /**
   * Vide le buffer de logs
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Nettoyage lors de la destruction
   */
  destroy(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }
    this.logBuffer = [];
  }

  /**
   * Exporte les logs en JSON
   */
  exportLogs(level?: LogLevel): string {
    const logs = this.getLogs(level);
    return JSON.stringify(logs, null, 2);
  }
}

// Instance singleton
export const logger = new Logger();

/**
 * Crée un logger avec contexte
 */
export function createContextLogger(context: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) =>
      logger.debug(message, context, data),
    info: (message: string, data?: Record<string, unknown>) =>
      logger.info(message, context, data),
    warn: (message: string, data?: Record<string, unknown>) =>
      logger.warn(message, context, data),
    error: (message: string, error?: Error, data?: Record<string, unknown>) =>
      logger.error(message, error, context, data),
    fatal: (message: string, error?: Error, data?: Record<string, unknown>) =>
      logger.fatal(message, error, context, data),
  };
}

/**
 * Logger les requêtes API
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
): void {
  const level = statusCode >= 500 ? LogLevel.ERROR : LogLevel.INFO;
  const message = `${method} ${path} - ${statusCode}`;

  logger.info(message, "API", {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });
}

/**
 * Logger les erreurs non capturées
 */
export function logUncaughtError(error: Error, context: string): void {
  logger.fatal(`Uncaught error: ${error.message}`, error, context, {
    type: "uncaught_error",
  });
}

/**
 * Logger les performances
 */
export function logPerformance(
  operation: string,
  duration: number,
  threshold: number = 1000
): void {
  const exceeded = duration > threshold;
  if (exceeded) {
    logger.warn(`Slow operation: ${operation}`, "PERFORMANCE", {
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
    });
  } else {
    logger.debug(`Performance: ${operation}`, "PERFORMANCE", {
      duration: `${duration}ms`,
    });
  }
}

/**
 * Logger les accès sensibles
 */
export function logSensitiveAccess(
  userId: string,
  resource: string,
  action: string,
  ipAddress?: string
): void {
  logger.info(`Sensitive access: ${action} on ${resource}`, "SECURITY", {
    userId,
    resource,
    action,
    ipAddress,
  });
}

/**
 * Logger les tentatives échouées d'authentification
 */
export function logFailedAuth(email: string, ipAddress?: string): void {
  logger.warn(`Failed authentication attempt`, "AUTH", {
    email,
    ipAddress,
  });
}

/**
 * Logger les changements de permission
 */
export function logPermissionChange(
  userId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string
): void {
  logger.info(`Permission changed`, "SECURITY", {
    userId,
    targetUserId,
    oldRole,
    newRole,
  });
}

/**
 * Logger les événements de sécurité génériques
 */
export async function logSecurityEvent(
  event: string,
  userId: string,
  details?: Record<string, unknown>
): Promise<void> {
  logger.info(`Security event: ${event}`, "SECURITY", {
    userId,
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
}
