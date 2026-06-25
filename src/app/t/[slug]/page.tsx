import { notFound } from "next/navigation";
import { getTierlistBySlug } from "@/lib/data";
import { isAiConfigured } from "@/lib/ai";
import { SiteHeader } from "@/components/SiteHeader";
import { TierBoard } from "@/components/board/TierBoard";

export const dynamic = "force-dynamic";

export default async function TierlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = await getTierlistBySlug(slug);
  if (!board) notFound();

  return (
    <>
      <SiteHeader />
      <TierBoard
        tierlist={board.tierlist}
        initialTiers={board.tiers}
        initialItems={board.items}
        aiEnabled={isAiConfigured()}
      />
    </>
  );
}
