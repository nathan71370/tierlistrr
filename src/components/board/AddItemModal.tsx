"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { addItem } from "@/lib/actions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";

export function AddItemModal({
  tierlistId,
  open,
  onClose,
  onSaved,
}: {
  tierlistId: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function reset() {
    formRef.current?.reset();
    setPreview(null);
    nameRef.current?.focus();
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("tierlistId", tierlistId);
    start(async () => {
      try {
        await addItem(fd);
        setAdded((n) => n + 1);
        reset();
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setAdded(0);
        onClose();
      }}
      title="Ajouter un élément"
    >
      <form ref={formRef} onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="item-name">Nom</Label>
          <Input
            id="item-name"
            name="name"
            ref={nameRef}
            required
            autoFocus
            placeholder="ex. Moscow Mule"
          />
        </div>

        <div>
          <Label>Photo (optionnel)</Label>
          <label className="flex cursor-pointer items-center gap-4 border border-dashed border-line bg-surface px-4 py-3 hover:border-terracotta">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-16 w-16 rounded-[2px] object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center bg-beige text-muted">
                <ImagePlus size={22} />
              </span>
            )}
            <span className="text-sm text-ink-soft">
              {preview ? "Changer l'image" : "Choisir une image (PNG, JPG, WebP…)"}
            </span>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
          </label>
        </div>

        {error ? <p className="text-sm text-terracotta">{error}</p> : null}

        <div className="flex items-center justify-between pt-1">
          <span className="label">
            {added > 0 ? `${added} ajouté${added > 1 ? "s" : ""}` : "Astuce : enchaîne les ajouts"}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAdded(0);
                onClose();
              }}
            >
              Fermer
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Ajout…" : "Ajouter"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
