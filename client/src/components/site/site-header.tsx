import Link from "next/link";
import type { Niche } from "@/lib/types";
import { SITE_NAME, nicheUrl } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({ niches = [] }: { niches?: Niche[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
            1S
          </span>
          <span className="text-lg font-semibold tracking-tight text-fg">
            {SITE_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {niches.slice(0, 5).map((niche) => (
            <a
              key={niche.id}
              href={nicheUrl(niche.slug)}
              className="text-sm font-medium text-fg-muted transition hover:text-fg"
            >
              {niche.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#bundles"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
          >
            Browse bundles
          </a>
        </div>
      </div>
    </header>
  );
}
