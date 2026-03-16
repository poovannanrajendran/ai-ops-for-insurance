export type LogLevel = "info" | "warn" | "error";

export interface LogContext {
  appKey: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface Logger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  child: (extra: Record<string, unknown>) => Logger;
}

function emit(level: LogLevel, context: LogContext, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...(meta ?? {})
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function createLogger(context: LogContext): Logger {
  return {
    info(message, meta) {
      emit("info", context, message, meta);
    },
    warn(message, meta) {
      emit("warn", context, message, meta);
    },
    error(message, meta) {
      emit("error", context, message, meta);
    },
    child(extra) {
      return createLogger({ ...context, ...extra });
    }
  };
}
