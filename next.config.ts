import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build for Docker / Komodo (.next/standalone).
  output: "standalone",
  // libsql/drizzle ship native bits that should not be bundled by Next.
  serverExternalPackages: ["@libsql/client", "libsql", "drizzle-orm"],
};

export default nextConfig;
