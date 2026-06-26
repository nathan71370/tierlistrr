import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Self-contained server build for Docker / Komodo (.next/standalone).
  output: "standalone",
  // libsql/drizzle ship native bits that should not be bundled by Next.
  serverExternalPackages: ["@libsql/client", "libsql", "drizzle-orm"],
};

export default withNextIntl(nextConfig);
