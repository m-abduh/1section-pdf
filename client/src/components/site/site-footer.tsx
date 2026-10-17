import Link from "next/link";
import type { Niche } from "@/lib/types";
import { SITE_NAME, nicheUrl } from "@/lib/site";

export function SiteFooter({ niches = [] }: { niches?: Niche[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
              1S
            </span>
            <span className="text-lg font-semibold text-fg">{SITE_NAME}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-fg-muted">
            Practical PDF bundles you can download instantly. One-time payment,
            lifetime access.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-fg">Niches</h3>
          <ul className="mt-3 space-y-2">
            {niches.map((niche) => (
              <li key={niche.id}>
                <a
                  href={nicheUrl(niche.slug)}
                  className="text-sm text-fg-muted transition hover:text-fg"
                >
                  {niche.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-fg">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            <li>Payments secured by Paddle</li>
            <li>Instant digital delivery</li>
            <li>
              <Link href="/checkout/success" className="transition hover:text-fg">
                Retrieve a purchase
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-fg-muted sm:px-6">
          © {year} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
