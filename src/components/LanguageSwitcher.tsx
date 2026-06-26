"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/actions";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(locale: Locale) {
    if (locale === active) return;
    start(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => choose(l)}
          disabled={pending}
          title={localeMeta[l].label}
          aria-label={localeMeta[l].label}
          aria-pressed={l === active}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full text-base leading-none transition",
            l === active ? "bg-cream-deep" : "opacity-45 hover:opacity-100",
          )}
        >
          <span aria-hidden>{localeMeta[l].flag}</span>
        </button>
      ))}
    </div>
  );
}
