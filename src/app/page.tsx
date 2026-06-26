import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getAllTierlists } from "@/lib/data";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { CreateTierlistButton } from "@/components/CreateTierlistButton";
import { TierlistCard } from "@/components/TierlistCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [lists, session, t] = await Promise.all([
    getAllTierlists(),
    auth.api.getSession({ headers: await headers() }),
    getTranslations("home"),
  ]);
  const currentUserId = session?.user?.id ?? null;

  const richTags = {
    em: (c: React.ReactNode) => <em>{c}</em>,
    hot: (c: React.ReactNode) => <span className="text-terracotta">{c}</span>,
  };

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
            <p className="kicker mb-5 text-terracotta">{t("kicker")}</p>
            <h1 className="display text-5xl text-ink sm:text-[64px]">
              {t.rich("heroTitle", richTags)}
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink-soft">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8">
              <CreateTierlistButton />
            </div>
          </div>
        </section>

        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-line bg-surface/40 py-24 text-center">
            <p className="display text-3xl text-ink">{t.rich("emptyTitle", richTags)}</p>
            <p className="text-sm text-muted">{t("emptySubtitle")}</p>
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
          <span className="kicker">{t("footerStatus")}</span>
          <span className="text-[11px] text-muted">{t("footerTagline")}</span>
        </div>
      </footer>
    </>
  );
}
