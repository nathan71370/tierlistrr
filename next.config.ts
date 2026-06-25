import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libsql/drizzle ship native bits that should not be bundled by Next.
  serverExternalPackages: ["@libsql/client", "libsql", "drizzle-orm"],
};

export default nextConfig;
