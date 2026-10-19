import type { Niche } from "@/lib/types";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const LEGAL_UPDATED = "October 2026";

export function LegalLayout({
  title,
  intro,
  niches = [],
  children,
}: {
  title: string;
  intro?: string;
  niches?: Niche[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm text-fg-muted">
              Last updated: {LEGAL_UPDATED}
            </p>
            {intro ? (
              <p className="mt-4 text-lg text-fg-muted">{intro}</p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="space-y-8 text-sm leading-relaxed text-fg-muted [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-fg [&_h2]:tracking-tight">
            {children}
          </div>
        </section>
      </main>
      <SiteFooter niches={niches} />
    </div>
  );
}
