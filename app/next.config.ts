import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Pin the file-tracing root to this project dir. Otherwise Next walks up the
// filesystem, finds an ancestor, and nests the standalone build under
// .next/standalone/<rel-path>/server.js — breaking the Docker COPY paths.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Emit a minimal, self-contained server build at .next/standalone for Docker.
  output: "standalone",
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
