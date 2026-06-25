import { initials } from "@/lib/board";
import type { Item } from "@/db/schema";
import { cn } from "@/lib/utils";

export function ItemThumb({
  item,
  className,
}: {
  item: Item;
  className?: string;
}) {
  if (item.imagePath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.imagePath}
        alt={item.name}
        draggable={false}
        className={cn("h-[72px] w-[72px] object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "grid h-[72px] w-[72px] place-items-center bg-cream-deep text-ink-soft",
        className,
      )}
    >
      <span className="display text-2xl italic">{initials(item.name)}</span>
    </div>
  );
}
