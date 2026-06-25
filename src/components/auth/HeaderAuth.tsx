"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { SignInModal } from "./SignInModal";
import { ProfileModal } from "./ProfileModal";

export function HeaderAuth() {
  const { data, isPending } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  if (isPending) {
    return <div className="h-9 w-28 animate-pulse rounded-full bg-cream-deep" />;
  }

  if (data?.user) {
    const label = data.user.name?.trim() || data.user.email.split("@")[0];
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setProfileOpen(true)}
          title="Modifier ton nom"
          className="group inline-flex max-w-[100px] items-center gap-1.5 text-sm text-ink-soft hover:text-ink sm:max-w-[200px]"
        >
          <span className="truncate">{label}</span>
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
          Déconnexion
        </Button>
        <ProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          initialName={data.user.name ?? ""}
          email={data.user.email}
        />
      </div>
    );
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Se connecter
      </Button>
      <SignInModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
