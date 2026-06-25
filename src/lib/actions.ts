"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, UPLOADS_DIR } from "@/db";
import { tierlists, tiers, items } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { DEFAULT_TIERS } from "@/lib/constants";
import { generateItemNames, buildPollinationsUrl } from "@/lib/ai";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

async function saveImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = MIME_EXT[file.type];
  if (!ext) throw new Error("Format d'image non supporté.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image trop volumineuse (max 8 Mo).");
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${nanoid()}.${ext}`;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return `/api/uploads/${filename}`;
}

async function removeImage(imagePath: string | null) {
  // Only locally-stored uploads have a file to remove; AI images are external.
  if (!imagePath || !imagePath.startsWith("/api/uploads/")) return;
  const filename = imagePath.split("/").pop();
  if (!filename) return;
  await fs.rm(path.join(UPLOADS_DIR, filename), { force: true }).catch(() => {});
}

async function touch(tierlistId: string) {
  await db
    .update(tierlists)
    .set({ updatedAt: new Date() })
    .where(eq(tierlists.id, tierlistId));
}

// ---------------------------------------------------------------------------
// Tier lists
// ---------------------------------------------------------------------------

export async function createTierlist(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) throw new Error("Le titre est obligatoire.");

  const now = new Date();
  const id = nanoid();
  const slug = slugify(title);

  await db.insert(tierlists).values({
    id,
    slug,
    title,
    description: description || null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(tiers).values(
    DEFAULT_TIERS.map((t, idx) => ({
      id: nanoid(),
      tierlistId: id,
      label: t.label,
      color: t.color,
      position: idx,
    })),
  );

  revalidatePath("/");
  redirect(`/t/${slug}`);
}

export async function deleteTierlist(id: string) {
  const own = await db
    .select({ imagePath: items.imagePath })
    .from(items)
    .where(eq(items.tierlistId, id));
  // Delete children explicitly so we never depend on FK cascade being enabled.
  await db.delete(items).where(eq(items.tierlistId, id));
  await db.delete(tiers).where(eq(tiers.tierlistId, id));
  await db.delete(tierlists).where(eq(tierlists.id, id));
  await Promise.all(own.map((i) => removeImage(i.imagePath)));
  revalidatePath("/");
}

export async function renameTierlist(
  id: string,
  title: string,
  description: string,
) {
  const t = title.trim();
  if (!t) throw new Error("Le titre est obligatoire.");
  await db
    .update(tierlists)
    .set({ title: t, description: description.trim() || null, updatedAt: new Date() })
    .where(eq(tierlists.id, id));
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export async function addItem(formData: FormData) {
  const tierlistId = String(formData.get("tierlistId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!tierlistId) throw new Error("Tier list introuvable.");
  if (!name) throw new Error("Le nom de l'élément est obligatoire.");

  const file = formData.get("image");
  const imagePath = await saveImage(file instanceof File ? file : null);

  // New items go to the bottom of the unranked pool (tierId = null).
  const pool = await db
    .select({ position: items.position })
    .from(items)
    .where(eq(items.tierlistId, tierlistId));
  const nextPos = pool.reduce((max, r) => Math.max(max, r.position), -1) + 1;

  await db.insert(items).values({
    id: nanoid(),
    tierlistId,
    tierId: null,
    name,
    imagePath,
    position: nextPos,
    createdAt: new Date(),
  });
  await touch(tierlistId);
}

// AI pre-fill: generate item names (Groq) + key-less images (Pollinations),
// dropping the new items into the unranked pool.
export async function generateItems(
  tierlistId: string,
  topic: string,
  count: number,
): Promise<{ created: number }> {
  if (!tierlistId) throw new Error("Tier list introuvable.");
  const cleanTopic = topic.trim();
  if (!cleanTopic) throw new Error("Donne un thème pour la génération.");
  const n = Math.max(1, Math.min(24, Math.round(count) || 12));

  const names = await generateItemNames(cleanTopic, n);

  const pool = await db
    .select({ position: items.position })
    .from(items)
    .where(eq(items.tierlistId, tierlistId));
  let nextPos = pool.reduce((max, r) => Math.max(max, r.position), -1) + 1;

  const now = new Date();
  await db.insert(items).values(
    names.map((name) => ({
      id: nanoid(),
      tierlistId,
      tierId: null,
      name,
      imagePath: buildPollinationsUrl(name, cleanTopic),
      position: nextPos++,
      createdAt: now,
    })),
  );
  await touch(tierlistId);
  return { created: names.length };
}

export async function renameItem(id: string, name: string) {
  const n = name.trim();
  if (!n) throw new Error("Le nom est obligatoire.");
  await db.update(items).set({ name: n }).where(eq(items.id, id));
}

export async function deleteItem(id: string) {
  const row = await db
    .select({ imagePath: items.imagePath })
    .from(items)
    .where(eq(items.id, id))
    .limit(1);
  await db.delete(items).where(eq(items.id, id));
  if (row[0]) await removeImage(row[0].imagePath);
}

export type Placement = {
  itemId: string;
  tierId: string | null;
  position: number;
};

// Persist the full board arrangement after a drag-and-drop.
export async function saveLayout(tierlistId: string, placements: Placement[]) {
  for (const p of placements) {
    await db
      .update(items)
      .set({ tierId: p.tierId, position: p.position })
      .where(eq(items.id, p.itemId));
  }
  await touch(tierlistId);
}

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export async function updateTier(id: string, label: string, color: string) {
  await db
    .update(tiers)
    .set({ label: label.trim() || "?", color })
    .where(eq(tiers.id, id));
}

export async function addTier(tierlistId: string) {
  const existing = await db
    .select({ position: tiers.position })
    .from(tiers)
    .where(eq(tiers.tierlistId, tierlistId));
  const nextPos = existing.reduce((max, r) => Math.max(max, r.position), -1) + 1;
  await db.insert(tiers).values({
    id: nanoid(),
    tierlistId,
    label: "Nouveau",
    color: "#8a8076",
    position: nextPos,
  });
  await touch(tierlistId);
}

export async function deleteTier(id: string) {
  // Send this tier's items back to the unranked pool, then drop the tier.
  await db.update(items).set({ tierId: null }).where(eq(items.tierId, id));
  await db.delete(tiers).where(eq(tiers.id, id));
}

export async function reorderTiers(tierlistId: string, orderedIds: string[]) {
  for (let idx = 0; idx < orderedIds.length; idx++) {
    await db.update(tiers).set({ position: idx }).where(eq(tiers.id, orderedIds[idx]));
  }
  await touch(tierlistId);
}
