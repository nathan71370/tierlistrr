import { db } from "@/db";
import { tierlists, tiers, items, placements, user } from "@/db/schema";
import { and, asc, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import type { Item, Tier, Tierlist } from "@/db/schema";

function displayName(name?: string | null, email?: string | null): string | null {
  const n = name?.trim();
  if (n) return n;
  if (email) return email.split("@")[0];
  return null;
}

export type TierlistSummary = Tierlist & {
  itemCount: number;
  thumbs: string[];
  ownerLabel: string | null;
};

export async function getAllTierlists(): Promise<TierlistSummary[]> {
  const lists = await db
    .select({
      ...getTableColumns(tierlists),
      ownerName: user.name,
      ownerEmail: user.email,
    })
    .from(tierlists)
    .leftJoin(user, eq(user.id, tierlists.ownerId))
    .orderBy(desc(tierlists.updatedAt));

  const allItems = await db
    .select({ tierlistId: items.tierlistId, imagePath: items.imagePath })
    .from(items)
    .orderBy(asc(items.position));

  return lists.map(({ ownerName, ownerEmail, ...list }) => {
    const own = allItems.filter((i) => i.tierlistId === list.id);
    return {
      ...list,
      itemCount: own.length,
      thumbs: own
        .map((i) => i.imagePath)
        .filter((p): p is string => Boolean(p))
        .slice(0, 5),
      ownerLabel: displayName(ownerName, ownerEmail),
    };
  });
}

export type Participant = {
  userId: string;
  label: string;
  isOwner: boolean;
  isYou: boolean;
};

export type PlacementMap = Record<string, { tierId: string | null; position: number }>;

export type TierlistView = {
  tierlist: Tierlist;
  ownerLabel: string | null;
  tiers: Tier[];
  items: Item[];
  participants: Participant[];
  viewedUserId: string | null;
  placements: PlacementMap;
  canEdit: boolean;
  isOwner: boolean;
  isAuthed: boolean;
};

export async function getTierlistView(
  slug: string,
  opts: { currentUserId: string | null; requestedUserId: string | null },
): Promise<TierlistView | null> {
  const { currentUserId, requestedUserId } = opts;

  const listRow = await db
    .select({
      ...getTableColumns(tierlists),
      ownerName: user.name,
      ownerEmail: user.email,
    })
    .from(tierlists)
    .leftJoin(user, eq(user.id, tierlists.ownerId))
    .where(eq(tierlists.slug, slug))
    .limit(1);
  if (listRow.length === 0) return null;
  const { ownerName, ownerEmail, ...tierlist } = listRow[0];

  const [tierRows, itemRows, placedUsers] = await Promise.all([
    db.select().from(tiers).where(eq(tiers.tierlistId, tierlist.id)).orderBy(asc(tiers.position)),
    db.select().from(items).where(eq(items.tierlistId, tierlist.id)).orderBy(asc(items.position)),
    db
      .selectDistinct({ userId: placements.userId, name: user.name, email: user.email })
      .from(placements)
      .innerJoin(user, eq(user.id, placements.userId))
      .where(eq(placements.tierlistId, tierlist.id)),
  ]);

  // Make sure we also have labels for the owner and the current user.
  const have = new Set(placedUsers.map((p) => p.userId));
  const need = [tierlist.ownerId, currentUserId]
    .filter((id): id is string => typeof id === "string")
    .filter((id) => !have.has(id));
  const extra = need.length
    ? await db
        .select({ userId: user.id, name: user.name, email: user.email })
        .from(user)
        .where(inArray(user.id, need))
    : [];

  const byId = new Map<string, { userId: string; name: string | null; email: string }>();
  for (const u of [...placedUsers, ...extra]) byId.set(u.userId, u);

  const participants: Participant[] = [...byId.values()].map((u) => ({
    userId: u.userId,
    label: displayName(u.name, u.email) ?? "Anonyme",
    isOwner: u.userId === tierlist.ownerId,
    isYou: u.userId === currentUserId,
  }));
  participants.sort(
    (a, b) =>
      Number(b.isOwner) - Number(a.isOwner) ||
      Number(b.isYou) - Number(a.isYou) ||
      a.label.localeCompare(b.label),
  );

  const valid = new Set(participants.map((p) => p.userId));
  let viewedUserId: string | null = null;
  if (requestedUserId && valid.has(requestedUserId)) viewedUserId = requestedUserId;
  else if (currentUserId && valid.has(currentUserId)) viewedUserId = currentUserId;
  else if (tierlist.ownerId && valid.has(tierlist.ownerId)) viewedUserId = tierlist.ownerId;
  else viewedUserId = participants[0]?.userId ?? null;

  const placementMap: PlacementMap = {};
  if (viewedUserId) {
    const rows = await db
      .select()
      .from(placements)
      .where(
        and(eq(placements.tierlistId, tierlist.id), eq(placements.userId, viewedUserId)),
      );
    for (const r of rows) placementMap[r.itemId] = { tierId: r.tierId, position: r.position };
  }

  return {
    tierlist,
    ownerLabel: displayName(ownerName, ownerEmail),
    tiers: tierRows,
    items: itemRows,
    participants,
    viewedUserId,
    placements: placementMap,
    canEdit: Boolean(currentUserId && viewedUserId === currentUserId),
    isOwner: Boolean(currentUserId && currentUserId === tierlist.ownerId),
    isAuthed: Boolean(currentUserId),
  };
}
