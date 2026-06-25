"use client";

import { useState } from "react";
import { initials } from "@/lib/board";
import type { Item } from "@/db/schema";
import { cn } from "@/lib/utils";

function Initials({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid h-[72px] w-[72px] place-items-center bg-cream-deep text-ink-soft",
        className,
      )}
    >
      <span className="display text-2xl italic">{initials(name)}</span>
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
    return <Initials name={item.name} className={className} />;
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
