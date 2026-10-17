import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { NicheSection } from "@/components/site/niche-section";
import { getNiches } from "@/lib/server-api";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const niches = (await getNiches()) ?? [];
  const list = niches;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} variant="home" />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="cinema-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="cinema-spotlight pointer-events-none absolute inset-0" />
          <div className="cinema-noise pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply dark:mix-blend-screen" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent" />

          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <div className="max-w-3xl">
              <span className="animate-fade-up inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tracking-wide text-fg-muted">
                PRACTICAL LEARNING · ONE-TIME PURCHASE
              </span>
              <h1
                className="animate-fade-up mt-7 text-balance text-4xl font-extrabold tracking-tight text-gradient sm:text-6xl sm:leading-[1.05]"
                style={{ animationDelay: "80ms" }}
              >
                Practical learning for the problems that actually matter
              </h1>
              <p
                className="animate-fade-up mt-6 max-w-2xl text-lg text-fg-muted"
                style={{ animationDelay: "160ms" }}
              >
                {SITE_NAME} builds focused bundles around essential problems —
                your money, your business, your habits, your career. No fluff,
                no filler. Each bundle helps you understand what is going on,
                decide what to do, and act. Pick the area that matches your
                situation.
              </p>
              <div
                className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "240ms" }}
              >
                <a
                  href="#niches"
                  className="rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                >
                  Explore areas
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="niches">
          <div className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-fg">
                Explore by area
              </h2>
              <p className="mt-2 text-sm text-fg-muted">
                Each area is explained below, with the bundles available for that
                specific kind of problem.
              </p>
            </div>
          </div>

          <div className="mt-8">
            {list.length === 0 ? (
              <p className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface-muted p-8 text-center text-sm text-fg-muted">
                No areas published yet. Add niches and products from the admin
                dashboard.
              </p>
            ) : (
              list.map((niche, index) => (
                <NicheSection
                  key={niche.id}
                  niche={niche}
                  index={index}
                  reversed={index % 2 === 1}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <SiteFooter niches={niches} />
    </div>
  );
}
