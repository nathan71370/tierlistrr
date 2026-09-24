"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { createTierlist } from "@/lib/actions";
import { useAuth } from "./auth/AuthContext";
import { Modal } from "./ui/Modal";
import { Button, buttonClasses } from "./ui/Button";
import { Label, Input, Textarea } from "./ui/Field";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const t = useTranslations("create");
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(buttonClasses("primary"))}>
      {pending ? t("creating") : t("submit")}
    </button>
  );
}

export function CreateTierlistButton({
  variant = "primary",
}: {
  variant?: "primary" | "secondary";
}) {
  const t = useTranslations("create");
  const th = useTranslations("home");
  const tc = useTranslations("common");
  const { status, signIn } = useAuth();
  const [open, setOpen] = useState(false);

  function onClick() {
    if (status === "ok") setOpen(true);
    else signIn();
  }

  return (
    <>
      <Button variant={variant} onClick={onClick}>
        <Plus size={16} />
        {th("newList")}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("title")}>
        <form action={createTierlist} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("titleLabel")}</Label>
            <Input
              id="title"
              name="title"
              required
              autoFocus
              placeholder={t("titlePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="description">{t("descLabel")}</Label>
            <Textarea
              id="description"
              name="description"
              placeholder={t("descPlaceholder")}
            />
          </div>
          <p className="text-xs text-muted">{t("hint")}</p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
            <SubmitButton />
          </div>
        </form>
      </Modal>
    </>
  );
}
