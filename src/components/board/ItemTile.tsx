"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { initials } from "@/lib/board";
import type { Item } from "@/db/schema";
import { cn } from "@/lib/utils";

function Initials({
  name,
  className,
  children,
}: {
  name: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative grid h-[72px] w-[72px] place-items-center bg-cream-deep text-ink-soft",
        className,
      )}
    >
      <span className="display text-2xl italic">{initials(name)}</span>
      {children}
    </div>
  );
}

export function ItemThumb({
  item,
  className,
}: {
  item: Item;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!item.imagePath || failed) {
    const pending = item.imageStatus === "pending";
    return (
      <Initials name={item.name} className={cn(pending && "animate-pulse", className)}>
        {pending ? (
          <span className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-surface/90 text-terracotta shadow-sm">
            <Loader2 size={12} className="animate-spin" />
          </span>
        ) : null}
      </Initials>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.imagePath}
      alt={item.name}
      draggable={false}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("h-[72px] w-[72px] bg-cream-deep object-cover", className)}
    />
  );
}
