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
                ONE PROBLEM · UNDERSTOOD MORE DEEPLY
              </span>
              <h1
                className="animate-fade-up mt-7 text-balance text-4xl font-extrabold tracking-tight text-gradient sm:text-6xl sm:leading-[1.05]"
                style={{ animationDelay: "80ms" }}
              >
                A deeper understanding of the problems that shape our lives.
              </h1>
              <p
                className="animate-fade-up mt-6 max-w-2xl text-lg text-fg-muted"
                style={{ animationDelay: "160ms" }}
              >
                1section turns real-life problems into deep, practical
                understanding. We look beyond familiar advice to explore why a
                problem happens, so you can think through what it means for you.
              </p>
              <div
                className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "240ms" }}
              >
                <a
                  href="#niches"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                >
                  Explore real-life problems
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
                        {niche.tagline ??
                          niche.description ??
                          `Explore the real-life problems within ${niche.name}.`}
                      </span>
                      <span className="mt-4 text-sm font-semibold text-fg transition group-hover:translate-x-0.5">
                        Explore problems →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="border-y border-border bg-surface-muted/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
                What 1section is here to do
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
                Not another list of things you “should” do.
              </h2>
              <p className="mt-4 text-sm leading-7 text-fg-muted sm:text-base">
                Knowing the advice is not the same as understanding why a
                situation keeps happening. We make space to examine the causes,
                the context, and what they may mean for the choices in front of
                you.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Start with a real problem",
                  text: "Begin with a situation people recognize—not a subject label or a promise.",
                },
                {
                  number: "02",
                  title: "Look beneath the surface",
                  text: "Explore the factors and patterns that can shape why it happens.",
                },
                {
                  number: "03",
                  title: "Make your own sense of it",
                  text: "Build understanding that can inform your decisions, without a one-size-fits-all prescription.",
                },
              ].map((principle) => (
                <div
                  key={principle.number}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <span className="text-xs font-semibold tracking-[0.16em] text-fg-muted">
                    {principle.number}
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-fg">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-fg-muted">
                    {principle.text}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-xs leading-5 text-fg-muted">
              Our guides offer education and perspective—not guaranteed
              outcomes or a substitute for advice tailored to your situation.
            </p>
          </div>
        </section>

        <section id="niches">
          <div className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-fg">
                Start with the situation, not the subject
              </h2>
              <p className="mt-2 text-sm text-fg-muted">
                Explore the real situations behind each subject, then find a
                focused guide when one is available.
              </p>
            </div>
          </div>

          <div className="mt-8">
            {list.length === 0 ? (
              <p className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface-muted p-8 text-center text-sm text-fg-muted">
                No problem areas are published yet.
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
