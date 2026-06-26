"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("editList");
  const tc = useTranslations("common");
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
    if (!confirm(t("deleteConfirm", { title: tierlist.title }))) return;
    start(async () => {
      await deleteTierlist(tierlist.id);
      router.push("/");
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={t("title")}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="tl-title">{t("titleLabel")}</Label>
          <Input
            id="tl-title"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="tl-desc">{t("descLabel")}</Label>
          <Textarea
            id="tl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Button type="button" variant="danger" onClick={remove} disabled={pending}>
            <Trash2 size={15} />
            {t("deleteList")}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="button" onClick={save} disabled={pending || !title.trim()}>
              {pending ? "…" : tc("save")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
