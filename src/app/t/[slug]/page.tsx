import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTierlistView } from "@/lib/data";
import { auth } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai";
import { SiteHeader } from "@/components/SiteHeader";
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

  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id ?? null;

  const view = await getTierlistView(slug, { currentUserId, requestedUserId });
  if (!view) notFound();

  return (
    <>
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
    </>
  );
}
