"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { renameTierlist, deleteTierlist } from "@/lib/actions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea } from "@/components/ui/Field";
import type { Tierlist } from "@/db/schema";

export function EditTierlistModal({
  tierlist,
  open,
  onClose,
  onSaved,
}: {
  tierlist: Tierlist;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(tierlist.title);
  const [description, setDescription] = useState(tierlist.description ?? "");
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      await renameTierlist(tierlist.id, title, description);
      onSaved();
      onClose();
    });
  }

  function remove() {
    if (!confirm(`Supprimer « ${tierlist.title} » et tous ses éléments ?`)) return;
    start(async () => {
      await deleteTierlist(tierlist.id);
      router.push("/");
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Réglages de la tier list">
      <div className="space-y-4">
        <div>
          <Label htmlFor="tl-title">Titre</Label>
          <Input
            id="tl-title"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="tl-desc">Description</Label>
          <Textarea
            id="tl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Button type="button" variant="danger" onClick={remove} disabled={pending}>
            <Trash2 size={15} />
            Supprimer la liste
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="button" onClick={save} disabled={pending || !title.trim()}>
              {pending ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
