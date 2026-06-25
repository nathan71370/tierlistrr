"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { ArrowLeft, Plus, Settings2, Check, Loader2 } from "lucide-react";
import { saveLayout, addTier } from "@/lib/actions";
import { groupItems, toPlacements, type Groups } from "@/lib/board";
import { POOL_ID } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { ItemThumb } from "./ItemTile";
import { AddItemModal } from "./AddItemModal";
import { EditTierModal } from "./EditTierModal";
import { ItemModal } from "./ItemModal";
import { EditTierlistModal } from "./EditTierlistModal";
import { cn } from "@/lib/utils";
import type { Item, Tier, Tierlist } from "@/db/schema";

export function TierBoard({
  tierlist,
  initialTiers,
  initialItems,
}: {
  tierlist: Tierlist;
  initialTiers: Tier[];
  initialItems: Item[];
}) {
  const router = useRouter();
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [groups, setGroups] = useState<Groups>(() =>
    groupItems(initialItems, initialTiers.map((t) => t.id)),
  );
  const [saving, startSaving] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editTier, setEditTier] = useState<Tier | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [addingTier, startAddTier] = useTransition();

  // Re-sync local state whenever the server sends fresh data (after a refresh).
  const sig = useMemo(
    () =>
      JSON.stringify([
        initialTiers.map((t) => [t.id, t.label, t.color, t.position]),
        initialItems.map((i) => [i.id, i.tierId, i.position, i.name, i.imagePath]),
      ]),
    [initialTiers, initialItems],
  );
  const [prevSig, setPrevSig] = useState(sig);
  if (sig !== prevSig) {
    setPrevSig(sig);
    setTiers(initialTiers);
    setGroups(groupItems(initialItems, initialTiers.map((t) => t.id)));
  }

  const refresh = () => router.refresh();

  function onDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const next: Groups = { ...groups };
    const sourceList = Array.from(next[source.droppableId] ?? []);
    const [moved] = sourceList.splice(source.index, 1);
    if (!moved) return;

    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, moved);
      next[source.droppableId] = sourceList;
    } else {
      const destList = Array.from(next[destination.droppableId] ?? []);
      destList.splice(destination.index, 0, moved);
      next[source.droppableId] = sourceList;
      next[destination.droppableId] = destList;
    }

    setGroups(next);
    const placements = toPlacements(next);
    startSaving(async () => {
      await saveLayout(tierlist.id, placements);
    });
  }

  const pool = groups[POOL_ID] ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
      {/* Header */}
      <div className="mb-7">
        <Link
          href="/"
          className="kicker inline-flex items-center gap-1.5 hover:text-ink"
        >
          <ArrowLeft size={13} /> Toutes les listes
        </Link>
        <div className="mt-4 flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="display text-4xl text-ink sm:text-5xl">
              {tierlist.title}
            </h1>
            {tierlist.description ? (
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                {tierlist.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "kicker inline-flex items-center gap-1.5 transition-opacity",
                saving ? "opacity-100" : "opacity-0",
              )}
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Enregistrement
                </>
              ) : (
                <>
                  <Check size={12} /> Enregistré
                </>
              )}
            </span>
            <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
              <Settings2 size={15} />
              Réglages
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      {/* Tiers */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex border-b border-line last:border-b-0">
              <button
                onClick={() => setEditTier(tier)}
                className="flex w-[68px] shrink-0 items-center justify-center px-2 py-3 text-center transition hover:brightness-105 sm:w-24"
                style={{ backgroundColor: tier.color }}
                title="Modifier ce tier"
              >
                <span className="display break-words text-3xl leading-none text-white drop-shadow-sm">
                  {tier.label}
                </span>
              </button>
              <Droppable droppableId={tier.id} direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex min-h-[100px] flex-1 flex-wrap content-start gap-2.5 p-2.5 transition-colors",
                      snapshot.isDraggingOver ? "bg-cream-deep" : "bg-surface",
                    )}
                  >
                    {(groups[tier.id] ?? []).map((item, idx) => (
                      <DraggableItem
                        key={item.id}
                        item={item}
                        index={idx}
                        onClick={() => setEditItem(item)}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={addingTier}
            onClick={() =>
              startAddTier(async () => {
                await addTier(tierlist.id);
                refresh();
              })
            }
          >
            <Plus size={14} />
            Ajouter un tier
          </Button>
        </div>

        {/* Pool */}
        <div className="mt-9">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="kicker">À classer</h2>
            <span className="text-[11px] text-muted">{pool.length} en attente</span>
          </div>
          <Droppable droppableId={POOL_ID} direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex min-h-[116px] flex-wrap content-start gap-2.5 rounded-[var(--radius-lg)] border border-dashed p-3.5 transition-colors",
                  snapshot.isDraggingOver
                    ? "border-terracotta bg-cream-deep"
                    : "border-line bg-surface/50",
                )}
              >
                {pool.length === 0 && !snapshot.isDraggingOver ? (
                  <div className="flex w-full items-center justify-center py-6 text-center">
                    <span className="text-sm text-muted">
                      Tout est classé — ou ajoute de nouveaux éléments.
                    </span>
                  </div>
                ) : null}
                {pool.map((item, idx) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    index={idx}
                    onClick={() => setEditItem(item)}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Modals */}
      <AddItemModal
        tierlistId={tierlist.id}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refresh}
      />
      <EditTierlistModal
        tierlist={tierlist}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={refresh}
      />
      {editTier ? (
        <EditTierModal
          tier={editTier}
          open
          onClose={() => setEditTier(null)}
          onSaved={refresh}
        />
      ) : null}
      {editItem ? (
        <ItemModal
          item={editItem}
          open
          onClose={() => setEditItem(null)}
          onSaved={refresh}
        />
      ) : null}
    </main>
  );
}

function DraggableItem({
  item,
  index,
  onClick,
}: {
  item: Item;
  index: number;
  onClick: () => void;
}) {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "group flex w-[72px] cursor-grab flex-col items-center active:cursor-grabbing",
            snapshot.isDragging && "z-50",
          )}
        >
          <div
            className={cn(
              "overflow-hidden rounded-[var(--radius-sm)] shadow-[var(--shadow-card)] ring-1 ring-line/70 transition",
              "group-hover:ring-ink/30 group-hover:shadow-[var(--shadow-pop)]",
              snapshot.isDragging && "ring-terracotta shadow-[var(--shadow-pop)] rotate-2",
            )}
          >
            <ItemThumb item={item} />
          </div>
          <span className="mt-1.5 w-full truncate text-center text-[11px] leading-tight text-ink-soft">
            {item.name}
          </span>
        </div>
      )}
    </Draggable>
  );
}
