"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { createTierlist } from "@/lib/actions";
import { useSession } from "@/lib/auth-client";
import { SignInModal } from "./auth/SignInModal";
import { Modal } from "./ui/Modal";
import { Button, buttonClasses } from "./ui/Button";
import { Label, Input, Textarea } from "./ui/Field";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(buttonClasses("primary"))}>
      {pending ? "Création…" : "Créer la tier list"}
    </button>
  );
}

export function CreateTierlistButton({
  variant = "primary",
}: {
  variant?: "primary" | "secondary";
}) {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  function onClick() {
    if (data?.user) setOpen(true);
    else setSignInOpen(true);
  }

  return (
    <>
      <Button variant={variant} onClick={onClick}>
        <Plus size={16} />
        Nouvelle tier list
      </Button>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle tier list">
        <form action={createTierlist} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              name="title"
              required
              autoFocus
              placeholder="ex. Sauces piquantes, Cocktails, Fromages…"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="De quoi parle cette tier list ?"
            />
          </div>
          <p className="text-xs text-muted">
            On créera 5 tiers par défaut (S, A, B, C, D). Tu pourras tout
            renommer et ajouter tes éléments ensuite.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <SubmitButton />
          </div>
        </form>
      </Modal>
    </>
  );
}
