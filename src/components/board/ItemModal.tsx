"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { renameItem, deleteItem } from "@/lib/actions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";
import { ItemThumb } from "./ItemTile";
import type { Item } from "@/db/schema";

export function ItemModal({
  item,
  open,
  onClose,
  onSaved,
}: {
  item: Item;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      await renameItem(item.id, name);
      onSaved();
      onClose();
    });
  }

  function remove() {
    if (!confirm(`Supprimer « ${item.name} » ?`)) return;
    start(async () => {
      await deleteItem(item.id);
      onSaved();
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Élément">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <ItemThumb item={item} className="rounded-[var(--radius-sm)] ring-1 ring-line" />
          <div className="flex-1">
            <Label htmlFor="item-rename">Nom</Label>
            <Input
              id="item-rename"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button type="button" variant="danger" onClick={remove} disabled={pending}>
            <Trash2 size={15} />
            Supprimer
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="button" onClick={save} disabled={pending || !name.trim()}>
              {pending ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
