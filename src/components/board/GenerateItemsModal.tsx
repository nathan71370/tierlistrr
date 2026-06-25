"use client";

import { useState, useTransition } from "react";
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "La génération a échoué.");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Générer avec l'IA">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-ink-soft">
          L&apos;IA propose une liste d&apos;éléments pour ton thème et génère une
          image pour chacun. Les images sont téléchargées et enregistrées, donc
          la génération peut prendre quelques secondes. Tout arrive dans « à
          classer ».
        </p>

        <div>
          <Label htmlFor="ai-topic">Thème</Label>
          <Input
            id="ai-topic"
            value={topic}
            autoFocus
            onChange={(e) => setTopic(e.target.value)}
            placeholder="ex. Cocktails de l'été, Fromages français…"
          />
        </div>

        <div>
          <Label>Nombre d&apos;éléments</Label>
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
          <span className="text-[11px] text-muted">Images via Pollinations · enregistrées sur disque</span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Annuler
            </Button>
            <Button type="button" onClick={run} disabled={pending || !topic.trim()}>
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Génération…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Générer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
