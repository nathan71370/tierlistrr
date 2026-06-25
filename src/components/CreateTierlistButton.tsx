"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { createTierlist } from "@/lib/actions";
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
  variant?: "primary" | "outline";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus size={16} />
        Nouvelle tier list
      </Button>

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
