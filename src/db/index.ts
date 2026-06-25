import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

// Local SQLite file. Override with DATABASE_URL (e.g. for a mounted volume).
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

function buildDbUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  return `file:${path.join(DATA_DIR, "tierlistrr.db")}`;
}

// Idempotent schema — keeps self-hosting trivial (no migration step to run).
// busy_timeout lets concurrent build workers wait instead of failing on a lock.
const SCHEMA_SQL = `
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS tierlists (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tiers (
  id TEXT PRIMARY KEY,
  tierlist_id TEXT NOT NULL REFERENCES tierlists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  position INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  tierlist_id TEXT NOT NULL REFERENCES tierlists(id) ON DELETE CASCADE,
  tier_id TEXT REFERENCES tiers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  image_path TEXT,
  image_status TEXT NOT NULL DEFAULT 'ready',
  position INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tiers_tierlist ON tiers(tierlist_id);
CREATE INDEX IF NOT EXISTS idx_items_tierlist ON items(tierlist_id);
CREATE INDEX IF NOT EXISTS idx_items_tier ON items(tier_id);

-- better-auth tables
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_session_user ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_account_user ON account(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);

-- per-user rankings
CREATE TABLE IF NOT EXISTS placements (
  id TEXT PRIMARY KEY,
  tierlist_id TEXT NOT NULL REFERENCES tierlists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tier_id TEXT REFERENCES tiers(id) ON DELETE SET NULL,
  position INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_placement_user_item ON placements(user_id, item_id);
CREATE INDEX IF NOT EXISTS idx_placements_list_user ON placements(tierlist_id, user_id);
`;

declare global {
  var __tierlistrr_db__:
    | { client: Client; db: LibSQLDatabase<typeof schema> }
    | undefined;
}

// Additive, idempotent migrations for databases created before a column existed.
// Each runs on its own; "duplicate column" errors are expected and ignored.
const MIGRATIONS = [
  "ALTER TABLE items ADD COLUMN image_status TEXT NOT NULL DEFAULT 'ready'",
  "ALTER TABLE tierlists ADD COLUMN owner_id TEXT",
];

function init() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const client = createClient({ url: buildDbUrl() });
  client
    .executeMultiple(SCHEMA_SQL)
    .then(async () => {
      for (const sql of MIGRATIONS) {
        await client.execute(sql).catch(() => {});
      }
    })
    .catch((e) => {
      console.error("Failed to initialise database schema:", e);
    });
  const db = drizzle(client, { schema });
  return { client, db };
}

const singleton = globalThis.__tierlistrr_db__ ?? init();
if (process.env.NODE_ENV !== "production") {
  globalThis.__tierlistrr_db__ = singleton;
}

export const db = singleton.db;
export { schema };
