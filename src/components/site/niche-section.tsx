import Link from "next/link";
import type { Niche } from "@/lib/types";
import { nicheUrl } from "@/lib/site";
import { SocialLinks } from "@/components/site/social-links";

export function NicheSection({
  niche,
  index,
  reversed = false,
}: {
  niche: Niche;
  index: number;
  reversed?: boolean;
}) {
  const count = niche._count?.products ?? 0;
  const problems = niche.problems ?? [];

  return (
    <div className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div className={reversed ? "lg:order-2" : ""}>
          <div className="flex items-center gap-3">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: niche.accentColor }}
            />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Area {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <h3 className="mt-5 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            {niche.name}
          </h3>
          <p className="mt-4 text-lg text-fg-muted">
            {niche.tagline ?? `Practical guides for ${niche.name}`}
          </p>

          {niche.description ? (
            <p className="mt-4 whitespace-pre-line text-sm text-fg-muted">
              {niche.description}
            </p>
          ) : null}

          {niche.audience ? (
            <p className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm text-fg-muted">
              <span className="font-semibold text-fg">Who this is for: </span>
              {niche.audience}
            </p>
          ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={nicheUrl(niche.slug)}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
              >
                Explore {count} guide{count === 1 ? "" : "s"}
                <span aria-hidden>→</span>
              </Link>
              <SocialLinks slug={niche.slug} />
            </div>
          </div>

        <div className={reversed ? "lg:order-1" : ""}>
          {problems.length > 0 ? (
            <div className="rounded-3xl border border-border bg-surface-muted p-6 sm:p-8">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
                Problems covered here
              </h4>
              <ul className="mt-5 space-y-4">
                {problems.map((problem) => (
                  <li key={problem} className="flex gap-3 text-sm text-fg-muted">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: niche.accentColor }}
                    />
                    <span>{problem}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
