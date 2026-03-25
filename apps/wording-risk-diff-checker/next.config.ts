import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appDir, "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@ai-ops/common-ui", "@ai-ops/config"],
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot
  }
};

export default nextConfig;
