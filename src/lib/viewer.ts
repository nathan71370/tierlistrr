import { cache } from "react";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import {
  fetchSession,
  logoutUrl,
  AuthUnavailableError,
  SESSION_COOKIE,
} from "limperiam-auth-client";
import { db } from "@/db";
import { user } from "@/db/schema";
import { appSlug, canUseApp } from "@/lib/appAccess";

export type Viewer = { id: string; email: string; name: string };

/**
 * Where the visitor stands. Reading is public whatever the status: only
 * writing needs `ok`.
 * - `ok`          signed in to limperiam-auth AND tierlistrr is open to them
 * - `noAccess`    signed in, but the app isn't open to any of their groups
 * - `signedOut`   no valid session
 * - `unavailable` limperiam-auth didn't answer — we can't tell, so read-only
 */
export type AuthStatus = "ok" | "noAccess" | "signedOut" | "unavailable";

export type AuthState = {
  status: AuthStatus;
  viewer: Viewer | null;
  /** SSO pseudo, also known for `noAccess` so the header can greet them. */
  name: string | null;
  /** Computed here: `logoutUrl()` reads AUTH_PUBLIC_URL, invisible client-side. */
  logoutAction: string;
};

/**
 * Finds (or creates) the local `user` row for someone authenticated by
 * limperiam-auth.
 *
 * The table and its ids are KEPT from the better-auth days: `placements` and
 * `tierlists.owner_id` point at them, so renumbering would hand every ranking
 * and every list to someone else. The only data both sides share is the
 * email, hence the lookup — case-insensitive, so an address once typed as
 * `Pote@…` still lands on the row the SSO now reports as `pote@…`.
 *
 * The SSO pseudo is the source of truth for the display name: it is copied
 * into `user.name` whenever it changed.
 */
export async function resolveLocalUser(email: string, name: string): Promise<Viewer> {
  const find = async () =>
    (
      await db
        .select({ id: user.id, email: user.email, name: user.name })
        .from(user)
        .where(sql`lower(${user.email}) = lower(${email})`)
        .orderBy(user.createdAt)
        .limit(1)
    )[0];

  let row = await find();
  if (!row) {
    const now = new Date();
    // `onConflictDoNothing`: two first requests from the same person would
    // both try to insert; whoever wins, we read the row back.
    await db
      .insert(user)
      .values({ id: crypto.randomUUID(), name, email, emailVerified: true, createdAt: now, updatedAt: now })
      .onConflictDoNothing();
    row = await find();
    if (!row) throw new Error(`Could not create the local user for ${email}`);
  }

  if (row.name !== name) {
    await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, row.id));
  }

  return { id: row.id, email: row.email, name };
}

/**
 * Deduplicated per request with React `cache`: the layout, the page and the
 * server actions all ask, and each ask would otherwise be one more round
 * trip to limperiam-auth.
 *
 * No cache ACROSS requests, on purpose: the token is checked every time, so
 * a disabled account is out immediately.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  const logoutAction = logoutUrl();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  let payload;
  try {
    payload = await fetchSession(token);
  } catch (err) {
    if (err instanceof AuthUnavailableError) {
      console.error("[tierlistrr] limperiam-auth unreachable — serving read-only:", err);
      return { status: "unavailable", viewer: null, name: null, logoutAction };
    }
    throw err;
  }

  if (!payload) return { status: "signedOut", viewer: null, name: null, logoutAction };
  if (!canUseApp(payload, appSlug())) {
    return { status: "noAccess", viewer: null, name: payload.pseudo, logoutAction };
  }

  const viewer = await resolveLocalUser(payload.email, payload.pseudo);
  return { status: "ok", viewer, name: viewer.name, logoutAction };
});
