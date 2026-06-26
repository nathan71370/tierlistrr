"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2 } from "lucide-react";
import { generateItems } from "@/lib/actions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

const COUNTS = [8, 12, 16];

export function GenerateItemsModal({
  tierlistId,
  defaultTopic,
  open,
  onClose,
  onSaved,
}: {
  tierlistId: string;
  defaultTopic: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("generate");
  const tc = useTranslations("common");
  const [topic, setTopic] = useState(defaultTopic);
  const [count, setCount] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run() {
    setError(null);
    start(async () => {
      try {
        await generateItems(tierlistId, topic, count);
        onSaved();
        onClose();
      } catch {
        setError(t("error"));
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={t("title")}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-ink-soft">
          {t.rich("intro", { b: (c) => <strong>{c}</strong> })}
        </p>

        <div>
          <Label htmlFor="ai-topic">{t("topicLabel")}</Label>
          <Input
            id="ai-topic"
            value={topic}
            autoFocus
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("topicPlaceholder")}
          />
        </div>

        <div>
          <Label>{t("countLabel")}</Label>
          <div className="flex gap-2">
            {COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCount(c)}
                className={cn(
                  "h-10 flex-1 rounded-full border text-sm font-semibold transition-colors",
                  count === c
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-line bg-surface text-ink-soft hover:border-ink/30",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="rounded-[var(--radius-sm)] bg-terracotta/10 px-3 py-2 text-sm text-terracotta-dark">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted">{t("note")}</span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {tc("cancel")}
            </Button>
            <Button type="button" onClick={run} disabled={pending || !topic.trim()}>
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {t("generating")}
                </>
              ) : (
                <>
                  <Sparkles size={16} /> {t("generate")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
