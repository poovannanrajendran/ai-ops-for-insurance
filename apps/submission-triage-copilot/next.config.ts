import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const appDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appDir, "../..");

loadEnvConfig(repoRoot);

const nextConfig: NextConfig = {
  transpilePackages: ["@ai-ops/common-ui", "@ai-ops/config", "@ai-ops/lib"]
};

export default nextConfig;
