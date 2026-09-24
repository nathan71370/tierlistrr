import type { SessionPayload } from "limperiam-auth-client";

/**
 * Slug of this app in the limperiam-auth catalogue. The admin opens the app to
 * groups from `/admin`, and the session lists the slugs a person may use.
 * Overridable because a card imported from the dashboard may carry another id.
 */
export function appSlug(env: Record<string, string | undefined> = process.env): string {
  return env.AUTH_APP_SLUG?.trim() || "tierlistrr";
}

/**
 * An admin always gets in: a misconfigured catalogue must not lock out the
 * only person able to fix it.
 */
export function canUseApp(payload: Pick<SessionPayload, "isAdmin" | "apps">, slug: string): boolean {
  return payload.isAdmin || payload.apps.includes(slug);
}
