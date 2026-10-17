import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BundleCard } from "@/components/site/bundle-card";
import { SocialLinks } from "@/components/site/social-links";
import { getNiche, getNiches } from "@/lib/server-api";
import { resourceUrl } from "@/lib/site";
import { formatCurrency } from "@/lib/format";
import { LEARNING_LEVEL_LABEL } from "@/lib/types";

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
    title: `${niche.name} — bundles`,
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
                {niche.tagline ?? `Practical bundles for ${niche.name}`}
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
                  href="#bundles"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                >
                  Browse the bundles
                  <span aria-hidden>↓</span>
                </a>
                <span className="text-sm text-fg-muted">
                  {niche.products.length} bundle
                  {niche.products.length === 1 ? "" : "s"} · one-time payment
                </span>
                <SocialLinks slug={niche.slug} />
              </div>
            </div>

            {niche.products.length > 0 ? (
              <div
                className="animate-fade-up rounded-3xl border border-border bg-card/80 p-3 shadow-2xl shadow-black/5 backdrop-blur dark:shadow-black/40"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                    In this area
                  </span>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: niche.accentColor }}
                  />
                </div>
                <div className="space-y-1">
                  {niche.products.slice(0, 4).map((product) => (
                    <Link
                      key={product.id}
                      href={resourceUrl(niche.slug, product.slug)}
                      className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition hover:bg-surface-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fg">
                          {product.name}
                        </span>
                        <span className="block text-xs text-fg-muted">
                          {LEARNING_LEVEL_LABEL[product.level]}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-fg">
                        {formatCurrency(product.priceAmount, product.currency)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section id="bundles" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              {niche.name} bundles
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              One-time purchase. Access is delivered immediately after payment.
            </p>
          </div>

          {niche.products.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-border bg-surface-muted p-8 text-center text-sm text-fg-muted">
              No bundles available in this area yet.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {niche.products.map((product) => (
                <BundleCard
                  key={product.id}
                  product={product}
                  nicheSlug={niche.slug}
                  accentColor={niche.accentColor}
                />
              ))}
            </div>
          )}
        </section>

        {niche.problems.length > 0 ? (
          <section className="border-y border-border bg-surface-muted">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold tracking-tight text-fg">
                  What these bundles help with
                </h2>
                <p className="mt-2 text-sm text-fg-muted">
                  Situations people in {niche.name} are usually dealing with.
                </p>
              </div>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {niche.problems.map((problem) => (
                  <li
                    key={problem}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-fg-muted"
                  >
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
                      ✓
                    </span>
                    {problem}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-fg">One-time payment</h3>
              <p className="mt-1 text-sm text-fg-muted">
                Pay once for lifetime access. No recurring charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Secured by Paddle</h3>
              <p className="mt-1 text-sm text-fg-muted">
                Payments and taxes are handled by Paddle as merchant of record.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Instant access</h3>
              <p className="mt-1 text-sm text-fg-muted">
                A private access link appears right after checkout.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter niches={niches ?? []} />
    </div>
  );
}
