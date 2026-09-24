import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// The local `user` table, inherited from the better-auth days and KEPT: the
// `placements` rows and `tierlists.owner_id` point at its ids. Accounts now
// live in limperiam-auth; a row here is found (or created) by email on each
// visit — see `resolveLocalUser` in src/lib/viewer.ts. better-auth's
// `session`, `account` and `verification` tables are no longer used.

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
