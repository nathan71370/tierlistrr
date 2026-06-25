"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tierlists, tiers, items, placements } from "@/db/schema";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { DEFAULT_TIERS } from "@/lib/constants";
import { generateItemNames } from "@/lib/ai";
import { saveImageFile, removeImage } from "@/lib/images";
import { enqueueImage } from "@/lib/imageQueue";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Connecte-toi pour faire ça.");
  return session.user;
}

// Owner-only guard: management of items and tiers belongs to the list's creator.
async function requireOwnerByTierlist(tierlistId: string) {
  const u = await requireUser();
  const r = await db
    .select({ ownerId: tierlists.ownerId })
    .from(tierlists)
    .where(eq(tierlists.id, tierlistId))
    .limit(1);
  if (!r[0]) throw new Error("Tier list introuvable.");
  if (!r[0].ownerId || r[0].ownerId !== u.id) {
    throw new Error("Seul le créateur peut modifier cette liste.");
  }
  return u;
}

async function tierlistIdOfItem(itemId: string): Promise<string> {
  const r = await db
    .select({ tierlistId: items.tierlistId })
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);
  if (!r[0]) throw new Error("Élément introuvable.");
  return r[0].tierlistId;
}

async function tierlistIdOfTier(tierId: string): Promise<string> {
  const r = await db
    .select({ tierlistId: tiers.tierlistId })
    .from(tiers)
    .where(eq(tiers.id, tierId))
    .limit(1);
  if (!r[0]) throw new Error("Tier introuvable.");
  return r[0].tierlistId;
}

const requireOwnerByItem = async (itemId: string) =>
  requireOwnerByTierlist(await tierlistIdOfItem(itemId));
const requireOwnerByTier = async (tierId: string) =>
  requireOwnerByTierlist(await tierlistIdOfTier(tierId));

async function tierlistTitle(id: string): Promise<string> {
  const r = await db
    .select({ title: tierlists.title })
    .from(tierlists)
    .where(eq(tierlists.id, id))
    .limit(1);
  return r[0]?.title ?? "";
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
  const user = await requireUser();
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
    ownerId: user.id,
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
  await requireOwnerByTierlist(id);
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
  await requireOwnerByTierlist(id);
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
  await requireOwnerByTierlist(tierlistId);

  const wantsAiImage = String(formData.get("generateImage") ?? "") === "1";
  const file = formData.get("image");
  const imagePath = wantsAiImage
    ? null
    : await saveImageFile(file instanceof File ? file : null);

  // New items go to the bottom of the unranked pool (tierId = null).
  const pool = await db
    .select({ position: items.position })
    .from(items)
    .where(eq(items.tierlistId, tierlistId));
  const nextPos = pool.reduce((max, r) => Math.max(max, r.position), -1) + 1;

  const id = nanoid();
  await db.insert(items).values({
    id,
    tierlistId,
    tierId: null,
    name,
    imagePath,
    imageStatus: wantsAiImage ? "pending" : "ready",
    position: nextPos,
    createdAt: new Date(),
  });
  await touch(tierlistId);

  if (wantsAiImage) {
    enqueueImage({ itemId: id, name, topic: await tierlistTitle(tierlistId) });
  }
}

// Re-generate (or generate) the AI image for a single existing item.
export async function generateItemImage(itemId: string) {
  await requireOwnerByItem(itemId);
  const row = await db
    .select({ name: items.name, topic: tierlists.title })
    .from(items)
    .innerJoin(tierlists, eq(items.tierlistId, tierlists.id))
    .where(eq(items.id, itemId))
    .limit(1);
  if (!row[0]) throw new Error("Élément introuvable.");
  await db
    .update(items)
    .set({ imageStatus: "pending" })
    .where(eq(items.id, itemId));
  enqueueImage({ itemId, name: row[0].name, topic: row[0].topic });
}

// AI pre-fill: generate item names (Groq), insert them immediately so they can
// be ranked right away, and enqueue their images for background generation.
export async function generateItems(
  tierlistId: string,
  topic: string,
  count: number,
): Promise<{ created: number }> {
  if (!tierlistId) throw new Error("Tier list introuvable.");
  await requireOwnerByTierlist(tierlistId);
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
  const rows = names.map((name) => ({
    id: nanoid(),
    tierlistId,
    tierId: null,
    name,
    imagePath: null,
    imageStatus: "pending",
    position: nextPos++,
    createdAt: now,
  }));
  await db.insert(items).values(rows);
  await touch(tierlistId);

  for (const r of rows) {
    enqueueImage({ itemId: r.id, name: r.name, topic: cleanTopic });
  }
  return { created: rows.length };
}

export async function renameItem(id: string, name: string) {
  await requireOwnerByItem(id);
  const n = name.trim();
  if (!n) throw new Error("Le nom est obligatoire.");
  await db.update(items).set({ name: n }).where(eq(items.id, id));
}

export async function deleteItem(id: string) {
  await requireOwnerByItem(id);
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

// Persist the current user's full ranking for a list (one row per item).
// Any logged-in user may save their own placements; that makes them a participant.
export async function savePlacements(tierlistId: string, list: Placement[]) {
  const u = await requireUser();
  await db
    .delete(placements)
    .where(
      and(eq(placements.tierlistId, tierlistId), eq(placements.userId, u.id)),
    );
  if (list.length) {
    await db.insert(placements).values(
      list.map((p) => ({
        id: nanoid(),
        tierlistId,
        userId: u.id,
        itemId: p.itemId,
        tierId: p.tierId,
        position: p.position,
      })),
    );
  }
  await touch(tierlistId);
}

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export async function updateTier(id: string, label: string, color: string) {
  await requireOwnerByTier(id);
  await db
    .update(tiers)
    .set({ label: label.trim() || "?", color })
    .where(eq(tiers.id, id));
}

export async function addTier(tierlistId: string) {
  await requireOwnerByTierlist(tierlistId);
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
  await requireOwnerByTier(id);
  // Everyone's items in this tier fall back to their pool, then drop the tier.
  await db.update(placements).set({ tierId: null }).where(eq(placements.tierId, id));
  await db.delete(tiers).where(eq(tiers.id, id));
}

export async function reorderTiers(tierlistId: string, orderedIds: string[]) {
  await requireOwnerByTierlist(tierlistId);
  for (let idx = 0; idx < orderedIds.length; idx++) {
    await db.update(tiers).set({ position: idx }).where(eq(tiers.id, orderedIds[idx]));
  }
  await touch(tierlistId);
}
