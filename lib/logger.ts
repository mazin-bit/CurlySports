/**
 * Structured logger for production use.
 * Outputs JSON in production for log aggregation services.
 * Outputs human-readable format in development.
 * Never logs sensitive data (user IDs are truncated, no passwords/tokens).
 */

const IS_PROD = process.env.NODE_ENV === "production";

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    // Truncate user IDs to first 8 chars
    if (key === "userId" || key === "user_id") {
      clean[key] = typeof value === "string" ? value.slice(0, 8) + "..." : value;
      continue;
    }
    // Strip sensitive fields entirely
    if (["password", "token", "secret", "apiKey", "authorization"].includes(key)) {
      clean[key] = "[REDACTED]";
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

function log(level: LogLevel, msg: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...(data ? sanitize(data) : {}),
  };

  if (IS_PROD) {
    // JSON output for log aggregation (ELK, Datadog, etc.)
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(JSON.stringify(entry));
  } else {
    // Human-readable in dev
    const prefix = level === "error" ? "ERR" : level === "warn" ? "WRN" : "INF";
    const meta = data ? " " + JSON.stringify(sanitize(data)) : "";
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[${prefix}] ${msg}${meta}`);
  }
}

export const logger = {
  info: (msg: string, data?: Record<string, unknown>) => log("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log("error", msg, data),
};
