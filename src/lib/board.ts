import type { Item } from "@/db/schema";
import { POOL_ID } from "./constants";

export type Groups = Record<string, Item[]>;

export type Placement = {
  itemId: string;
  tierId: string | null;
  position: number;
};

export type PlacementMap = Record<string, { tierId: string | null; position: number }>;

/**
 * Group shared items into tiers according to a specific participant's
 * placements. Items without a placement fall into the pool, ordered by their
 * default item position.
 */
export function groupByPlacement(
  items: Item[],
  tierIds: string[],
  placements: PlacementMap,
): Groups {
  const groups: Groups = { [POOL_ID]: [] };
  for (const id of tierIds) groups[id] = [];

  const order = new Map<string, number>();
  for (const item of items) {
    const pl = placements[item.id];
    const key = pl?.tierId && groups[pl.tierId] ? pl.tierId : POOL_ID;
    order.set(item.id, pl ? pl.position : item.position);
    groups[key].push(item);
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
  return groups;
}

/** Flatten groups back into the persisted placement list (tierId + position). */
export function toPlacements(groups: Groups): Placement[] {
  const out: Placement[] = [];
  for (const [key, list] of Object.entries(groups)) {
    list.forEach((item, idx) => {
      out.push({
        itemId: item.id,
        tierId: key === POOL_ID ? null : key,
        position: idx,
      });
    });
  }
  return out;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
