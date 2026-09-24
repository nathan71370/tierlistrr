"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { AuthStatus } from "@/lib/viewer";

type AuthContextValue = {
  status: AuthStatus;
  name: string | null;
  logoutAction: string;
  /** What every "Sign in" button calls. */
  signIn: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The auth state computed once per request by the root layout, shared with
 * every client component that needs it (header, "new list" button, board).
 *
 * `signIn()` does not always mean "go to the sign-in page". For someone
 * already signed in without access, or while limperiam-auth is down, that
 * page would only bounce straight back here — so they get an explanation
 * instead of a loop.
 */
export function AuthProvider({
  status,
  name,
  logoutAction,
  children,
}: {
  status: AuthStatus;
  name: string | null;
  logoutAction: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("auth");
  const [notice, setNotice] = useState<"noAccess" | "unavailable" | null>(null);

  const signIn = useCallback(() => {
    if (status === "noAccess" || status === "unavailable") {
      setNotice(status);
      return;
    }
    const here = window.location.pathname + window.location.search;
    window.location.href = `/login?next=${encodeURIComponent(here)}`;
  }, [status]);

  const value = useMemo(() => ({ status, name, logoutAction, signIn }), [status, name, logoutAction, signIn]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Modal
        open={notice !== null}
        onClose={() => setNotice(null)}
        title={notice === "unavailable" ? t("unavailableTitle") : t("noAccessTitle")}
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          {notice === "unavailable" ? t("unavailableBody") : t("noAccessBody")}
        </p>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setNotice(null)}>{t("ok")}</Button>
        </div>
      </Modal>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
