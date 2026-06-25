import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const tierlists = sqliteTable("tierlists", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
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
