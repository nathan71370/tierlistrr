import { getAllTierlists } from "@/lib/data";
import { SiteHeader } from "@/components/SiteHeader";
import { CreateTierlistButton } from "@/components/CreateTierlistButton";
import { TierlistCard } from "@/components/TierlistCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lists = await getAllTierlists();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <section className="mb-10 flex flex-col gap-6 border-b border-line pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="label mb-3">Tier lists collaboratives</p>
            <h1 className="display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
              Classe n&apos;importe quoi,
              <br />
              du <span className="text-terracotta">meilleur</span> au pire.
            </h1>
            <p className="mt-4 text-base text-ink-soft">
              Fromages, sauces piquantes, cocktails… Crée une tier list, ajoute
              des photos, et glisse chaque élément à sa place.
            </p>
          </div>
          <div className="shrink-0">
            <CreateTierlistButton />
          </div>
        </section>

        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 border border-dashed border-line bg-surface/50 py-20 text-center">
            <p className="display text-xl text-ink">Aucune tier list pour l&apos;instant.</p>
            <p className="text-sm text-muted">Crée la première — ça prend dix secondes.</p>
            <CreateTierlistButton variant="outline" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <TierlistCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
          <span className="label">tierlistrr</span>
          <span className="text-[11px] text-muted">
            Open source · remake de OpenTierBoy
          </span>
        </div>
      </footer>
    </>
  );
}
