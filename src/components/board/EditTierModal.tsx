"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateTier, deleteTier } from "@/lib/actions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";
import { TIER_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Tier } from "@/db/schema";

export function EditTierModal({
  tier,
  open,
  onClose,
  onSaved,
}: {
  tier: Tier;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(tier.label);
  const [color, setColor] = useState(tier.color);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      await updateTier(tier.id, label, color);
      onSaved();
      onClose();
    });
  }

  function remove() {
    if (!confirm("Supprimer ce tier ? Ses éléments retournent dans « à classer ».")) return;
    start(async () => {
      await deleteTier(tier.id);
      onSaved();
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Modifier le tier">
      <div className="space-y-5">
        <div>
          <Label htmlFor="tier-label">Libellé</Label>
          <Input
            id="tier-label"
            value={label}
            maxLength={16}
            autoFocus
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div>
          <Label>Couleur</Label>
          <div className="flex flex-wrap gap-2">
            {TIER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={cn(
                  "h-9 w-9 rounded-[var(--radius-sm)] ring-2 ring-offset-2 ring-offset-surface transition",
                  color.toLowerCase() === c.toLowerCase()
                    ? "ring-ink"
                    : "ring-transparent hover:ring-line",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Button type="button" variant="danger" onClick={remove} disabled={pending}>
            <Trash2 size={15} />
            Supprimer
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="button" onClick={save} disabled={pending || !label.trim()}>
              {pending ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
