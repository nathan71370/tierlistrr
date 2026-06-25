"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTierlist } from "@/lib/actions";
import type { TierlistSummary } from "@/lib/data";

const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function TierlistCard({ list }: { list: TierlistSummary }) {
  const [pending, start] = useTransition();

  return (
    <div className="group relative flex flex-col border border-line bg-surface rounded-[3px] transition-colors hover:border-ink/30">
      <button
        onClick={() => {
          if (confirm(`Supprimer « ${list.title} » ? Cette action est définitive.`)) {
            start(() => {
              deleteTierlist(list.id);
            });
          }
        }}
        disabled={pending}
        aria-label="Supprimer"
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-[3px] bg-surface/80 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-terracotta hover:text-white"
      >
        <Trash2 size={15} />
      </button>

      <Link href={`/t/${list.slug}`} className="flex flex-1 flex-col">
        <div className="flex h-28 items-center gap-1 overflow-hidden border-b border-line bg-beige-soft px-4">
          {list.thumbs.length > 0 ? (
            list.thumbs.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="h-16 w-16 shrink-0 rounded-[2px] object-cover ring-1 ring-line"
              />
            ))
          ) : (
            <span className="label">Vide — ajoute des éléments</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="display text-lg font-bold leading-snug text-ink">
            {list.title}
          </h3>
          {list.description ? (
            <p className="line-clamp-2 text-sm text-ink-soft">{list.description}</p>
          ) : null}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="label">
              {list.itemCount} élément{list.itemCount > 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-muted">{fmt.format(list.updatedAt)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
