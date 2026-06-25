import { headers } from "next/headers";
import { getAllTierlists } from "@/lib/data";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { CreateTierlistButton } from "@/components/CreateTierlistButton";
import { TierlistCard } from "@/components/TierlistCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [lists, session] = await Promise.all([
    getAllTierlists(),
    auth.api.getSession({ headers: await headers() }),
  ]);
  const currentUserId = session?.user?.id ?? null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:py-16">
        <section className="relative mb-14 border-b border-line pb-12">
          {/* oversized faded serif watermark */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-4 -top-20 select-none font-serif text-[18rem] italic leading-none text-terracotta-light/15 sm:text-[22rem]"
          >
            T
          </span>
          <div className="relative max-w-2xl">
            <p className="kicker mb-5 text-terracotta">Tier lists collaboratives</p>
            <h1 className="display text-5xl text-ink sm:text-[64px]">
              Classe <em>n&apos;importe quoi</em>, du{" "}
              <span className="text-terracotta">meilleur</span> au{" "}
              <em>pire</em>.
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink-soft">
              Fromages, sauces piquantes, cocktails… Crée une tier list, ajoute
              des photos, et glisse chaque élément à sa place.
            </p>
            <div className="mt-8">
              <CreateTierlistButton />
            </div>
          </div>
        </section>

        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-line bg-surface/40 py-24 text-center">
            <p className="display text-3xl text-ink">
              Aucune tier list <em>pour l&apos;instant</em>.
            </p>
            <p className="text-sm text-muted">Crée la première — ça prend dix secondes.</p>
            <div className="mt-2">
              <CreateTierlistButton variant="secondary" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <TierlistCard key={list.id} list={list} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
          <span className="kicker">Disponible · open source</span>
          <span className="text-[11px] text-muted">Remake de OpenTierBoy</span>
        </div>
      </footer>
    </>
  );
}
