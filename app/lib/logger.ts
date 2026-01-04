import { getRequestContext } from "./observability/context";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  tenantId?: string;
  agentId?: string;
  sessionId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

/**
 * Centralized logging utility for the application.
 * Automatically injects request context (correlation ID, tenant ID, etc.) 
 * from AsyncLocalStorage into log messages.
 */
class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const reqContext = getRequestContext();
    
    const mergedContext = {
      correlationId: reqContext?.correlationId,
      tenantId: reqContext?.tenantId || context?.tenantId,
      agentId: reqContext?.agentId || context?.agentId,
      sessionId: reqContext?.sessionId || context?.sessionId,
      ...context,
    };

    const contextStr = Object.keys(mergedContext).length > 0 
      ? ` ${JSON.stringify(mergedContext)}` 
      : "";
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(
      this.formatMessage("error", `${message}: ${errorMessage}`, {
        ...context,
        stack: errorStack,
      })
    );
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, context));
    }
  }
}

export const logger = new Logger();

