"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useAuth } from "./AuthContext";

/**
 * No profile editing any more: the display name is the limperiam-auth pseudo,
 * the source of truth for every app on the domain.
 */
export function HeaderAuth() {
  const t = useTranslations("header");
  const ta = useTranslations("auth");
  const { status, name, logoutAction, signIn } = useAuth();

  if (status === "ok" || status === "noAccess") {
    return (
      <div className="flex items-center gap-2">
        <span className="max-w-[100px] truncate text-sm text-ink-soft sm:max-w-[200px]">{name}</span>
        {status === "noAccess" ? (
          <button
            type="button"
            onClick={signIn}
            className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:text-ink"
          >
            {ta("readOnlyBadge")}
          </button>
        ) : null}
        {/* POST to limperiam-auth, never a link: its logout route refuses GET
            so that an <img> on a third-party site can't sign people out of
            every *.limperiam.com app. */}
        <form method="post" action={logoutAction}>
          <Button size="sm" variant="secondary" type="submit">
            {t("signOut")}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={signIn}>
      {t("signIn")}
    </Button>
  );
}
