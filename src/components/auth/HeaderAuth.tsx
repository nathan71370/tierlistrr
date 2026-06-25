"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { SignInModal } from "./SignInModal";

export function HeaderAuth() {
  const { data, isPending } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  if (isPending) {
    return <div className="h-9 w-28 animate-pulse rounded-full bg-cream-deep" />;
  }

  if (data?.user) {
    const label = data.user.name?.trim() || data.user.email;
    return (
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[180px] truncate text-sm text-ink-soft sm:inline">
          {label}
        </span>
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
