"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { SignInModal } from "./SignInModal";
import { ProfileModal } from "./ProfileModal";

export function HeaderAuth() {
  const t = useTranslations("header");
  const { data, isPending, isRefetching } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  const user = data?.user;
  // better-auth re-checks the session every time the tab comes back to the
  // foreground, and for a signed-out visitor that refetch flips isPending back
  // to true. Only the very first load may swap the header for a skeleton:
  // otherwise leaving the app to read the emailed code and coming back would
  // unmount the modal below and throw that code entry away.
  const loading = isPending && !isRefetching;

  return (
    <>
      {loading ? (
        <div className="h-9 w-28 animate-pulse rounded-full bg-cream-deep" />
      ) : user ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProfileOpen(true)}
            title={t("editName")}
            className="group inline-flex max-w-[100px] items-center gap-1.5 text-sm text-ink-soft hover:text-ink sm:max-w-[200px]"
          >
            <span className="truncate">{user.name?.trim() || user.email.split("@")[0]}</span>
            <Pencil size={13} className="shrink-0 opacity-60 transition group-hover:opacity-100" />
          </button>
          <Button
            size="sm"
            variant="secondary"
            disabled={signingOut}
            onClick={() =>
              startSignOut(async () => {
                await signOut();
                router.refresh();
              })
            }
          >
            {t("signOut")}
          </Button>
          <ProfileModal
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            initialName={user.name ?? ""}
            email={user.email}
          />
        </div>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          {t("signIn")}
        </Button>
      )}
      {/* Rendered whatever the session state is: a modal that only exists in
          the signed-out branch loses everything typed into it the moment the
          session is re-checked. */}
      <SignInModal open={open && !user} onClose={() => setOpen(false)} />
    </>
  );
}
