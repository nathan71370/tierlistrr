import Link from "next/link";
import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sage transition-transform group-hover:scale-125" />
          <span className="display text-[28px] italic leading-none text-ink">
            tierlistrr
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
