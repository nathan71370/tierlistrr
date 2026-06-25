import type { Item } from "@/db/schema";
import { POOL_ID } from "./constants";

export type Groups = Record<string, Item[]>;

export type Placement = {
  itemId: string;
  tierId: string | null;
  position: number;
};

/** Group items by tier id, with unranked items under POOL_ID, each sorted by position. */
export function groupItems(items: Item[], tierIds: string[]): Groups {
  const groups: Groups = { [POOL_ID]: [] };
  for (const id of tierIds) groups[id] = [];
  for (const item of items) {
    const key = item.tierId && groups[item.tierId] ? item.tierId : POOL_ID;
    groups[key].push(item);
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.position - b.position);
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
