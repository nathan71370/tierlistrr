import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { UPLOADS_DIR } from "@/db";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Save an uploaded File to disk, returning its public /api/uploads path. */
export async function saveImageFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = MIME_EXT[file.type];
  if (!ext) throw new Error("Format d'image non supporté.");
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image trop volumineuse (max 8 Mo).");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${nanoid()}.${ext}`;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return `/api/uploads/${filename}`;
}

/** Delete a locally-stored upload. External URLs are ignored. */
export async function removeImage(imagePath: string | null) {
  if (!imagePath || !imagePath.startsWith("/api/uploads/")) return;
  const filename = imagePath.split("/").pop();
  if (!filename) return;
  await fs.rm(path.join(UPLOADS_DIR, filename), { force: true }).catch(() => {});
}

/**
 * Download a generated image to disk, with retry/backoff on rate limits.
 * A POLLINATIONS_TOKEN (free, from auth.pollinations.ai) raises the rate limit
 * and skips the public queue; it's sent as a header so it never lands in the DB.
 * Returns the local /api/uploads path, or null if it ultimately fails.
 */
export async function downloadImage(url: string): Promise<string | null> {
  const token = process.env.POLLINATIONS_TOKEN;
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);
      let res: Response;
      try {
        res = await fetch(url, { headers, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (res.status === 429 || res.status >= 500) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const type = (res.headers.get("content-type") ?? "image/jpeg")
        .split(";")[0]
        .trim();
      const ext = MIME_EXT[type] ?? "jpg";
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.byteLength === 0) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      const filename = `${nanoid()}.${ext}`;
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
      return `/api/uploads/${filename}`;
    } catch {
      await sleep(1500 * (attempt + 1));
    }
  }
  return null;
}
