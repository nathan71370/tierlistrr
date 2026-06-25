"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Sparkles, Upload } from "lucide-react";
import { addItem } from "@/lib/actions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

type Mode = "upload" | "ai" | "none";

export function AddItemModal({
  tierlistId,
  aiEnabled,
  open,
  onClose,
  onSaved,
}: {
  tierlistId: string;
  aiEnabled: boolean;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<Mode>(aiEnabled ? "ai" : "upload");
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
    if (mode === "ai") fd.set("generateImage", "1");
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

  const modes: { key: Mode; label: string; icon: React.ReactNode }[] = [
    ...(aiEnabled
      ? [{ key: "ai" as Mode, label: "Générer (IA)", icon: <Sparkles size={14} /> }]
      : []),
    { key: "upload", label: "Uploader", icon: <Upload size={14} /> },
    { key: "none", label: "Sans image", icon: null },
  ];

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
          <Label>Image</Label>
          <div className="mb-3 flex gap-2">
            {modes.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={cn(
                  "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border text-[13px] font-semibold transition-colors",
                  mode === m.key
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-line bg-surface text-ink-soft hover:border-ink/30",
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {mode === "ai" ? (
            <p className="rounded-[var(--radius-sm)] bg-cream-deep px-3 py-2.5 text-sm text-ink-soft">
              L&apos;image sera générée en arrière-plan d&apos;après le nom et le
              thème de la liste. L&apos;élément est utilisable immédiatement.
            </p>
          ) : null}

          {mode === "upload" ? (
            <label className="flex cursor-pointer items-center gap-4 rounded-[var(--radius-md)] border border-dashed border-line bg-paper px-4 py-3 hover:border-terracotta">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-16 w-16 rounded-[var(--radius-sm)] object-cover" />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-[var(--radius-sm)] bg-cream-deep text-muted">
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
          ) : null}
        </div>

        {error ? <p className="text-sm text-terracotta">{error}</p> : null}

        <div className="flex items-center justify-between pt-1">
          <span className="kicker">
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
