import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ProductCard } from "@/components/site/product-card";
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
    return { title: "Niche not found" };
  }
  return {
    title: `${niche.name} PDF bundles`,
    description: niche.tagline ?? undefined,
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
      <SiteHeader niches={niches ?? []} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="cinema-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="cinema-spotlight pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface to-transparent" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <Link
              href="/"
              className="text-sm font-medium text-fg-muted transition hover:text-fg"
            >
              ← All niches
            </Link>

            <div className="animate-fade-up mt-6 flex items-start gap-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border bg-accent text-xl font-bold text-accent-fg shadow-lg">
                {niche.name.charAt(0)}
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl">
                  {niche.name}
                </h1>
                {niche.tagline ? (
                  <p className="mt-2 max-w-2xl text-lg text-fg-muted">
                    {niche.tagline}
                  </p>
                ) : null}
              </div>
            </div>

            {niche.description ? (
              <p className="mt-6 max-w-3xl whitespace-pre-line text-base text-fg-muted">
                {niche.description}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-fg">
              Get the {niche.name} bundle
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              One-time purchase. Downloaded as soon as your payment is confirmed.
            </p>
          </div>

          {niche.products.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface-muted p-8 text-center text-sm text-fg-muted">
              No bundles available in this niche yet.
            </p>
          ) : (
            <div className="space-y-8">
              {niche.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <section className="border-t border-border bg-surface-muted">
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
              <h3 className="font-semibold text-fg">Instant delivery</h3>
              <p className="mt-1 text-sm text-fg-muted">
                A private download link appears right after checkout.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter niches={niches ?? []} />
    </div>
  );
}
