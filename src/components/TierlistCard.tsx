"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Trash2 } from "lucide-react";
import { deleteTierlist } from "@/lib/actions";
import type { TierlistSummary } from "@/lib/data";

export function TierlistCard({
  list,
  currentUserId,
}: {
  list: TierlistSummary;
  currentUserId: string | null;
}) {
  const t = useTranslations("home");
  const tcard = useTranslations("card");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const isOwner = Boolean(currentUserId && list.ownerId === currentUserId);

  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
      {isOwner ? (
        <button
          onClick={() => {
            if (confirm(tcard("deleteConfirm", { title: list.title }))) {
              start(() => {
                deleteTierlist(list.id);
              });
            }
          }}
          disabled={pending}
          aria-label={tc("delete")}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-surface/90 text-muted opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 hover:bg-terracotta hover:text-white"
        >
          <Trash2 size={15} />
        </button>
      ) : null}

      <Link href={`/t/${list.slug}`} className="flex flex-1 flex-col">
        <div className="flex h-28 items-center gap-2 overflow-hidden bg-cream-deep px-4">
          {list.thumbs.length > 0 ? (
            list.thumbs.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] object-cover shadow-[var(--shadow-card)]"
              />
            ))
          ) : (
            <span className="kicker">{t("emptyThumbs")}</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="display text-2xl text-ink">{list.title}</h3>
          {list.ownerLabel ? (
            <p className="kicker">{t("by", { name: list.ownerLabel })}</p>
          ) : null}
          {list.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
              {list.description}
            </p>
          ) : null}
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="kicker">{t("items", { count: list.itemCount })}</span>
            <span className="text-[11px] text-muted">{fmt.format(list.updatedAt)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
