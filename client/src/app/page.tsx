import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { NicheCard } from "@/components/site/niche-card";
import { getNiches } from "@/lib/server-api";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 60;

const steps = [
  {
    title: "Pick your niche",
    body: "Choose the collection that matches what you want to learn or sell.",
  },
  {
    title: "Buy once with Paddle",
    body: "Secure one-time payment. No subscription, no hidden fees.",
  },
  {
    title: "Download instantly",
    body: "Get your private download link the moment payment is confirmed.",
  },
];

export default async function HomePage() {
  const niches = (await getNiches()) ?? [];
  const featured = niches.filter((niche) => niche.featured);
  const list = featured.length > 0 ? featured : niches;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="cinema-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="cinema-spotlight pointer-events-none absolute inset-0" />
          <div className="cinema-noise pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply dark:mix-blend-screen" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent" />

          <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
            <span className="animate-fade-up inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tracking-wide text-fg-muted">
              ONE-TIME PURCHASE · INSTANT PDF DOWNLOAD
            </span>
            <h1
              className="animate-fade-up mx-auto mt-7 max-w-4xl text-balance text-4xl font-extrabold tracking-tight text-gradient sm:text-6xl sm:leading-[1.05]"
              style={{ animationDelay: "80ms" }}
            >
              Practical PDF bundles for every niche
            </h1>
            <p
              className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-fg-muted"
              style={{ animationDelay: "160ms" }}
            >
              {SITE_NAME} curates ready-to-use playbooks, templates and checklists.
              Buy once, download forever — no subscriptions.
            </p>
            <div
              className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <a
                href="#bundles"
                className="rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
              >
                Browse all bundles
              </a>
              <a
                href="#how"
                className="rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold text-fg transition hover:bg-surface-muted"
              >
                How it works
              </a>
            </div>
          </div>
        </section>

        <section id="bundles" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-fg">
                Explore by niche
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                Every niche has its own landing page with a ready-to-buy bundle.
              </p>
            </div>
          </div>

          {list.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-border bg-surface-muted p-8 text-center text-sm text-fg-muted">
              No bundles published yet. Add niches and products from the admin
              dashboard.
            </p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((niche) => (
                <NicheCard key={niche.id} niche={niche} />
              ))}
            </div>
          )}
        </section>

        <section id="how" className="border-y border-border bg-surface-muted">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-fg">
              How it works
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-fg/30"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-fg">{step.title}</h3>
                  <p className="mt-1 text-sm text-fg-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter niches={niches} />
    </div>
  );
}
