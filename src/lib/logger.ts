/**
 * Structured Logger with Automatic PII & Secret Redaction
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: string;
  operation?: string;
  requestId?: string;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Patterns of sensitive fields that MUST be redacted
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /key$/i,
  /api[_-]?key/i,
  /service[_-]?role/i,
  /card/i,
  /cvv/i,
  /pan/i,
  /pin/i,
  /ssn/i,
];

/**
 * Recursively redacts sensitive values from objects or arrays
 */
export function sanitizeData(data: any, depth = 0): any {
  if (depth > 5) return "[MaxDepthReached]";
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    // Redact bearer tokens in strings
    if (data.toLowerCase().startsWith("bearer ")) {
      return "Bearer [REDACTED]";
    }
    return data;
  }

  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeData(value, depth + 1);
    }
  }

  return sanitized;
}

class Logger {
  private formatLog(
    level: LogLevel,
    message: string,
    meta?: {
      operation?: string;
      requestId?: string;
      data?: Record<string, any>;
      error?: Error | unknown;
    }
  ): LogPayload {
    const isProd = process.env.NODE_ENV === "production";
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      operation: meta?.operation,
      requestId: meta?.requestId,
      data: meta?.data ? sanitizeData(meta.data) : undefined,
    };

    if (meta?.error) {
      if (meta.error instanceof Error) {
        payload.error = {
          name: meta.error.name,
          message: meta.error.message,
          // Only include stack trace in non-production environments to avoid internal disclosure
          stack: isProd ? undefined : meta.error.stack,
        };
      } else {
        payload.error = {
          name: "UnknownError",
          message: String(meta.error),
        };
      }
    }

    return payload;
  }

  private write(payload: LogPayload) {
    const isProd = process.env.NODE_ENV === "production";

    if (isProd) {
      // In production, emit single-line machine-readable JSON for CloudWatch, Datadog, Vercel, etc.
      console.log(JSON.stringify(payload));
    } else {
      // In development, emit human-readable formatted output
      const prefix = `[${payload.timestamp.split("T")[1]?.slice(0, 8)}] [${payload.level.toUpperCase()}]`;
      const op = payload.operation ? ` (${payload.operation})` : "";
      const msg = `${prefix}${op} ${payload.message}`;

      if (payload.level === "error") {
        console.error(msg, payload.data || "", payload.error || "");
      } else if (payload.level === "warn") {
        console.warn(msg, payload.data || "");
      } else {
        console.log(msg, payload.data || "");
      }
    }
  }

  debug(message: string, meta?: { operation?: string; requestId?: string; data?: Record<string, any> }) {
    if (process.env.NODE_ENV === "development") {
      this.write(this.formatLog("debug", message, meta));
    }
  }

  info(message: string, meta?: { operation?: string; requestId?: string; data?: Record<string, any> }) {
    this.write(this.formatLog("info", message, meta));
  }

  warn(message: string, meta?: { operation?: string; requestId?: string; data?: Record<string, any>; error?: Error | unknown }) {
    this.write(this.formatLog("warn", message, meta));
  }

  error(message: string, meta?: { operation?: string; requestId?: string; data?: Record<string, any>; error?: Error | unknown }) {
    this.write(this.formatLog("error", message, meta));
  }
}

export const logger = new Logger();
