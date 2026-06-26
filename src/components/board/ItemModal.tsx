"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Sparkles } from "lucide-react";
import { renameItem, deleteItem, generateItemImage } from "@/lib/actions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";
import { ItemThumb } from "./ItemTile";
import type { Item } from "@/db/schema";

export function ItemModal({
  item,
  aiEnabled,
  open,
  onClose,
  onSaved,
}: {
  item: Item;
  aiEnabled: boolean;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("itemModal");
  const tc = useTranslations("common");
  const [name, setName] = useState(item.name);
  const [pending, start] = useTransition();

  function regenerate() {
    start(async () => {
      await generateItemImage(item.id);
      onSaved();
      onClose();
    });
  }

  function save() {
    start(async () => {
      await renameItem(item.id, name);
      onSaved();
      onClose();
    });
  }

  function remove() {
    if (!confirm(t("deleteConfirm", { name: item.name }))) return;
    start(async () => {
      await deleteItem(item.id);
      onSaved();
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={t("title")}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <ItemThumb item={item} className="rounded-[var(--radius-sm)] ring-1 ring-line" />
          <div className="flex-1">
            <Label htmlFor="item-rename">{t("nameLabel")}</Label>
            <Input
              id="item-rename"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
            {aiEnabled ? (
              <button
                type="button"
                onClick={regenerate}
                disabled={pending}
                className="kicker mt-2 inline-flex items-center gap-1.5 text-terracotta hover:text-terracotta-dark disabled:opacity-50"
              >
                <Sparkles size={12} />
                {item.imageStatus === "pending" ? t("regenerating") : t("regen")}
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button type="button" variant="danger" onClick={remove} disabled={pending}>
            <Trash2 size={15} />
            {tc("delete")}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="button" onClick={save} disabled={pending || !name.trim()}>
              {pending ? "…" : tc("save")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
