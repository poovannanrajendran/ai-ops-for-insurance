import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabaseServerAccess() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function createSupabaseServerClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function createLogger(context: { appKey: string; requestId: string }) {
  function log(level: "info" | "warn", message: string, payload?: Record<string, unknown>) {
    const record = {
      level,
      message,
      ...context,
      ...(payload ? { payload } : {})
    };

    if (level === "warn") {
      console.warn(JSON.stringify(record));
      return;
    }

    console.info(JSON.stringify(record));
  }

  return {
    info(message: string, payload?: Record<string, unknown>) {
      log("info", message, payload);
    },
    warn(message: string, payload?: Record<string, unknown>) {
      log("warn", message, payload);
    }
  };
}
