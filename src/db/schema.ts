import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const tierlists = sqliteTable("tierlists", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  // null for lists created before auth existed.
  ownerId: text("owner_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const tiers = sqliteTable("tiers", {
  id: text("id").primaryKey(),
  tierlistId: text("tierlist_id")
    .notNull()
    .references(() => tierlists.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  color: text("color").notNull(),
  position: integer("position").notNull(),
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  tierlistId: text("tierlist_id")
    .notNull()
    .references(() => tierlists.id, { onDelete: "cascade" }),
  // null tierId => still in the "à classer" pool.
  tierId: text("tier_id").references(() => tiers.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  imagePath: text("image_path"),
  // 'ready' | 'pending' | 'failed' — drives async AI image generation.
  imageStatus: text("image_status").notNull().default("ready"),
  position: integer("position").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const tierlistsRelations = relations(tierlists, ({ many }) => ({
  tiers: many(tiers),
  items: many(items),
}));

export const tiersRelations = relations(tiers, ({ one, many }) => ({
  tierlist: one(tierlists, {
    fields: [tiers.tierlistId],
    references: [tierlists.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  tierlist: one(tierlists, {
    fields: [items.tierlistId],
    references: [tierlists.id],
  }),
  tier: one(tiers, {
    fields: [items.tierId],
    references: [tiers.id],
  }),
}));

export type Tierlist = typeof tierlists.$inferSelect;
export type Tier = typeof tiers.$inferSelect;
export type Item = typeof items.$inferSelect;

// Per-user ranking: each participant places each shared item into a tier
// (or leaves it in the pool, tierId = null). One row per (user, item).
export const placements = sqliteTable(
  "placements",
  {
    id: text("id").primaryKey(),
    tierlistId: text("tierlist_id")
      .notNull()
      .references(() => tierlists.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    tierId: text("tier_id").references(() => tiers.id, { onDelete: "set null" }),
    position: integer("position").notNull(),
  },
  (t) => [uniqueIndex("uniq_placement_user_item").on(t.userId, t.itemId)],
);

export type Placement = typeof placements.$inferSelect;

