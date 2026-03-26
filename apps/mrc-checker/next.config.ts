import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const appDir = dirname(fileURLToPath(import.meta.url));

loadEnvConfig(appDir);

const nextConfig: NextConfig = {
  transpilePackages: ["@ai-ops/common-ui", "@ai-ops/config"]
};

export default nextConfig;
