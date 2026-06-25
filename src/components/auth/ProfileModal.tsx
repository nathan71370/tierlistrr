"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";

export function ProfileModal({
  open,
  onClose,
  initialName,
  email,
}: {
  open: boolean;
  onClose: () => void;
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const { error } = await authClient.updateUser({ name: name.trim() });
      if (error) {
        setError(error.message ?? "Échec de la mise à jour.");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Ton profil">
      <form onSubmit={save} className="space-y-4">
        <p className="text-sm text-ink-soft">
          Connecté en tant que <strong>{email}</strong>.
        </p>
        <div>
          <Label htmlFor="profile-name">Nom affiché</Label>
          <Input
            id="profile-name"
            value={name}
            autoFocus
            placeholder="ex. Nathan"
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-1.5 text-[11px] text-muted">
            C&apos;est ce nom qui apparaît sur tes classements et tes listes.
          </p>
        </div>
        {error ? <p className="text-sm text-terracotta">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? "…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
