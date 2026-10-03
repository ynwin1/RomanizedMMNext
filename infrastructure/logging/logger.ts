type LogMetadata = Record<string, string | number | boolean | null | undefined>;

const DATABASE_URL = /\bmongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi;
const SENSITIVE_QUERY_VALUE = /([?&](?:token|key|secret|password|api[_-]?key)=)[^&\s]+/gi;
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;

export function sanitizeLogString(value: string): string {
  return value
    .replace(DATABASE_URL, "[REDACTED_DATABASE_URL]")
    .replace(SENSITIVE_QUERY_VALUE, "$1[REDACTED]")
    .replace(BEARER_TOKEN, "Bearer [REDACTED]");
}

function sanitizeMetadata(metadata?: LogMetadata): LogMetadata {
  if (!metadata) return {};
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      typeof value === "string" ? sanitizeLogString(value) : value,
    ]),
  );
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: sanitizeLogString(error.message) };
  }

  return { message: sanitizeLogString(String(error)) };
}

export const logger = {
  info(message: string, metadata?: LogMetadata) {
    console.info(sanitizeLogString(message), sanitizeMetadata(metadata));
  },

  warn(message: string, metadata?: LogMetadata) {
    console.warn(sanitizeLogString(message), sanitizeMetadata(metadata));
  },

  error(message: string, error?: unknown, metadata?: LogMetadata) {
    console.error(sanitizeLogString(message), {
      ...sanitizeMetadata(metadata),
      ...(error === undefined ? {} : { error: normalizeError(error) }),
    });
  },
};
