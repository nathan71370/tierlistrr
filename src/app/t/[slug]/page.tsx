import { notFound } from "next/navigation";
import { getTierlistView } from "@/lib/data";
import { getAuthState } from "@/lib/viewer";
import { isAiConfigured } from "@/lib/ai";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { TierBoard } from "@/components/board/TierBoard";

export const dynamic = "force-dynamic";

export default async function TierlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const requestedUserId = typeof sp.u === "string" ? sp.u : null;

  // Anyone may read; only a viewer with access gets an id here, and with it
  // the right to rank and edit.
  const currentUserId = (await getAuthState()).viewer?.id ?? null;

  const view = await getTierlistView(slug, { currentUserId, requestedUserId });
  if (!view) notFound();

  return (
    <AuthBoundary>
      <SiteHeader />
      <TierBoard
        tierlist={view.tierlist}
        ownerLabel={view.ownerLabel}
        initialTiers={view.tiers}
        initialItems={view.items}
        initialPlacements={view.placements}
        participants={view.participants}
        viewedUserId={view.viewedUserId}
        currentUserId={currentUserId}
        canEdit={view.canEdit}
        isOwner={view.isOwner}
        isAuthed={view.isAuthed}
        isConsensus={view.isConsensus}
        consensusAvailable={view.consensusAvailable}
        aiEnabled={isAiConfigured()}
      />
    </AuthBoundary>
  );
}
