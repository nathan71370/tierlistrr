import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="display text-2xl font-bold tracking-tight text-ink">
            tierlistrr
          </span>
          <span className="h-2 w-2 rounded-full bg-terracotta transition-transform group-hover:scale-125" />
        </Link>
        <span className="label hidden sm:block">Range tout. Vraiment tout.</span>
      </div>
    </header>
  );
}
