type LogMetadata = Record<string, string | number | boolean | null | undefined>;

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { message: String(error) };
}

export const logger = {
  info(message: string, metadata?: LogMetadata) {
    console.info(message, metadata ?? {});
  },

  warn(message: string, metadata?: LogMetadata) {
    console.warn(message, metadata ?? {});
  },

  error(message: string, error?: unknown, metadata?: LogMetadata) {
    console.error(message, {
      ...(metadata ?? {}),
      ...(error === undefined ? {} : { error: normalizeError(error) }),
    });
  },
};
