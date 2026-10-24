import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ProductCard } from "@/components/site/product-card";
import { SocialLinks } from "@/components/site/social-links";
import { getNiche, getNiches } from "@/lib/server-api";

export const revalidate = 30;

interface NichePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: NichePageProps): Promise<Metadata> {
  const { slug } = await params;
  const niche = await getNiche(slug);
  if (!niche) {
    return { title: "Area not found" };
  }
  return {
    title: `${niche.name} — guides`,
    description: niche.tagline ?? niche.description ?? undefined,
  };
}

export default async function NichePage({ params }: NichePageProps) {
  const { slug } = await params;
  const [niche, niches] = await Promise.all([getNiche(slug), getNiches()]);

  if (!niche) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches ?? []} currentNicheName={niche.name} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(55% 80% at 12% 0%, ${niche.accentColor}26, transparent 65%)`,
            }}
          />
          <div className="cinema-grid pointer-events-none absolute inset-0 opacity-40" />
          <div
            className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: niche.accentColor }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="animate-fade-up inline-flex items-center gap-3">
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white shadow-lg"
                  style={{ backgroundColor: niche.accentColor }}
                >
                  {niche.name.charAt(0)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
                  1section · {niche.name}
                </span>
              </div>

              <h1
                className="animate-fade-up mt-7 max-w-2xl text-balance text-4xl font-extrabold tracking-tight text-gradient sm:text-6xl sm:leading-[1.05]"
                style={{ animationDelay: "80ms" }}
              >
                {niche.tagline ?? `Practical guides for ${niche.name}`}
              </h1>

              {niche.description ? (
                <p
                  className="animate-fade-up mt-6 max-w-xl whitespace-pre-line text-lg text-fg-muted"
                  style={{ animationDelay: "160ms" }}
                >
                  {niche.description}
                </p>
              ) : null}

              {niche.audience ? (
                <p
                  className="animate-fade-up mt-6 max-w-xl rounded-2xl border border-border bg-card/70 p-4 text-sm text-fg-muted backdrop-blur"
                  style={{ animationDelay: "220ms" }}
                >
                  <span className="font-semibold text-fg">Who this is for: </span>
                  {niche.audience}
                </p>
              ) : null}

              <div
                className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "300ms" }}
              >
                <a
                  href="#guides"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                >
                  Browse the guides
                  <span aria-hidden>↓</span>
                </a>
                <span className="text-sm text-fg-muted">
                  {niche.products.length} guide
                  {niche.products.length === 1 ? "" : "s"} · one-time payment
                </span>
                <SocialLinks slug={niche.slug} />
              </div>
            </div>

            {niche.problems.length > 0 ? (
              <div
                className="animate-fade-up rounded-3xl border border-border bg-card/80 p-6 shadow-2xl shadow-black/5 backdrop-blur dark:shadow-black/40"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                    What these guides help with
                  </span>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: niche.accentColor }}
                  />
                </div>
                <ul className="mt-5 space-y-3">
                  {niche.problems.map((problem) => (
                    <li
                      key={problem}
                      className="flex items-start gap-3 text-sm text-fg-muted"
                    >
                      <span
                        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: niche.accentColor }}
                      >
                        ✓
                      </span>
                      <span>{problem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>

        <section id="guides" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              {niche.name} guides
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              One-time purchase. Access is delivered immediately after payment.
            </p>
          </div>

          {niche.products.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-border bg-surface-muted p-8 text-center text-sm text-fg-muted">
              No guides available in this area yet.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {niche.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  nicheSlug={niche.slug}
                  accentColor={niche.accentColor}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      <SiteFooter niches={niches ?? []} />
    </div>
  );
}
