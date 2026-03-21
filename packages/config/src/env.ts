import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const sharedEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STATCOUNTER_PROJECT: z.string().min(1).optional(),
  NEXT_PUBLIC_STATCOUNTER_SECURITY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional()
});

export type SharedEnv = z.infer<typeof sharedEnvSchema>;

function readEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((accumulator, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        return accumulator;
      }

      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").trim();

      if (!key) {
        return accumulator;
      }

      accumulator[key] = value;
      return accumulator;
    }, {});
}

function loadSharedEnvFiles(baseDir: string = process.cwd()): Record<string, string> {
  const searchDirs = [resolve(baseDir, "../.."), resolve(baseDir, ".."), baseDir];

  return searchDirs.reduce<Record<string, string>>((accumulator, directory) => {
    for (const fileName of [".env.local", ".env.symphony.local"]) {
      Object.assign(accumulator, readEnvFile(resolve(directory, fileName)));
    }

    return accumulator;
  }, {});
}

export function readSharedEnv(env: NodeJS.ProcessEnv = process.env): SharedEnv {
  return sharedEnvSchema.parse({
    ...loadSharedEnvFiles(),
    ...env
  });
}

export function hasSupabaseServerAccess(env: NodeJS.ProcessEnv = process.env): boolean {
  const parsed = sharedEnvSchema.safeParse({
    ...loadSharedEnvFiles(),
    ...env
  });
  if (!parsed.success) {
    return false;
  }

  return Boolean(
    parsed.data.NEXT_PUBLIC_SUPABASE_URL &&
      (parsed.data.SUPABASE_SERVICE_ROLE_KEY ||
        parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
  );
}
