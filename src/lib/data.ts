import { db } from "@/db";
import { tierlists, tiers, items } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import type { Item, Tier, Tierlist } from "@/db/schema";

export type TierlistSummary = Tierlist & {
  itemCount: number;
  thumbs: string[];
};

export async function getAllTierlists(): Promise<TierlistSummary[]> {
  const lists = await db
    .select()
    .from(tierlists)
    .orderBy(desc(tierlists.updatedAt));

  const allItems = await db
    .select({
      tierlistId: items.tierlistId,
      imagePath: items.imagePath,
    })
    .from(items)
    .orderBy(asc(items.position));

  return lists.map((list) => {
    const own = allItems.filter((i) => i.tierlistId === list.id);
    return {
      ...list,
      itemCount: own.length,
      thumbs: own
        .map((i) => i.imagePath)
        .filter((p): p is string => Boolean(p))
        .slice(0, 5),
    };
  });
}

export type TierlistBoard = {
  tierlist: Tierlist;
  tiers: Tier[];
  items: Item[];
};

export async function getTierlistBySlug(
  slug: string,
): Promise<TierlistBoard | null> {
  const list = await db
    .select()
    .from(tierlists)
    .where(eq(tierlists.slug, slug))
    .limit(1);
  if (list.length === 0) return null;
  const tierlist = list[0];

  const [tierRows, itemRows] = await Promise.all([
    db
      .select()
      .from(tiers)
      .where(eq(tiers.tierlistId, tierlist.id))
      .orderBy(asc(tiers.position)),
    db
      .select()
      .from(items)
      .where(eq(items.tierlistId, tierlist.id))
      .orderBy(asc(items.position)),
  ]);

  return { tierlist, tiers: tierRows, items: itemRows };
}
