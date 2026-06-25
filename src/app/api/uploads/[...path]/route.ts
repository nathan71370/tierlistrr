import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOADS_DIR } from "@/db";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  // Resolve and confine to UPLOADS_DIR — reject any traversal.
  const target = path.resolve(UPLOADS_DIR, ...segments);
  if (target !== UPLOADS_DIR && !target.startsWith(UPLOADS_DIR + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(target);
    const type = CONTENT_TYPES[path.extname(target).toLowerCase()] ?? "application/octet-stream";
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
