"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  ArrowLeft,
  Plus,
  Settings2,
  Check,
  Loader2,
  Sparkles,
  Share2,
  Eye,
  LogIn,
} from "lucide-react";
import { savePlacements, addTier } from "@/lib/actions";
import { groupByPlacement, toPlacements, type Groups, type PlacementMap } from "@/lib/board";
import { POOL_ID } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { SignInModal } from "@/components/auth/SignInModal";
import { ItemThumb } from "./ItemTile";
import { AddItemModal } from "./AddItemModal";
import { GenerateItemsModal } from "./GenerateItemsModal";
import { EditTierModal } from "./EditTierModal";
import { ItemModal } from "./ItemModal";
import { EditTierlistModal } from "./EditTierlistModal";
import { cn } from "@/lib/utils";
import type { Item, Tier, Tierlist } from "@/db/schema";
import type { Participant } from "@/lib/data";

export function TierBoard({
  tierlist,
  ownerLabel,
  initialTiers,
  initialItems,
  initialPlacements,
  participants,
  viewedUserId,
  currentUserId,
  canEdit,
  isOwner,
  isAuthed,
  aiEnabled,
}: {
  tierlist: Tierlist;
  ownerLabel: string | null;
  initialTiers: Tier[];
  initialItems: Item[];
  initialPlacements: PlacementMap;
  participants: Participant[];
  viewedUserId: string | null;
  currentUserId: string | null;
  canEdit: boolean;
  isOwner: boolean;
  isAuthed: boolean;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [groups, setGroups] = useState<Groups>(() =>
    groupByPlacement(initialItems, initialTiers.map((t) => t.id), initialPlacements),
  );
  const [saving, startSaving] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [editTier, setEditTier] = useState<Tier | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [addingTier, startAddTier] = useTransition();
  const [copied, setCopied] = useState(false);

  // Re-sync local board state whenever the server sends fresh data.
  const sig = useMemo(
    () =>
      JSON.stringify([
        viewedUserId,
        initialTiers.map((t) => [t.id, t.label, t.color, t.position]),
        initialItems.map((i) => [i.id, i.position, i.name, i.imagePath, i.imageStatus]),
        initialPlacements,
      ]),
    [viewedUserId, initialTiers, initialItems, initialPlacements],
  );
  const [prevSig, setPrevSig] = useState(sig);
  if (sig !== prevSig) {
    setPrevSig(sig);
    setTiers(initialTiers);
    setGroups(groupByPlacement(initialItems, initialTiers.map((t) => t.id), initialPlacements));
  }

  const refresh = () => router.refresh();

  const pendingImages = useMemo(
    () => Object.values(groups).flat().filter((it) => it.imageStatus === "pending").length,
    [groups],
  );
  useEffect(() => {
    if (pendingImages === 0) return;
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [pendingImages, router]);

  function onDragEnd(result: DropResult) {
    if (!canEdit) return;
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
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
      await savePlacements(tierlist.id, placements);
    });
  }

  function selectParticipant(userId: string) {
    router.push(`/t/${tierlist.slug}?u=${userId}`);
  }

  function share() {
    const url = `${window.location.origin}/t/${tierlist.slug}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const pool = groups[POOL_ID] ?? [];
  const viewedLabel = participants.find((p) => p.userId === viewedUserId)?.label;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
      {/* Header */}
      <div className="mb-5">
        <Link href="/" className="kicker inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft size={13} /> Toutes les listes
        </Link>
        <div className="mt-4 flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="display text-4xl text-ink sm:text-5xl">{tierlist.title}</h1>
            {ownerLabel ? (
              <p className="kicker mt-2">par {ownerLabel}</p>
            ) : null}
            {tierlist.description ? (
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                {tierlist.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pendingImages > 0 ? (
              <span className="kicker inline-flex items-center gap-1.5 text-terracotta">
                <Loader2 size={12} className="animate-spin" />
                {pendingImages} image{pendingImages > 1 ? "s" : ""}
              </span>
            ) : saving ? (
              <span className="kicker inline-flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" /> Enregistrement
              </span>
            ) : null}
            <Button variant="secondary" size="sm" onClick={share}>
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              {copied ? "Copié !" : "Partager"}
            </Button>
            {isOwner ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(true)}>
                  <Settings2 size={15} />
                  Réglages
                </Button>
                {aiEnabled ? (
                  <Button variant="secondary" size="sm" onClick={() => setGenOpen(true)}>
                    <Sparkles size={15} />
                    Générer
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus size={16} />
                  Ajouter
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Participant selector */}
      {participants.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="kicker mr-1">Classement de</span>
          {participants.map((p) => (
            <button
              key={p.userId}
              onClick={() => selectParticipant(p.userId)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                p.userId === viewedUserId
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-surface text-ink-soft hover:border-ink/30",
              )}
            >
              {p.isYou ? "Toi" : p.label}
              {p.isOwner ? <span className="opacity-60">· créateur</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {/* Edit / read-only state banner */}
      {canEdit ? null : isAuthed ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-cream-deep px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
            <Eye size={15} /> Tu regardes le classement de{" "}
            <strong>{viewedLabel ?? "ce participant"}</strong> — lecture seule.
          </span>
          {currentUserId ? (
            <Button size="sm" onClick={() => selectParticipant(currentUserId)}>
              Faire mon classement
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-cream-deep px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
            <Eye size={15} /> Lecture seule. Connecte-toi pour faire ton propre
            classement.
          </span>
          <Button size="sm" onClick={() => setSignInOpen(true)}>
            <LogIn size={15} /> Se connecter
          </Button>
        </div>
      )}

      {/* Tiers */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex border-b border-line last:border-b-0">
              <button
                onClick={() => isOwner && setEditTier(tier)}
                className={cn(
                  "flex w-[68px] shrink-0 items-center justify-center px-2 py-3 text-center transition sm:w-24",
                  isOwner ? "hover:brightness-105" : "cursor-default",
                )}
                style={{ backgroundColor: tier.color }}
                title={isOwner ? "Modifier ce tier" : undefined}
              >
                <span className="display break-words text-3xl leading-none text-white drop-shadow-sm">
                  {tier.label}
                </span>
              </button>
              <Droppable droppableId={tier.id} direction="horizontal" isDropDisabled={!canEdit}>
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
                        canEdit={canEdit}
                        onClick={isOwner ? () => setEditItem(item) : undefined}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>

        {isOwner ? (
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
        ) : null}

        {/* Pool */}
        <div className="mt-9">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="kicker">À classer</h2>
            <span className="text-[11px] text-muted">{pool.length} en attente</span>
          </div>
          <Droppable droppableId={POOL_ID} direction="horizontal" isDropDisabled={!canEdit}>
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
                      {canEdit
                        ? "Tout est classé — beau travail."
                        : "Aucun élément à classer."}
                    </span>
                  </div>
                ) : null}
                {pool.map((item, idx) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    index={idx}
                    canEdit={canEdit}
                    onClick={isOwner ? () => setEditItem(item) : undefined}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Modals */}
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      {isOwner ? (
        <>
          <AddItemModal
            tierlistId={tierlist.id}
            aiEnabled={aiEnabled}
            open={addOpen}
            onClose={() => setAddOpen(false)}
            onSaved={refresh}
          />
          {aiEnabled ? (
            <GenerateItemsModal
              tierlistId={tierlist.id}
              defaultTopic={tierlist.title}
              open={genOpen}
              onClose={() => setGenOpen(false)}
              onSaved={refresh}
            />
          ) : null}
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
              aiEnabled={aiEnabled}
              open
              onClose={() => setEditItem(null)}
              onSaved={refresh}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
}

function DraggableItem({
  item,
  index,
  canEdit,
  onClick,
}: {
  item: Item;
  index: number;
  canEdit: boolean;
  onClick?: () => void;
}) {
  return (
    <Draggable draggableId={item.id} index={index} isDragDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "group flex w-[72px] flex-col items-center",
            canEdit ? "cursor-grab active:cursor-grabbing" : onClick ? "cursor-pointer" : "cursor-default",
            snapshot.isDragging && "z-50",
          )}
        >
          <div
            className={cn(
              "overflow-hidden rounded-[var(--radius-sm)] shadow-[var(--shadow-card)] ring-1 ring-line/70 transition",
              (canEdit || onClick) && "group-hover:ring-ink/30 group-hover:shadow-[var(--shadow-pop)]",
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
