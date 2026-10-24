import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { NicheSection } from "@/components/site/niche-section";
import { getNiches } from "@/lib/server-api";
import { nicheUrl } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const niches = (await getNiches()) ?? [];
  const list = niches;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} variant="home" />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="cinema-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="cinema-spotlight pointer-events-none absolute inset-0" />
          <div className="cinema-noise pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply dark:mix-blend-screen" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="max-w-2xl">
              <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium tracking-wide text-fg-muted backdrop-blur">
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: niches[0]?.accentColor ?? "var(--accent)",
                  }}
                />
                PRACTICAL LEARNING · ONE-TIME PURCHASE
              </span>
              <h1
                className="animate-fade-up mt-7 text-balance text-4xl font-extrabold tracking-tight text-gradient sm:text-6xl sm:leading-[1.05]"
                style={{ animationDelay: "80ms" }}
              >
                You know the problem. Here&rsquo;s the plan.
              </h1>
              <p
                className="animate-fade-up mt-6 max-w-2xl text-lg text-fg-muted"
                style={{ animationDelay: "160ms" }}
              >
                Focused, practical guides for the problems you need to solve —
                one-time purchase, no fluff.
              </p>
              <div
                className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "240ms" }}
              >
                <a
                  href="#niches"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                >
                  Explore areas
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>

            {niches.length > 0 ? (
              <div className="relative hidden lg:block">
                <div className="grid grid-cols-2 gap-4">
                  {niches.map((niche) => (
                    <a
                      key={niche.id}
                      href={nicheUrl(niche.slug)}
                      className="group flex flex-col rounded-2xl border border-border bg-card/70 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-fg/20 hover:shadow-xl dark:hover:shadow-black/40"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: niche.accentColor }}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                          {niche.name}
                        </span>
                      </span>
                      <span className="mt-3 line-clamp-3 text-sm text-fg-muted">
                        {niche.tagline ?? niche.description ?? ""}
                      </span>
                      <span className="mt-4 text-sm font-semibold text-fg transition group-hover:translate-x-0.5">
                        Explore →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section id="niches">
          <div className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-fg">
                Explore by area
              </h2>
              <p className="mt-2 text-sm text-fg-muted">
                Each area is explained below, with the guides available for that
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
