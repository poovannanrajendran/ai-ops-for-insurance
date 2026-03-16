import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSharedEnv } from "@ai-ops/config";

export function createSupabaseServerClient(): SupabaseClient {
  const env = readSharedEnv();
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
